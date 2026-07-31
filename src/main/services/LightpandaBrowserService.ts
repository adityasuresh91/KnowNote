/**
 * LightpandaBrowserService
 * 使用 Lightpanda 浏览器进行网页抓取，支持 JavaScript 渲染和复杂交互
 */

import { Browser, Page } from '@lightpanda/browser'
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
export interface LightpandaFetchOptions {
  timeout?: number
  waitUntilLoad?: boolean
  extractMainContent?: boolean
  convertToMarkdown?: boolean
  userAgent?: string
  waitForSelector?: string
  waitForTimeout?: number
}

/**
 * Lightpanda 浏览器服务
 */
export class LightpandaBrowserService {
  private browser: Browser | null = null
  private turndown: TurndownService
  private defaultOptions: Required<Omit<LightpandaFetchOptions, 'waitForSelector'>> = {
    timeout: 60000,
    waitUntilLoad: true,
    extractMainContent: true,
    convertToMarkdown: true,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    waitForTimeout: 5000
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
   * 初始化浏览器
   */
  async initBrowser(): Promise<void> {
    if (this.browser) return

    try {
      this.browser = new Browser()
      Logger.info('LightpandaBrowserService', 'Browser initialized successfully')
    } catch (error) {
      Logger.error('LightpandaBrowserService', 'Failed to initialize browser:', error)
      throw new Error('Failed to initialize Lightpanda browser')
    }
  }

  /**
   * 抓取网页内容（使用 Lightpanda）
   */
  async fetchUrl(url: string, options?: LightpandaFetchOptions): Promise<LightpandaFetchResult> {
    if (!this.browser) {
      await this.initBrowser()
    }

    if (!this.browser) {
      throw new Error('Browser not initialized')
    }

    const opts: Required<LightpandaFetchOptions> = {
      ...this.defaultOptions,
      ...options,
      waitForSelector: options?.waitForSelector
    }

    let page: Page | null = null

    try {
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported')
      }

      Logger.info('LightpandaBrowserService', `Fetching with Lightpanda: ${url}`)

      // 创建新页面
      page = await this.browser.newPage()

      // 设置用户代理
      await page.setUserAgent(opts.userAgent)

      // 导航到 URL
      await page.goto(url, { waitUntil: opts.waitUntilLoad ? 'load' : 'domcontentloaded' })

      // 等待选择器或超时
      if (opts.waitForSelector) {
        try {
          await page.waitForSelector(opts.waitForSelector, { timeout: opts.waitForTimeout })
        } catch (error) {
          Logger.warn('LightpandaBrowserService', `Selector not found: ${opts.waitForSelector}`)
        }
      }

      // 获取页面内容
      const content = await page.content()
      const pageUrl = page.url()
      const pageTitle = await page.title()

      // 关闭页面
      await page.close()
      page = null

      // 解析内容
      return this.parseContent(content, pageUrl || url, pageTitle, opts)
    } catch (error) {
      if (page) {
        try {
          await page.close()
        } catch (closeError) {
          Logger.warn('LightpandaBrowserService', 'Error closing page:', closeError)
        }
      }

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
    title: string | undefined,
    options: Required<LightpandaFetchOptions>
  ): LightpandaFetchResult {
    const $ = cheerio.load(html)

    // 提取标题
    const pageTitle = title || $('title').text().trim() || $('h1').first().text().trim()

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
    return (
      content
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim()
    )
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close()
        this.browser = null
        Logger.info('LightpandaBrowserService', 'Browser closed')
      } catch (error) {
        Logger.error('LightpandaBrowserService', 'Error closing browser:', error)
      }
    }
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
   * 检查浏览器是否可用
   */
  isBrowserAvailable(): boolean {
    return this.browser !== null
  }
}
