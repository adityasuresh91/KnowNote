/**
 * KnowNote Video Processing Example
 * Demonstrates how to use VideoLoader for processing video files
 */

import { FileParserService } from '../src/main/services/FileParserService'
import { VideoLoader } from '../src/main/services/loaders/VideoLoader'

/**
 * Example 1: Basic Video Processing
 * Process a video file and display its content
 */
async function example1_basicProcessing() {
  console.log('=== Example 1: Basic Video Processing ===\n')

  const videoPath = './sample-video.mp4'
  const loader = new VideoLoader()

  // Check if file is supported
  if (!loader.canLoad(videoPath)) {
    console.log('❌ File format not supported')
    return
  }

  try {
    // Process the video file
    const result = await loader.loadFromPath(videoPath)

    console.log('✅ Video processed successfully')
    console.log(`Title: ${result.title}`)
    console.log(`Content length: ${result.content.length} characters`)
    console.log(`MIME type: ${result.mimeType}`)

    // Display metadata
    if (result.metadata) {
      console.log('\nMetadata:')
      console.log(`  Duration: ${result.metadata.duration}s`)
      console.log(`  Resolution: ${result.metadata.width}x${result.metadata.height}`)
      console.log(`  Frame count: ${result.metadata.frameCount}`)
      console.log(`  Codec: ${result.metadata.codec}`)
    }

    // Display content preview
    console.log('\nContent preview:')
    console.log(result.content.substring(0, 300) + '...')
  } catch (error) {
    console.error('❌ Error processing video:', error)
  }
}

/**
 * Example 2: Using FileParserService
 * Process video through the centralized file parser service
 */
async function example2_usingParserService() {
  console.log('\n=== Example 2: Using FileParserService ===\n')

  const service = new FileParserService()
  const videoPath = './sample-video.mp4'

  // Check if format is supported
  if (!service.isSupported('mp4')) {
    console.log('❌ Video format not supported by FileParserService')
    return
  }

  try {
    // Parse video through service
    const result = await service.parseFile(videoPath, {
      preserveStructure: true,
      extractImages: false
    })

    console.log('✅ Video parsed through FileParserService')
    console.log(`MIME type: ${result.mimeType}`)

    // Access structure information
    if (result.structure?.type === 'pages') {
      console.log(`\nExtracted ${result.structure.pages?.length || 0} frames`)

      // Show first few frames
      result.structure.pages?.slice(0, 3).forEach((page) => {
        console.log(
          `  Frame ${page.pageNumber} @ ${page.metadata?.timestamp || '?'}s`
        )
      })
    }
  } catch (error) {
    console.error('❌ Error parsing video:', error)
  }
}

/**
 * Example 3: Batch Processing Multiple Videos
 * Process multiple video files and compare them
 */
async function example3_batchProcessing() {
  console.log('\n=== Example 3: Batch Video Processing ===\n')

  const videoPaths = [
    './video1.mp4',
    './video2.webm',
    './video3.mov'
  ]

  const loader = new VideoLoader()
  const results = []

  for (const videoPath of videoPaths) {
    try {
      console.log(`Processing ${videoPath}...`)
      const result = await loader.loadFromPath(videoPath)

      results.push({
        file: videoPath,
        duration: result.metadata?.duration || 0,
        frameCount: result.metadata?.frameCount || 0,
        contentLength: result.content.length
      })

      console.log(`  ✅ Success (${result.metadata?.frameCount} frames)`)
    } catch (error) {
      console.log(`  ❌ Failed: ${(error as Error).message}`)
    }
  }

  // Display summary
  console.log('\n📊 Summary:')
  console.table(results)
}

/**
 * Example 4: RAG Integration
 * Preparing video content for RAG pipeline
 */
async function example4_ragIntegration() {
  console.log('\n=== Example 4: RAG Pipeline Integration ===\n')

  const videoPath = './sample-video.mp4'
  const loader = new VideoLoader()

  try {
    const result = await loader.loadFromPath(videoPath, {
      preserveStructure: true
    })

    console.log('📝 RAG Pipeline Data:')
    console.log(`Document title: ${result.title}`)
    console.log(`Document type: ${result.mimeType}`)
    console.log(`Total content: ${result.content.length} chars`)

    // Structure for embedding
    if (result.structure?.type === 'pages') {
      const pages = result.structure.pages || []
      console.log(`\nEmbedding strategy: Page-based (${pages.length} pages)`)

      pages.slice(0, 5).forEach((page) => {
        const chunkSize = page.content.length
        console.log(
          `  Page ${page.pageNumber}: ${chunkSize} chars @ ${page.metadata?.timestamp}s`
        )
      })
    }

    // Metadata for retrieval
    console.log('\nRetrieval metadata:')
    Object.entries(result.metadata || {}).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`)
    })

    console.log('\n✅ Video content ready for RAG indexing')
  } catch (error) {
    console.error('❌ Error preparing for RAG:', error)
  }
}

/**
 * Example 5: Custom Processing Options
 * Using load options to customize processing
 */
async function example5_customOptions() {
  console.log('\n=== Example 5: Custom Processing Options ===\n')

  const videoPath = './sample-video.mp4'
  const loader = new VideoLoader()

  // Option 1: Without structure preservation (faster)
  console.log('Option 1: Without structure (faster)')
  try {
    const result1 = await loader.loadFromPath(videoPath, {
      preserveStructure: false
    })
    console.log(`✅ Processed: ${result1.content.length} chars, no structure`)
  } catch (error) {
    console.log(`Note: ${(error as Error).message}`)
  }

  // Option 2: With structure preservation (detailed)
  console.log('\nOption 2: With structure (detailed)')
  try {
    const result2 = await loader.loadFromPath(videoPath, {
      preserveStructure: true,
      extractImages: true
    })
    console.log(`✅ Processed: ${result2.content.length} chars`)
    console.log(`Structure type: ${result2.structure?.type}`)
    if (result2.structure?.type === 'pages') {
      console.log(`Pages: ${result2.structure.pages?.length}`)
    }
  } catch (error) {
    console.log(`Note: ${(error as Error).message}`)
  }
}

/**
 * Main function: Run all examples
 */
async function main() {
  console.log('🎬 KnowNote Video Processing Examples\n')
  console.log('These examples demonstrate how to use VideoLoader\n')

  // Note: Examples assume sample video files exist
  // Replace paths with actual video files for testing

  console.log('📋 Available Examples:')
  console.log('1. Basic Video Processing')
  console.log('2. Using FileParserService')
  console.log('3. Batch Processing Multiple Videos')
  console.log('4. RAG Integration')
  console.log('5. Custom Processing Options')

  console.log(
    '\n💡 Uncomment specific examples below to run them with actual video files.\n'
  )

  // Uncomment to run specific examples:
  // await example1_basicProcessing()
  // await example2_usingParserService()
  // await example3_batchProcessing()
  // await example4_ragIntegration()
  // await example5_customOptions()

  console.log('✅ Examples complete!')
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { example1_basicProcessing, example2_usingParserService, example3_batchProcessing, example4_ragIntegration, example5_customOptions }
