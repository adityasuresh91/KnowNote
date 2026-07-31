# Lightpanda Setup and Integration Guide

This guide covers the complete setup and integration of Lightpanda browser into KnowNote.

## Installation

### Prerequisites

- Node.js 18+ (already installed)
- pnpm (already configured in the project)

### Step 1: Install Dependencies

```bash
cd /home/user/KnowNote
pnpm install
```

The `@lightpanda/browser` package is already added to `package.json`.

### Step 2: Verify Installation

```bash
# Check TypeScript compilation
npm run typecheck

# Verify Lightpanda is available
node -e "import('@lightpanda/browser').then(m => console.log('✓ Lightpanda loaded'))"
```

## Integration Points

### 1. KnowledgeService Enhancement

The `KnowledgeService` has been enhanced with Lightpanda support:

```typescript
// From src/main/services/KnowledgeService.ts
async addDocumentFromUrl(
  notebookId: string,
  url: string,
  onProgress?: IndexProgressCallback,
  enableJavaScript: boolean = false
): Promise<string>
```

**Features:**
- Smart fallback: tries standard method first, falls back to Lightpanda if needed
- Adaptive rendering: automatically uses JavaScript rendering for complex pages
- Intelligent detection: upgrades to Lightpanda if initial content seems insufficient

### 2. BrowserFetchAdapter

Located at `src/main/services/BrowserFetchAdapter.ts`, this adapter provides intelligent service selection:

```typescript
const adapter = new BrowserFetchAdapter()

// Standard fetch (fast)
const result = await adapter.fetchUrl(url)

// With JavaScript rendering
const result = await adapter.fetchUrl(url, { enableJavaScript: true })

await adapter.cleanup()
```

### 3. LightpandaBrowserService

Direct access to Lightpanda for advanced use cases:

```typescript
import { LightpandaBrowserService } from './services/LightpandaBrowserService'

const browser = new LightpandaBrowserService()
await browser.initBrowser()

const result = await browser.fetchUrl('https://example.com', {
  extractMainContent: true,
  convertToMarkdown: true
})

await browser.close()
```

## Usage Examples

### Example 1: Basic URL Import

```typescript
// In your Electron IPC handler or service
const knowledgeService = new KnowledgeService(providerManager)

// Add webpage to knowledge base
const documentId = await knowledgeService.addDocumentFromUrl(
  notebookId,
  'https://example.com/article',
  (stage, progress) => {
    console.log(`${stage}: ${progress}%`)
  },
  false // disable JavaScript for faster processing
)

console.log('Document added:', documentId)
```

### Example 2: JavaScript-Heavy Page

```typescript
// For Single Page Applications or dynamically loaded content
const documentId = await knowledgeService.addDocumentFromUrl(
  notebookId,
  'https://react-app.example.com',
  undefined,
  true // enable JavaScript rendering
)
```

### Example 3: Cleanup on App Exit

```typescript
// In your Electron main process exit handler
async function onAppQuit() {
  await knowledgeService.cleanup()
  // ... other cleanup
}

app.on('before-quit', onAppQuit)
```

## Configuration

### Lightpanda Fetch Options

```typescript
interface LightpandaBrowserFetchOptions {
  // Request timeout in milliseconds (default: 60000)
  timeout?: number

  // Extract main article content (default: true)
  extractMainContent?: boolean

  // Convert HTML to Markdown (default: true)
  convertToMarkdown?: boolean

  // Custom User-Agent header
  userAgent?: string

  // Disable host verification for HTTPS (default: false)
  disableHostVerification?: boolean

  // Obey robots.txt (default: true)
  obeyRobots?: boolean

  // Output format (default: 'html')
  outputFormat?: 'html' | 'markdown'
}
```

### Adaptive Fetch Options

```typescript
interface AdaptiveOptions {
  // Use Lightpanda instead of standard service
  preferLightpanda?: boolean

  // Enable JavaScript rendering
  enableJavaScript?: boolean

  // Fallback to standard service on error
  fallbackOnError?: boolean

  // ... plus all WebFetchService options
}
```

## Performance Tuning

### For Maximum Speed

```typescript
// Use standard service only
const result = await browserFetchAdapter.fetchUrl(url, {
  enableJavaScript: false,
  extractMainContent: true,
  convertToMarkdown: true
})
```

### For Complex Pages

