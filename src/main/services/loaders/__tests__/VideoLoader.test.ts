/**
 * VideoLoader Unit Tests
 * Tests for video file processing and integration
 */

import { VideoLoader } from '../VideoLoader'

describe('VideoLoader', () => {
  let loader: VideoLoader

  beforeEach(() => {
    loader = new VideoLoader()
  })

  describe('Supported Formats', () => {
    test('should support common video MIME types', () => {
      const mimeTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska'
      ]

      mimeTypes.forEach((mime) => {
        expect(loader.canLoad(mime)).toBe(true)
      })
    })

    test('should support common video extensions', () => {
      const extensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'mpeg', 'ogv']

      extensions.forEach((ext) => {
        expect(loader.canLoad(`video.${ext}`)).toBe(true)
      })
    })

    test('should reject unsupported formats', () => {
      expect(loader.canLoad('audio/mp3')).toBe(false)
      expect(loader.canLoad('document.pdf')).toBe(false)
      expect(loader.canLoad('image/png')).toBe(false)
    })
  })

  describe('MIME Type Support', () => {
    test('should declare supported MIME types', () => {
      expect(loader.supportedMimeTypes.length).toBeGreaterThan(0)
      expect(loader.supportedMimeTypes).toContain('video/mp4')
      expect(loader.supportedMimeTypes).toContain('video/webm')
    })

    test('should declare supported extensions', () => {
      expect(loader.supportedExtensions.length).toBeGreaterThan(0)
      expect(loader.supportedExtensions).toContain('mp4')
      expect(loader.supportedExtensions).toContain('webm')
    })
  })

  describe('File Loading', () => {
    test('should handle missing files gracefully', async () => {
      const nonexistentPath = '/path/to/nonexistent/video.mp4'

      await expect(loader.loadFromPath(nonexistentPath)).rejects.toThrow(
        'Video file not found'
      )
    })

    test('should reject unsupported formats', () => {
      const result = loader.canLoad('video.xyz')
      expect(result).toBe(false)
    })
  })

  describe('Loader Interface', () => {
    test('should implement IDocumentLoader interface', () => {
      expect(loader.supportedMimeTypes).toBeDefined()
      expect(loader.supportedExtensions).toBeDefined()
      expect(typeof loader.loadFromPath).toBe('function')
      expect(typeof loader.loadFromBuffer).toBe('function')
      expect(typeof loader.canLoad).toBe('function')
    })

    test('should return proper types', () => {
      expect(Array.isArray(loader.supportedMimeTypes)).toBe(true)
      expect(Array.isArray(loader.supportedExtensions)).toBe(true)
    })
  })
})

/**
 * Integration Tests
 * These tests verify integration with FileParserService
 */
describe('VideoLoader Integration', () => {
  test('VideoLoader should be registered in FileParserService', () => {
    const { FileParserService } = require('../FileParserService')
    const service = new FileParserService()

    // Check if service supports video formats
    expect(service.isSupported('mp4')).toBe(true)
    expect(service.isSupported('webm')).toBe(true)
    expect(service.isSupported('mov')).toBe(true)
  })

  test('FileParserService should map video MIME types correctly', () => {
    const { FileParserService } = require('../FileParserService')
    const service = new FileParserService()

    expect(service.getFileTypeFromMime('video/mp4')).toBe('mp4')
    expect(service.getFileTypeFromMime('video/webm')).toBe('webm')
    expect(service.getFileTypeFromMime('video/quicktime')).toBe('mov')
  })

  test('FileParserService should return correct MIME types', () => {
    const { FileParserService } = require('../FileParserService')
    const service = new FileParserService()

    expect(service.getMimeType('mp4')).toBe('video/mp4')
    expect(service.getMimeType('webm')).toBe('video/webm')
    expect(service.getMimeType('mov')).toBe('video/quicktime')
  })
})
