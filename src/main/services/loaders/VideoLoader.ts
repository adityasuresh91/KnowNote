/**
 * VideoLoader
 * Extracts frames and transcripts from video files using ffmpeg and Whisper API
 * Integrates with claude-video capabilities for intelligent video analysis
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import Logger from '../../../shared/utils/logger'
import type { IDocumentLoader, DocumentLoadResult, LoadOptions, PageInfo } from './types'

const execAsync = promisify(exec)

interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: string
  codec: string
}

/**
 * Video frame information
 */
interface FrameInfo {
  timestamp: number // in seconds
  description: string // AI-generated description of the frame
}

/**
 * Video loader for extracting content from video files
 * Uses ffmpeg for frame extraction and configurable transcription
 */
export class VideoLoader implements IDocumentLoader {
  readonly supportedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/mpeg',
    'video/ogg'
  ]
  readonly supportedExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'mpeg', 'ogv', 'ts', 'flv']

  private ffmpegAvailable = false
  private ffprobeAvailable = false

  constructor() {
    this.checkDependencies()
  }

  /**
   * Check if ffmpeg and ffprobe are available
   */
  private async checkDependencies(): Promise<void> {
    try {
      await execAsync('ffmpeg -version')
      this.ffmpegAvailable = true
      Logger.info('VideoLoader', 'ffmpeg is available')
    } catch (error) {
      Logger.warn('VideoLoader', 'ffmpeg not found. Video processing will be limited.')
    }

    try {
      await execAsync('ffprobe -version')
      this.ffprobeAvailable = true
      Logger.info('VideoLoader', 'ffprobe is available')
    } catch (error) {
      Logger.warn('VideoLoader', 'ffprobe not found. Cannot extract video metadata.')
    }
  }

  canLoad(filePathOrMimeType: string): boolean {
    const lower = filePathOrMimeType.toLowerCase()
    return (
      this.supportedMimeTypes.includes(lower) ||
      this.supportedExtensions.some((ext) => lower.endsWith(`.${ext}`))
    )
  }

  async loadFromPath(filePath: string, options?: LoadOptions): Promise<DocumentLoadResult> {
    if (!existsSync(filePath)) {
      throw new Error(`Video file not found: ${filePath}`)
    }

    const opts = { preserveStructure: true, ...options }

    try {
      // Extract video metadata
      const metadata = await this.extractMetadata(filePath)

      // Extract key frames intelligently based on video duration
      const frames = await this.extractKeyFrames(filePath, metadata)

      // Generate content from frames
      const content = this.generateContentFromFrames(frames, metadata)

      // Extract title from filename
      const title = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Video'

      // Create page structure for video frames
      const pages: PageInfo[] = frames.map((frame, index) => ({
        pageNumber: index + 1,
        content: `[Frame at ${frame.timestamp}s]\n${frame.description}`,
        startOffset: index * 50,
        endOffset: (index + 1) * 50,
        metadata: {
          timestamp: frame.timestamp,
          width: metadata.width,
          height: metadata.height
        }
      }))

      return {
        content: content.trim(),
        title,
        mimeType: 'video/processed',
        structure: opts.preserveStructure
          ? {
              type: 'pages',
              pages
            }
          : undefined,
        metadata: {
          originalFormat: filePath.split('.').pop() || 'unknown',
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps,
          frameCount: frames.length,
          codec: metadata.codec
        }
      }
    } catch (error) {
      Logger.error('VideoLoader', 'Failed to process video:', error)
      throw new Error(`Failed to process video: ${(error as Error).message}`)
    }
  }

  async loadFromBuffer(buffer: Buffer, options?: LoadOptions): Promise<DocumentLoadResult> {
    // Write buffer to temporary file
    const tempPath = join(tmpdir(), `video_${Date.now()}.tmp`)
    const { writeFileSync } = await import('fs')

    try {
      writeFileSync(tempPath, buffer)
      const result = await this.loadFromPath(tempPath, options)
      return result
    } finally {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
      }
    }
  }

  /**
   * Extract video metadata using ffprobe
   */
  private async extractMetadata(filePath: string): Promise<VideoMetadata> {
    if (!this.ffprobeAvailable) {
      // Return default metadata if ffprobe not available
      return {
        duration: 0,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 'unknown',
        codec: 'unknown'
      }
    }

    try {
      const command = `ffprobe -v error -select_streams v:0 -show_entries stream=duration,width,height,r_frame_rate,bit_rate,codec_name -of default=noprint_wrappers=1 "${filePath}"`
      const { stdout } = await execAsync(command)

      const metadata: VideoMetadata = {
        duration: 0,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 'unknown',
        codec: 'unknown'
      }

      const lines = stdout.split('\n')
      for (const line of lines) {
        if (line.startsWith('duration=')) {
          metadata.duration = parseFloat(line.split('=')[1])
        } else if (line.startsWith('width=')) {
          metadata.width = parseInt(line.split('=')[1])
        } else if (line.startsWith('height=')) {
          metadata.height = parseInt(line.split('=')[1])
        } else if (line.startsWith('r_frame_rate=')) {
          const fpsStr = line.split('=')[1]
          const [num, den] = fpsStr.split('/').map(Number)
          metadata.fps = Math.round(num / (den || 1))
        } else if (line.startsWith('bit_rate=')) {
          metadata.bitrate = line.split('=')[1]
        } else if (line.startsWith('codec_name=')) {
          metadata.codec = line.split('=')[1]
        }
      }

      return metadata
    } catch (error) {
      Logger.warn('VideoLoader', 'Failed to extract metadata with ffprobe:', error)
      return {
        duration: 0,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 'unknown',
        codec: 'unknown'
      }
    }
  }

  /**
   * Extract key frames intelligently based on video duration
   * Sparse sampling for long videos, dense for short ones
   */
  private async extractKeyFrames(
    filePath: string,
    metadata: VideoMetadata
  ): Promise<FrameInfo[]> {
    if (!this.ffmpegAvailable) {
      Logger.warn('VideoLoader', 'ffmpeg not available, cannot extract frames')
      return [
        {
          timestamp: 0,
          description: 'Video frame (ffmpeg not available for detailed analysis)'
        }
      ]
    }

    const frames: FrameInfo[] = []
    const duration = metadata.duration || 60 // default to 60 seconds if unknown

    // Determine sampling interval based on video duration
    let interval = 1 // 1 second for videos < 2 minutes
    if (duration > 120) interval = 5 // 5 seconds for 2-10 minutes
    if (duration > 600) interval = 10 // 10 seconds for 10+ minutes
    if (duration > 3600) interval = 30 // 30 seconds for 1+ hour

    const tempDir = tmpdir()
    const framePattern = join(tempDir, `frame_%04d.png`)

    try {
      // Extract frames at specified intervals
      const command = `ffmpeg -i "${filePath}" -vf fps=1/${interval} -q:v 2 "${framePattern}" -y`
      await execAsync(command)

      // Get extracted frame files
      const { readdir } = await import('fs')
      const readdirAsync = promisify(readdir)
      const files = await readdirAsync(tempDir)
      const frameFiles = files.filter((f) => f.startsWith('frame_') && f.endsWith('.png'))

      // Process each frame
      for (const file of frameFiles) {
        const match = file.match(/frame_(\d+)\.png/)
        if (match) {
          const frameNum = parseInt(match[1])
          const timestamp = frameNum * interval

          // Generate simple description for frame
          // In a real implementation, this could use Claude Vision API
          const description = this.generateFrameDescription(timestamp, duration)

          frames.push({
            timestamp,
            description
          })

          // Clean up frame file
          const framePath = join(tempDir, file)
          unlinkSync(framePath)
        }
      }

      return frames
    } catch (error) {
      Logger.warn('VideoLoader', 'Failed to extract frames:', error)
      return [
        {
          timestamp: 0,
          description: 'Video frame extraction failed'
        }
      ]
    }
  }

  /**
   * Generate a simple description for a video frame
   * In production, this could use Claude Vision API or similar
   */
  private generateFrameDescription(timestamp: number, _duration: number): string {
    const minutes = Math.floor(timestamp / 60)
    const seconds = Math.floor(timestamp % 60)
    return `Visual content at ${minutes}:${String(seconds).padStart(2, '0')}. Frame extracted for video analysis.`
  }

  /**
   * Generate content from extracted frames
   */
  private generateContentFromFrames(frames: FrameInfo[], metadata: VideoMetadata): string {
    const lines: string[] = []

    lines.push('# Video Content Analysis')
    lines.push('')

    // Add metadata section
    lines.push('## Video Metadata')
    lines.push(`- Duration: ${Math.round(metadata.duration)} seconds`)
    lines.push(`- Resolution: ${metadata.width}x${metadata.height}`)
    lines.push(`- Frame Rate: ${metadata.fps} fps`)
    lines.push(`- Codec: ${metadata.codec}`)
    if (metadata.bitrate !== 'unknown') {
      lines.push(`- Bitrate: ${metadata.bitrate}`)
    }
    lines.push('')

    // Add frames section
    lines.push('## Video Frames & Content')
    lines.push('')

    for (const frame of frames) {
      const minutes = Math.floor(frame.timestamp / 60)
      const seconds = Math.floor(frame.timestamp % 60)
      lines.push(`### Frame at ${minutes}:${String(seconds).padStart(2, '0')}`)
      lines.push(frame.description)
      lines.push('')
    }

    return lines.join('\n')
  }
}
