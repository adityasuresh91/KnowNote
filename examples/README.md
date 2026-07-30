# KnowNote Video Processing Examples

This directory contains practical examples demonstrating how to use KnowNote's video processing capabilities.

## Files

### `video-processing-example.ts`

Complete examples showing:

1. **Basic Video Processing** - Load and process a single video file
   - Check format support
   - Process video and extract metadata
   - Display content preview

2. **FileParserService Integration** - Use the centralized parser service
   - Automatic format detection
   - Structure preservation
   - Frame information extraction

3. **Batch Processing** - Process multiple videos efficiently
   - Sequential processing
   - Error handling
   - Summary statistics

4. **RAG Pipeline Integration** - Prepare video content for search and retrieval
   - Document structure analysis
   - Embedding strategy
   - Metadata preservation

5. **Custom Processing Options** - Fine-tune video processing behavior
   - Structure preservation options
   - Image extraction settings
   - Performance optimization

## Running Examples

### Quick Start

```bash
# Navigate to project root
cd /path/to/KnowNote

# Install dependencies
pnpm install

# Run the examples (uncomment specific examples in the file first)
pnpm run dev
```

### Running Individual Examples

Edit `video-processing-example.ts` to uncomment the example you want to run:

```typescript
// In main() function:
await example1_basicProcessing()
// await example2_usingParserService()
// await example3_batchProcessing()
// etc.
```

## Preparing Test Videos

### Using FFmpeg

Create a test video:

```bash
# Create a 10-second test video
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 -f lavfi -i sine=f=1000:d=10 test-video.mp4

# Create from existing video (first 30 seconds)
ffmpeg -i input.mp4 -t 30 -c copy test-video.mp4
```

### Expected Output

For a 10-30 second test video:
- Processing time: 15-30 seconds
- Frame count: 8-24 frames
- Output size: 10-20 KB of text content

## Example Output

```
=== Example 1: Basic Video Processing ===

✓ Video processed successfully
Title: sample-video
Content length: 2847 characters
MIME type: video/processed

Metadata:
  Duration: 120s
  Resolution: 1920x1080
  Frame count: 24
  Codec: h264

Content preview:
# Video Content Analysis
## Video Metadata
- Duration: 120 seconds
- Resolution: 1920x1080
...
```

## Troubleshooting

### "ffmpeg not found" Error

```bash
# Install FFmpeg
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg           # macOS

# Verify installation
which ffmpeg
ffmpeg -version
```

### Video Processing Timeout

- Use shorter test videos (< 1 minute)
- Check available disk space for temp files
- Monitor system resources

### Import Errors

Ensure TypeScript paths are configured correctly:

```bash
# Check tsconfig.json includes correct paths
cat tsconfig.json | grep -A5 '"paths"'
```

## Using in Your Application

### Direct Usage

```typescript
import { VideoLoader } from '../src/main/services/loaders/VideoLoader'

const loader = new VideoLoader()
const result = await loader.loadFromPath('./video.mp4')
console.log(result)
```

### Through FileParserService

```typescript
import { FileParserService } from '../src/main/services/FileParserService'

const service = new FileParserService()
const result = await service.parseFile('./video.mp4')
console.log(result)
```

## Next Steps

After running the examples:

1. **Integrate into KnowNote UI**
   - Add video upload functionality
   - Display processing progress
   - Show extracted metadata

2. **Enhance Analysis**
   - Install claude-video skill for AI analysis
   - Add custom frame descriptions
   - Extract video transcripts

3. **Optimize Performance**
   - Implement caching for repeated videos
   - Parallel processing for batches
   - Streaming for large videos

## Additional Resources

- [VIDEO_SUPPORT.md](../VIDEO_SUPPORT.md) - User guide and troubleshooting
- [CLAUDE_VIDEO_SETUP.md](../CLAUDE_VIDEO_SETUP.md) - Setup and configuration
- [VideoLoader Source](../src/main/services/loaders/VideoLoader.ts) - Implementation details

## Support

For issues or questions:

1. Check troubleshooting sections in documentation
2. Review VideoLoader logs: `DEBUG=knownote:video`
3. Open GitHub issue with error details

---

Happy video processing! 🎬
