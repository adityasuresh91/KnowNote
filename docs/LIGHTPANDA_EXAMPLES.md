# Lightpanda Integration Examples

## Example 1: Simple Web Scraping

Fetch a webpage and extract content:

```typescript
import { BrowserFetchAdapter } from '../src/main/services/BrowserFetchAdapter'

async function scrapeWebsite() {
  const adapter = new BrowserFetchAdapter()

  try {
    const result = await adapter.fetchUrl('https://example.com')
    console.log('Title:', result.title)
    console.log('Content length:', result.content.length)
  } finally {
    await adapter.cleanup()
  }
}

scrapeWebsite()
```

## Example 2: JavaScript-Heavy Sites

For Single Page Applications (SPAs) or dynamically loaded content:

```typescript
async function scrapeReactApp() {
  const adapter = new BrowserFetchAdapter()

  try {
    const result = await adapter.fetchUrl('https://react-app.example.com', {
      enableJavaScript: true,
      extractMainContent: true,
      convertToMarkdown: true
    })

    console.log('Rendered content:', result.content)
    console.log('Was rendered with browser:', result.metadata?.renderedWithBrowser)
  } finally {
    await adapter.cleanup()
  }
}
```

## Example 3: Waiting for Dynamic Content

Wait for specific elements to load before extraction:

```typescript
import { LightpandaBrowserService } from '../src/main/services/LightpandaBrowserService'

async function scrapeWithWait() {
  const browser = new LightpandaBrowserService()

  try {
    await browser.initBrowser()

    const result = await browser.fetchUrl('https://example.com/infinite-scroll', {
      waitForSelector: '.article-content',
      waitForTimeout: 8000,
      extractMainContent: true
    })

    console.log('Article loaded:', result.title)
  } finally {
    await browser.close()
  }
}
```

## Example 4: Bulk Processing with Fallback

Process multiple URLs with smart fallback:

```typescript
async function bulkScrape(urls: string[]) {
  const adapter = new BrowserFetchAdapter()

  const results = []

  for (const url of urls) {
    try {
      // Try with JavaScript first for better content
      const result = await adapter.fetchUrl(url, {
        enableJavaScript: true,
        fallbackOnError: true
      })

      results.push({
        url,
        success: true,
        content: result.content,
        title: result.title
      })
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error)
      results.push({
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  await adapter.cleanup()
  return results
}
```

## Example 5: Integration with KnowledgeService

Extend KnowledgeService to use Lightpanda:

```typescript
// In src/main/services/KnowledgeService.ts

import { BrowserFetchAdapter } from './BrowserFetchAdapter'

export class KnowledgeService {
  private webFetchService: WebFetchService
  private browserAdapter: BrowserFetchAdapter

  constructor() {
    // ... existing initialization
    this.webFetchService = new WebFetchService()
    this.browserAdapter = new BrowserFetchAdapter()
  }

  /**
   * Fetch web content with intelligent service selection
   */
  async fetchWebContent(url: string, forceJavaScript: boolean = false) {
    try {
      // Validate URL
      if (!this.browserAdapter.isValidUrl(url)) {
        throw new Error('Invalid URL')
      }

      // Use standard service first, escalate to Lightpanda if needed
      return await this.browserAdapter.fetchUrl(url, {
        enableJavaScript: forceJavaScript,
        extractMainContent: true,
        convertToMarkdown: true,
        fallbackOnError: true
      })
    } catch (error) {
      Logger.error('KnowledgeService', 'Failed to fetch web content:', error)
      throw error
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.browserAdapter.cleanup()
  }
}
```

## Example 6: Custom Configuration

Override default settings:

```typescript
async function customScrape() {
  const adapter = new BrowserFetchAdapter()

  try {
    const result = await adapter.fetchUrl('https://example.com', {
      timeout: 120000, // 2 minute timeout
      enableJavaScript: true,
      extractMainContent: true,
      convertToMarkdown: true,
      userAgent: 'Custom Bot 1.0', // Custom user agent
      fallbackOnError: true
    })

    return result
  } finally {
    await adapter.cleanup()
  }
}
```

## Example 7: Error Handling and Retries

