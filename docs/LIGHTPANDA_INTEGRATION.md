# Lightpanda Browser Integration Guide

This document explains how to use Lightpanda browser for advanced web scraping in KnowNote.

## Overview

KnowNote now supports **Lightpanda**, a performant, headless browser written in Zig, for advanced web content extraction. Lightpanda provides:

- **JavaScript rendering**: Execute JavaScript on web pages before extraction
- **Better content detection**: More intelligent DOM parsing
- **Complex interactions**: Wait for dynamic content, handle SPAs
- **Performance**: Faster rendering compared to traditional browser automation

## Installation

The Lightpanda npm package (`@lightpanda/browser`) is already added to the project.

To install dependencies:

```bash
pnpm install
```

## Usage

### Basic Usage with BrowserFetchAdapter

The recommended way to use Lightpanda is through the `BrowserFetchAdapter`, which intelligently chooses between standard and Lightpanda-based fetching:

```typescript
import { BrowserFetchAdapter } from './services/BrowserFetchAdapter'

const adapter = new BrowserFetchAdapter()

// Fetch with standard method (fast, no JavaScript rendering)
const result = await adapter.fetchUrl('https://example.com')

// Fetch with Lightpanda (JavaScript rendering enabled)
const result = await adapter.fetchUrl('https://example.com', {
  enableJavaScript: true
})

// Cleanup when done
await adapter.cleanup()
```

### Using Lightpanda Directly

For advanced use cases, use the `LightpandaBrowserService` directly:

```typescript
import { LightpandaBrowserService } from './services/LightpandaBrowserService'

const browser = new LightpandaBrowserService()
await browser.initBrowser()

const result = await browser.fetchUrl('https://example.com', {
  extractMainContent: true,
  convertToMarkdown: true,
  waitForSelector: '.article-content',
  waitForTimeout: 5000
})

await browser.close()
```

### Integration with KnowledgeService

To integrate Lightpanda with existing web content extraction in KnowledgeService:

```typescript
// In KnowledgeService.ts
private browserAdapter: BrowserFetchAdapter

constructor() {
  // ... existing code
  this.browserAdapter = new BrowserFetchAdapter()
}

async fetchWebContent(url: string, requiresJavaScript: boolean = false) {
  return this.browserAdapter.fetchUrl(url, {
    enableJavaScript: requiresJavaScript,
    extractMainContent: true,
    convertToMarkdown: true,
    fallbackOnError: true
  })
}

async cleanup() {
  await this.browserAdapter.cleanup()
}
```

## API Reference

### BrowserFetchAdapter

**Methods:**

- `fetchUrl(url: string, options?: AdaptiveOptions): Promise<FetchResult>` - Fetch URL content with adaptive method selection
- `initLightpanda(): Promise<boolean>` - Initialize Lightpanda browser
- `isLightpandaAvailable(): boolean` - Check if Lightpanda is available
- `cleanup(): Promise<void>` - Close browser and cleanup resources
- `isValidUrl(url: string): boolean` - Validate URL format

**Options:**

```typescript
interface AdaptiveOptions extends FetchOptions {
  preferLightpanda?: boolean // Force use of Lightpanda
  fallbackOnError?: boolean // Fallback to standard service on error
  enableJavaScript?: boolean // Enable JavaScript rendering
}
```

### LightpandaBrowserService

**Methods:**

- `fetchUrl(url: string, options?: LightpandaFetchOptions): Promise<LightpandaFetchResult>` - Fetch URL with Lightpanda
- `initBrowser(): Promise<void>` - Initialize browser
- `close(): Promise<void>` - Close browser
- `isValidUrl(url: string): boolean` - Validate URL
- `isBrowserAvailable(): boolean` - Check if browser is initialized

**Options:**

```typescript
interface LightpandaFetchOptions {
  timeout?: number // Request timeout (default: 60000ms)
  waitUntilLoad?: boolean // Wait for page load (default: true)
  extractMainContent?: boolean // Extract main article (default: true)
  convertToMarkdown?: boolean // Convert HTML to Markdown (default: true)
  userAgent?: string // Custom User-Agent
  waitForSelector?: string // CSS selector to wait for
  waitForTimeout?: number // Selector timeout (default: 5000ms)
}
```

## When to Use Lightpanda

Use Lightpanda when:

- ✅ Page content is rendered with JavaScript (React, Vue, Angular apps)
- ✅ Content loads dynamically after page load
- ✅ Need to wait for specific elements before extraction
- ✅ Complex page layouts that need full DOM rendering

Use standard WebFetchService when:

- ✅ Static HTML content
- ✅ Performance is critical (standard method is faster)
- ✅ No JavaScript rendering needed
- ✅ Simple HTML pages

## Performance Considerations

1. **Standard service**: ~50-200ms per page (no rendering)
2. **Lightpanda**: ~1-3 seconds per page (includes rendering)

For bulk operations, prefer the standard service and only use Lightpanda for URLs that require JavaScript.

## Error Handling

```typescript
const adapter = new BrowserFetchAdapter()

try {
  const result = await adapter.fetchUrl(url, {
    enableJavaScript: true,
    fallbackOnError: true // Automatically fallback on error
  })
} catch (error) {
  console.error('Failed to fetch URL:', error)
} finally {
  await adapter.cleanup()
}
```

## Environment Setup

### Linux

```bash
# Install dependencies
sudo apt-get install libglib2.0-0 libxrender1 libxkbcommon0

# Run with Lightpanda
pnpm dev
```

### macOS

Pre-built binaries are provided. No additional setup needed.

### Windows

Pre-built binaries are provided. Ensure system dependencies are installed.

## Troubleshooting

### Browser initialization fails

```typescript
const available = await adapter.initLightpanda()
if (!available) {
  console.warn('Lightpanda not available, using standard service')
  // System will automatically fallback to standard WebFetchService
}
```

### Page content not loading

Increase wait timeouts:

```typescript
const result = await browser.fetchUrl(url, {
  waitForSelector: '.content',
  waitForTimeout: 10000 // Increase to 10 seconds
})
```

### Memory usage concerns

Always cleanup after use:

```typescript
const adapter = new BrowserFetchAdapter()
try {
  // ... fetch operations
} finally {
  await adapter.cleanup() // Important: close browser
}
```

## Future Enhancements

Potential improvements:

- [ ] Connection pooling for multiple browser instances
- [ ] Caching of rendered content
- [ ] Screenshot capture capability
- [ ] Form interaction and submission
- [ ] PDF conversion
- [ ] Cookie and session management

## References

- [Lightpanda Official Docs](https://github.com/lightpanda-io/browser)
- [Lightpanda NPM Package](https://www.npmjs.com/package/@lightpanda/browser)
- [WebFetchService Documentation](./WEBFETCH_SERVICE.md)
