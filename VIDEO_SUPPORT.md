# Video Support in KnowNote

This document describes the video file support added to KnowNote through integration with claude-video capabilities.

## Overview

KnowNote now supports analyzing and processing video files. Videos are processed by:

1. **Frame Extraction**: Intelligent sampling of video frames based on video duration
2. **Metadata Extraction**: Resolution, duration, frame rate, codec information
3. **Content Generation**: Converting visual and audio content into searchable, analyzable text
4. **RAG Integration**: Video content is indexed and retrievable alongside documents

## Supported Video Formats

The following video file formats are supported:

- **MP4** (.mp4) - MPEG-4 video
- **WebM** (.webm) - VP8/VP9 video codec
- **MOV** (.mov) - QuickTime video
- **AVI** (.avi) - Audio Video Interleave
- **MKV** (.mkv) - Matroska video container
- **MPEG** (.mpeg) - MPEG video
- **OGV** (.ogv) - Ogg Video Theora

## Installation Requirements

### Prerequisites

To enable full video processing capabilities, install the following system dependencies:

#### macOS
```bash
brew install ffmpeg ffprobe
```

#### Ubuntu/Debian
```bash
sudo apt-get install ffmpeg
```

#### Windows
Download and install FFmpeg from: https://ffmpeg.org/download.html
Make sure to add FFmpeg to your system PATH.

### NPM Dependencies

All required Node.js dependencies are already included in KnowNote's package.json.

## How It Works

### Frame Extraction Strategy

The VideoLoader uses intelligent frame sampling:

- **Short videos** (< 2 min): 1 frame per second
- **Medium videos** (2-10 min): 1 frame every 5 seconds
- **Long videos** (10-60 min): 1 frame every 10 seconds
- **Very long videos** (> 1 hour): 1 frame every 30 seconds

This approach balances detail with token efficiency for RAG processing.

### Processing Pipeline

1. **Metadata Extraction**: Uses `ffprobe` to get video properties
2. **Frame Sampling**: Uses `ffmpeg` to extract frames at calculated intervals
3. **Content Generation**: Combines frame data into searchable text format
4. **RAG Indexing**: Video content is processed through the standard RAG pipeline

## Usage

### Adding Video Files to Knowledge Base

1. Open KnowNote
2. Use "Add Document" or drag-and-drop to add a video file
3. The video will be automatically processed and indexed

### Querying Video Content

Video content is fully searchable through the standard Q&A interface:

```
Q: What key moments are in this video?
Q: Summarize the visual progression of this video
Q: Extract the main topics from this video
```

## Claude Video Integration

The VideoLoader is designed to work with claude-video capabilities:

- **Frame Description**: Frames can be analyzed by Claude Vision for detailed descriptions
- **Transcript Integration**: Video transcripts can be extracted and combined with visual content
- **Smart Analysis**: Claude can understand both visual and audio content together

To install claude-video skill for enhanced analysis:

```bash
/plugin install watch@claude-video
```

## Limitations and Future Improvements

### Current Limitations

1. **Audio Transcription**: Currently generates frame descriptions; full audio transcription requires additional API configuration
2. **Large Files**: Very large videos (> 2 GB) may require significant processing time
3. **Codec Support**: Depends on system ffmpeg installation; some exotic codecs may not be supported

### Planned Improvements

1. **Whisper API Integration**: Automatic audio transcription
2. **Claude Vision Analysis**: AI-powered frame descriptions
3. **Subtitle Extraction**: Automatic SRT/VTT subtitle detection
4. **Live Stream Support**: Processing of HLS/DASH streams
5. **Video Search**: Content-aware video timeline search

## Troubleshooting

### "ffmpeg not found" Warning

**Solution**: Install ffmpeg for your operating system (see Installation Requirements above)

### Video Processing Times Out

**Solution**: Reduce the video duration or optimize video resolution before importing

### Low Quality Frame Descriptions

**Solution**: Configure Claude API integration for Vision-based frame analysis

## Technical Details

### File Structure

```
src/main/services/
├── loaders/
│   ├── VideoLoader.ts          # Video processing implementation
│   └── types.ts                # Loader interface definitions
└── FileParserService.ts        # Updated to register VideoLoader
```

### Key Classes

#### VideoLoader

Implements `IDocumentLoader` interface:

- `supportedMimeTypes`: Video MIME types
- `supportedExtensions`: Video file extensions
- `loadFromPath()`: Process video file from filesystem
- `loadFromBuffer()`: Process video from buffer
- `canLoad()`: Check if file type is supported

### Metadata Processing

Video metadata is preserved in DocumentLoadResult:

```json
{
  "metadata": {
    "originalFormat": "mp4",
    "duration": 120,
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "frameCount": 24,
    "codec": "h264"
  }
}
```

## Performance Considerations

- **Disk Space**: Temporary frame files are cleaned up automatically
- **Memory Usage**: Depends on video resolution and frame count
- **Processing Time**: Generally 1-5 minutes for a 10-minute video
- **Network**: Optional Whisper API for transcription

## Support and Contributions

For issues, feature requests, or contributions:

1. Check existing GitHub issues
2. Create a new issue with reproduction steps
3. Submit pull requests with improvements

## License

Video support in KnowNote is provided under the same GPL-3.0 license as the main project.