Robust error handling with retry logic:

```typescript
async function scrapeWithRetry(url: string, maxRetries: number = 3) {
  const adapter = new BrowserFetchAdapter()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Fetching ${url}`)

      const result = await adapter.fetchUrl(url, {
        enableJavaScript: true,
        timeout: 60000 * attempt // Increase timeout with each retry
      })

      console.log('Success!')
      return result
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error instanceof Error ? error.message : error)

      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`)
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }

  return null
}
```

## Example 8: Monitoring and Logging

Track performance and resource usage:

```typescript
async function monitoredScrape(url: string) {
  const adapter = new BrowserFetchAdapter()
  const startTime = Date.now()
  const startMemory = process.memoryUsage().heapUsed

  try {
    const result = await adapter.fetchUrl(url, {
      enableJavaScript: true
    })

    const duration = Date.now() - startTime
    const memoryDelta = process.memoryUsage().heapUsed - startMemory

    console.log('Performance Metrics:', {
      url,
      duration: `${duration}ms`,
      contentLength: result.content.length,
      memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
      renderedWithBrowser: result.metadata?.renderedWithBrowser
    })

    return result
  } finally {
    await adapter.cleanup()
  }
}
```

## Example 9: Content Type Detection

Handle different content types appropriately:

```typescript
async function smartFetch(url: string) {
  const adapter = new BrowserFetchAdapter()

  try {
    // First, try standard fetch to detect content type
    try {
      const response = await fetch(url)
      const contentType = response.headers.get('content-type') || ''

      // If it's not HTML, don't use Lightpanda
      if (!contentType.includes('text/html')) {
        console.log('Non-HTML content, using standard service')
        return await adapter.fetchUrl(url, { enableJavaScript: false })
      }

      // Check if we need JavaScript (by URL pattern or other heuristics)
      const needsJavaScript = url.includes('/spa/') || url.includes('app.')

      return await adapter.fetchUrl(url, {
        enableJavaScript: needsJavaScript
      })
    } catch (preCheckError) {
      // If pre-check fails, use standard fetch with JavaScript fallback
      return await adapter.fetchUrl(url, {
        enableJavaScript: true,
        fallbackOnError: true
      })
    }
  } finally {
    await adapter.cleanup()
  }
}
```

## Example 10: Batch Processing with Rate Limiting

Process multiple URLs with rate limiting:

```typescript
async function batchScrapeWithRateLimit(
  urls: string[],
  concurrency: number = 2,
  delayMs: number = 1000
) {
  const adapter = new BrowserFetchAdapter()
  const results = []
  let currentIndex = 0

  const worker = async () => {
    while (currentIndex < urls.length) {
      const url = urls[currentIndex++]

      try {
        const result = await adapter.fetchUrl(url, {
          enableJavaScript: true,
          fallbackOnError: true
        })

        results.push({ url, success: true, content: result.content })
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  // Run workers in parallel
  const workers = Array.from({ length: concurrency }, () => worker())
  await Promise.all(workers)
  await adapter.cleanup()

  return results
}
```

## Integration with IPC (Electron)

For use in Electron main/renderer process communication:

```typescript
// In main process (ipcMain)
import { ipcMain } from 'electron'
import { BrowserFetchAdapter } from './services/BrowserFetchAdapter'

const adapter = new BrowserFetchAdapter()

ipcMain.handle('fetch-web-content', async (event, url: string, options) => {
  try {
    return await adapter.fetchUrl(url, options)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// In renderer process
const result = await window.electron.ipcRenderer.invoke(
  'fetch-web-content',
  'https://example.com',
  {
    enableJavaScript: true
  }
)
```

## Best Practices

1. **Always cleanup**: Use try/finally to ensure `cleanup()` is called
2. **Set reasonable timeouts**: Adjust based on target websites
3. **Use fallback**: Enable `fallbackOnError` for production robustness
4. **Monitor performance**: Log metrics for optimization
5. **Batch operations**: Use rate limiting to avoid overwhelming servers
6. **Error handling**: Implement proper error handling and retries
7. **Resource limits**: Monitor memory usage in long-running operations
