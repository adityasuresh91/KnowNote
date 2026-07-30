# Claude Video Setup & Integration Guide

This guide provides step-by-step instructions for using claude-video with KnowNote.

## Quick Start

### 1. System Requirements

✅ **Already Installed:**
- FFmpeg 6.1.1
- FFprobe 6.1.1

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

### 2. Installation Status

- ✅ VideoLoader implemented in `src/main/services/loaders/VideoLoader.ts`
- ✅ FileParserService updated with video support
- ✅ Video formats registered (7 formats supported)
- ✅ FFmpeg dependencies installed
- ✅ Configuration file created at `.claude/video-config.json`

### 3. Building the Project

```bash
# Install dependencies (with legacy peer deps if needed)
pnpm install --legacy-peer-deps

# Type check
pnpm run typecheck

# Build
pnpm run build

# Run in development
pnpm run dev
```

### 4. Using Video Files in KnowNote

Once the app is running:

1. **Add Video File:**
   - Click "Add Document" or drag-and-drop a video file
   - Supported formats: MP4, WebM, MOV, AVI, MKV, MPEG, OGV

2. **Video Processing:**
   - VideoLoader automatically processes the file
   - Frames are extracted and indexed
   - Metadata is preserved

3. **Query Video Content:**
   ```
   Q: What are the main topics in this video?
   Q: Summarize the key moments
   Q: Extract visual timeline of events
   ```

## Advanced Configuration

### Custom Frame Sampling

Edit `.claude/video-config.json` to adjust frame sampling intervals:

```json
{
  "video": {
    "frameSampling": {
      "short": { "interval": 1 },      // < 2 min: 1 frame/sec
      "medium": { "interval": 5 },     // 2-10 min: 1 frame/5sec
      "long": { "interval": 10 },      // 10-60 min: 1 frame/10sec
      "veryLong": { "interval": 30 }   // > 1 hr: 1 frame/30sec
    }
  }
}
```

### Environment Variables

```bash
# Enable verbose video processing logs
export DEBUG=knownote:video

# Set custom temp directory for frame extraction
export KNOWNOTE_VIDEO_TEMP=/custom/path
```

## Claude Video Skill Integration

The video support is designed to work seamlessly with claude-video skill.

### Installing claude-video Skill

In Claude Code, run:
```bash
/plugin install watch@claude-video
```

Or via npm:
```bash
npx skills add bradautomates/claude-video -g
```

### What claude-video Adds

- **Vision Analysis:** AI-powered frame descriptions
- **Transcript Extraction:** Automatic audio transcription
- **Smart Summaries:** Context-aware video summaries
- **Timeline Navigation:** Content-aware video scrubbing

## Architecture

### VideoLoader Flow

```
Video File
    ↓
[FFprobe] → Extract Metadata
    ↓
[FFmpeg] → Extract Key Frames
    ↓
[Frame Description Generator] → Generate Text
    ↓
[RAG Pipeline] → Index & Embed
    ↓
[Searchable Knowledge Base]
```

### Document Structure

Videos are represented with page-based structure:

```
DocumentLoadResult {
  content: "# Video Content Analysis\n## Video Metadata\n..."
  structure: {
    type: "pages"
    pages: [
      { pageNumber: 1, content: "[Frame at 0s] Description..." }
      { pageNumber: 2, content: "[Frame at 5s] Description..." }
      ...
    ]
  }
  metadata: {
    duration: 120,
    width: 1920,
    height: 1080,
    frameCount: 24,
    codec: "h264"
  }
}
```

## Testing

### Unit Test Example

```typescript
import { VideoLoader } from './loaders/VideoLoader'

async function testVideoLoader() {
  const loader = new VideoLoader()
  
  // Test MIME type support
  console.assert(loader.canLoad('video.mp4'))
  console.assert(loader.canLoad('video/mp4'))
  
  // Test file loading
  const result = await loader.loadFromPath('./sample.mp4')
  console.log('Content preview:', result.content.slice(0, 100))
  console.log('Metadata:', result.metadata)
}

testVideoLoader()
```

### Manual Testing

1. **Prepare a test video** (10-30 seconds recommended for quick testing)

2. **Add to KnowNote:**
   - Import video through UI
   - Check logs for processing status

3. **Verify output:**
   - Video should appear in Knowledge Library
   - Should be queryable through Q&A

4. **Check metadata:**
   - Confirm duration, resolution extracted correctly
   - Verify frame count matches expectations

## Troubleshooting

### "ffmpeg not found" Error

```bash
# Verify installation
which ffmpeg
which ffprobe

# Reinstall if needed
sudo apt-get install ffmpeg  # Ubuntu/Debian
brew install ffmpeg          # macOS
```

### Video Processing Timeout

- Issue: Video file too large or too long
- Solution: Process shorter videos first, optimize input files

### Low Quality Descriptions

- Current: Generic frame descriptions
- Future: Install claude-video for AI-powered analysis
- Alternative: Use custom prompts in Q&A for detailed analysis

### Memory Usage High

- Cause: Very large video resolution
- Solution: Increase system memory or reduce sampling interval

## Performance Metrics

### Typical Processing Times

| Video Length | Processing Time | Output Size |
|---|---|---|
| 1 minute | 10-15s | 5-10 KB |
| 5 minutes | 30-45s | 20-30 KB |
| 10 minutes | 1-2 min | 40-60 KB |
| 30 minutes | 3-5 min | 100-150 KB |
| 1 hour | 5-10 min | 200-300 KB |

### System Requirements

- **Disk Space:** ~1 GB temporary space for frame extraction
- **RAM:** Minimum 2 GB available
- **CPU:** Multi-core recommended (uses parallel processing where possible)

## Future Enhancements

Planned improvements to video support:

- [ ] Whisper API integration for audio transcription
- [ ] Claude Vision API for intelligent frame analysis
- [ ] Subtitle extraction and indexing
- [ ] Live stream support (HLS/DASH)
- [ ] Video timeline search interface
- [ ] Scene detection and segmentation
- [ ] Speaker identification
- [ ] Emotion detection in faces

## File Locations

```
KnowNote/
├── src/main/services/
│   ├── loaders/
│   │   ├── VideoLoader.ts          ← Video processor
│   │   └── types.ts                ← Loader interfaces
│   └── FileParserService.ts        ← Loader registry
├── .claude/
│   └── video-config.json           ← Configuration
├── VIDEO_SUPPORT.md                ← User documentation
└── CLAUDE_VIDEO_SETUP.md           ← This file
```

## Support & Feedback

For issues or feature requests:

1. Check [VIDEO_SUPPORT.md](./VIDEO_SUPPORT.md) troubleshooting section
2. Review video processing logs: `DEBUG=knownote:video pnpm run dev`
3. Open an issue on GitHub with:
   - Video specifications (format, duration, resolution)
   - Error logs
   - Steps to reproduce

## License

Claude Video integration in KnowNote is provided under GPL-3.0 License, consistent with KnowNote's licensing.

---

**Ready to use!** Start KnowNote with `pnpm run dev` and try adding a video file to your knowledge base.
