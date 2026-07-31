/**
 * LightpandaBrowserService
 * 使用 Lightpanda 浏览器进行网页抓取，支持 JavaScript 渲染
 */

import { lightpanda } from '@lightpanda/browser'
import TurndownService from 'turndown'
import * as cheerio from 'cheerio'
import Logger from '../../shared/utils/logger'

/**
 * Lightpanda 抓取结果
 */
export interface LightpandaFetchResult {
  content: string
  title?: string
  description?: string
  url: string
  mimeType: string
  renderedContent: boolean
  metadata?: Record<string, unknown>
}

/**
 * Lightpanda 抓取选项
 */
export interface LightpandaBrowserFetchOptions {
  timeout?: number
  extractMainContent?: boolean
  convertToMarkdown?: boolean
  userAgent?: string
  disableHostVerification?: boolean
  obeyRobots?: boolean
  outputFormat?: 'html' | 'markdown'
}

/**
 * Lightpanda 浏览器服务
 */
export class LightpandaBrowserService {
  private turndown: TurndownService
  private defaultOptions: Required<LightpandaBrowserFetchOptions> = {
    timeout: 60000,
    extractMainContent: true,
    convertToMarkdown: true,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    disableHostVerification: false,
    obeyRobots: true,
    outputFormat: 'html'
  }

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    })

    this.turndown.remove(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe'])
  }

  /**
   * 初始化浏览器（不需要，Lightpanda 已全局初始化）
   */
  async initBrowser(): Promise<void> {
    Logger.info('LightpandaBrowserService', 'Lightpanda browser ready')
  }

  /**
   * 抓取网页内容（使用 Lightpanda）
   */
  async fetchUrl(
    url: string,
    options?: LightpandaBrowserFetchOptions
  ): Promise<LightpandaFetchResult> {
    const opts: Required<LightpandaBrowserFetchOptions> = {
      ...this.defaultOptions,
      ...options
    }

    try {
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported')
      }

      Logger.info('LightpandaBrowserService', `Fetching with Lightpanda: ${url}`)

      // 使用 Lightpanda 的 fetch 函数
      const result = await lightpanda.fetch(url, {
        disableHostVerification: opts.disableHostVerification,
        obeyRobots: opts.obeyRobots,
        dump: true,
        dumpOptions: {
          type: opts.outputFormat
        }
      })

      // 将结果转换为字符串
      const html = typeof result === 'string' ? result : result.toString()

      // 解析内容
      return this.parseContent(html, url, opts)
    } catch (error) {
      Logger.error('LightpandaBrowserService', 'Failed to fetch URL:', error)
      throw error
    }
  }

  /**
   * 解析页面内容
   */
  private parseContent(
    html: string,
    url: string,
    options: Required<LightpandaBrowserFetchOptions>
  ): LightpandaFetchResult {
    const $ = cheerio.load(html)

    // 提取标题
    const pageTitle = $('title').text().trim() || $('h1').first().text().trim()

    // 提取描述
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content')

    // 提取主要内容
    let content: string
    if (options.extractMainContent) {
      content = this.extractMainContent($)
    } else {
      content = $('body').html() || ''
    }

    // 转换为 Markdown
    if (options.convertToMarkdown) {
      content = this.htmlToMarkdown(content)
    } else {
      content = cheerio.load(content).text()
    }

    // 清理内容
    content = this.cleanContent(content)

    return {
      content,
      title: pageTitle || undefined,
      description: description || undefined,
      url,
      mimeType: 'text/html',
      renderedContent: true,
      metadata: {
        originalLength: html.length
      }
    }
  }

  /**
   * 提取主要内容
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    $(
      'script, style, nav, footer, header, aside, iframe, noscript, ' +
        '.nav, .navigation, .menu, .sidebar, .footer, .header, .ad, .advertisement, ' +
        '.comments, .comment, .social, .share, .related, .recommend'
    ).remove()

    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.article',
      '.post',
      '.content',
      '.entry-content',
      '.post-content',
      '.article-content',
      '#content',
      '#main-content'
    ]

    for (const selector of mainSelectors) {
      const element = $(selector).first()
      if (element.length && element.text().trim().length > 200) {
        return element.html() || ''
      }
    }

    return $('body').html() || ''
  }

  /**
   * HTML 转 Markdown
   */
  private htmlToMarkdown(html: string): string {
    try {
      return this.turndown.turndown(html)
    } catch (error) {
      Logger.warn('LightpandaBrowserService', 'Failed to convert to Markdown:', error)
      return cheerio.load(html).text()
    }
  }

  /**
   * 清理内容
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .trim()
  }

  /**
   * 关闭浏览器（Lightpanda 无需显式关闭）
   */
  async close(): Promise<void> {
    Logger.info('LightpandaBrowserService', 'Lightpanda cleanup complete')
  }

  /**
   * 验证 URL
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  /**
   * 检查浏览器是否可用（Lightpanda 总是可用的）
   */
  isBrowserAvailable(): boolean {
    return true
  }
}