```typescript
// Use Lightpanda for JavaScript rendering
const result = await browserFetchAdapter.fetchUrl(url, {
  enableJavaScript: true,
  extractMainContent: true,
  convertToMarkdown: true,
  timeout: 120000 // longer timeout for rendering
})
```

## Environment Variables

Optional environment variables for Lightpanda:

```bash
# Disable telemetry collection
export LIGHTPANDA_DISABLE_TELEMETRY=1

# Set custom binary location (if needed)
export LIGHTPANDA_BIN=/path/to/lightpanda

# Enable debug logging
export DEBUG=lightpanda:*
```

## Troubleshooting

### Issue: "Browser initialization fails"

**Solution:**
```typescript
const available = await adapter.initLightpanda()
if (!available) {
  console.warn('Lightpanda not available, using standard fetch')
  // System will automatically fallback
}
```

### Issue: "Timeout errors on slow networks"

**Solution:**
```typescript
const result = await adapter.fetchUrl(url, {
  timeout: 120000, // increase timeout
  enableJavaScript: true
})
```

### Issue: "Out of memory with large documents"

**Solution:**
```typescript
// Process in smaller batches
const urls = [...] // large list of URLs
for (const url of urls) {
  const result = await adapter.fetchUrl(url)
  // Process result
  // No batching - process one at a time
}

// Cleanup after batch
await adapter.cleanup()
```

### Issue: "Content extraction is incomplete"

**Solution:**
```typescript
// Try with Lightpanda for better DOM parsing
const result = await adapter.fetchUrl(url, {
  enableJavaScript: true,
  extractMainContent: true,
  convertToMarkdown: true,
  preferLightpanda: true
})
```

## Platform-Specific Notes

### Linux

Ensure system dependencies are installed:
```bash
sudo apt-get install libglib2.0-0 libxrender1 libxkbcommon0
```

### macOS

Pre-built binaries are included. No additional setup needed.

### Windows

Pre-built binaries are included. Ensure Visual C++ Runtime is installed.

## Testing

### Unit Tests

Create test file: `src/main/services/__tests__/BrowserFetchAdapter.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BrowserFetchAdapter } from '../BrowserFetchAdapter'

describe('BrowserFetchAdapter', () => {
  let adapter: BrowserFetchAdapter

  beforeEach(() => {
    adapter = new BrowserFetchAdapter()
  })

  afterEach(async () => {
    await adapter.cleanup()
  })

  it('should fetch HTML content', async () => {
    const result = await adapter.fetchUrl('https://example.com')
    expect(result.content).toBeDefined()
    expect(result.url).toBe('https://example.com')
  })

  it('should handle JavaScript rendering', async () => {
    const result = await adapter.fetchUrl('https://example.com', {
      enableJavaScript: true
    })
    expect(result.metadata?.renderedWithBrowser).toBe(true)
  })
})
```

## Performance Benchmarks

Typical performance metrics:

| Operation | Time | Notes |
|-----------|------|-------|
| Standard fetch (HTML) | 50-200ms | Fastest, for static pages |
| Lightpanda fetch (JS) | 1-3s | Slower, includes rendering |
| Large document (5MB) | 500-1000ms | Depends on content complexity |
| Markdown conversion | 50-100ms | Included in fetch time |

## Resource Cleanup

Always cleanup resources:

```typescript
const adapter = new BrowserFetchAdapter()

try {
  // ... operations
  const result = await adapter.fetchUrl(url)
} finally {
  // Critical: cleanup browser instances
  await adapter.cleanup()
}
```

## Next Steps

1. **Test with real URLs**: Try fetching actual websites
2. **Monitor performance**: Track fetch times and resource usage
3. **Customize extraction**: Adjust content selection for your use cases
4. **Integrate with UI**: Add JavaScript toggle in web page import dialog
5. **Handle errors gracefully**: Implement proper error handling in UI

## Support and Debugging

### Enable Debug Logging

```typescript
import Logger from '../../shared/utils/logger'

Logger.setLevel('debug')

// Now all services will log debug information
```

### Check Integration Status

```typescript
const adapter = new BrowserFetchAdapter()
console.log('Lightpanda available:', adapter.isLightpandaAvailable())
console.log('Standard service ready:', adapter.getStandardService() !== null)
```

### Report Issues

If you encounter issues, check:
1. `npm run typecheck` passes
2. All dependencies installed: `pnpm install`
3. Node version >= 18: `node --version`
4. System dependencies installed (Linux)
