/**
 * BrowserFetchAdapter
 * 自适应网页抓取适配器，根据场景选择合适的抓取方式
 */

import { WebFetchService, FetchResult, FetchOptions } from './WebFetchService'
import {
  LightpandaBrowserService,
  LightpandaFetchResult,
  LightpandaFetchOptions
} from './LightpandaBrowserService'
import Logger from '../../shared/utils/logger'

export interface AdaptiveOptions extends FetchOptions {
  preferLightpanda?: boolean
  fallbackOnError?: boolean
  enableJavaScript?: boolean
}

/**
 * 浏览器抓取适配器
 */
export class BrowserFetchAdapter {
  private standardService: WebFetchService
  private lightpandaService: LightpandaBrowserService | null = null
  private lightpandaInitialized = false

  constructor() {
    this.standardService = new WebFetchService()
  }

  /**
   * 初始化 Lightpanda 服务
   */
  async initLightpanda(): Promise<boolean> {
    if (this.lightpandaInitialized) {
      return this.lightpandaService !== null
    }

    try {
      this.lightpandaService = new LightpandaBrowserService()
      await this.lightpandaService.initBrowser()
      this.lightpandaInitialized = true
      Logger.info('BrowserFetchAdapter', 'Lightpanda initialized successfully')
      return true
    } catch (error) {
      Logger.warn('BrowserFetchAdapter', 'Failed to initialize Lightpanda:', error)
      this.lightpandaService = null
      this.lightpandaInitialized = true
      return false
    }
  }

  /**
   * 自适应抓取 URL
   */
  async fetchUrl(url: string, options?: AdaptiveOptions): Promise<FetchResult> {
    const opts: AdaptiveOptions = {
      ...options,
      preferLightpanda: options?.preferLightpanda ?? false,
      fallbackOnError: options?.fallbackOnError ?? true,
      enableJavaScript: options?.enableJavaScript ?? false
    }

    // 如果需要 JavaScript 支持或显式选择 Lightpanda
    if (opts.enableJavaScript || opts.preferLightpanda) {
      const lightpandaAvailable = await this.initLightpanda()

      if (lightpandaAvailable && this.lightpandaService) {
        try {
          const result = await this.lightpandaService.fetchUrl(url, {
            timeout: opts.timeout,
            extractMainContent: opts.extractMainContent,
            convertToMarkdown: opts.convertToMarkdown,
            userAgent: opts.userAgent
          })
          return this.adaptLightpandaResult(result)
        } catch (error) {
          if (!opts.fallbackOnError) {
            throw error
          }
          Logger.warn('BrowserFetchAdapter', 'Lightpanda fetch failed, falling back to standard:', error)
        }
      }
    }

    // 使用标准服务
    return this.standardService.fetchUrl(url, opts)
  }

  /**
   * 将 Lightpanda 结果转换为标准格式
   */
  private adaptLightpandaResult(result: LightpandaFetchResult): FetchResult {
    return {
      content: result.content,
      title: result.title,
      description: result.description,
      url: result.url,
      mimeType: result.mimeType,
      metadata: {
        ...result.metadata,
        renderedWithBrowser: true
      }
    }
  }

  /**
   * 获取标准服务
   */
  getStandardService(): WebFetchService {
    return this.standardService
  }

  /**
   * 获取 Lightpanda 服务
   */
  getLightpandaService(): LightpandaBrowserService | null {
    return this.lightpandaService
  }

  /**
   * 检查 Lightpanda 是否可用
   */
  isLightpandaAvailable(): boolean {
    return this.lightpandaService !== null && this.lightpandaService.isBrowserAvailable()
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    if (this.lightpandaService) {
      await this.lightpandaService.close()
    }
  }

  /**
   * 验证 URL
   */
  isValidUrl(url: string): boolean {
    return this.standardService.isValidUrl(url)
  }
}
