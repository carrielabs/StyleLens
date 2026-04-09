import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import type {
  ComponentStateTokens,
  LayoutEvidence,
  PageSection,
  PageStyleAnalysis,
  RadiusToken,
  ScreenshotResponse,
  ShadowToken,
  SpacingToken,
  StateTokenValue,
  TypographyToken,
  ViewportSlice,
} from '@/lib/types'
import { analyzePageStyles, analyzePageStylesFromPage, sanitizePageAnalysis } from '@/lib/api/pageAnalyzer'

// Persistent file-based cache to survive server restarts (HMR/Next.js Dev)
const CACHE_FILE = path.resolve(process.cwd(), '.screenshot_cache.json')

function getPersistentCache(): Map<string, string> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      return new Map(Object.entries(data))
    }
  } catch (e) {
    console.error('[Screenshotter] Failed to read cache file:', e)
  }
  return new Map()
}

function savePersistentCache(cache: Map<string, string>) {
  try {
    const data = Object.fromEntries(cache)
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('[Screenshotter] Failed to save cache file:', e)
  }
}

const screenshotCache = getPersistentCache()
const ANALYSIS_VIEWPORTS = [
  { id: 'desktop', width: 1280, height: 960, primary: true },
  { id: 'mobile', width: 390, height: 844, primary: false },
] as const

function mergeUniqueBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const key = keyFor(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

function mergeStateTokens(...sources: Array<ComponentStateTokens | undefined>): ComponentStateTokens {
  const merged: ComponentStateTokens = {}
  const keys: Array<keyof ComponentStateTokens> = ['button', 'link', 'input', 'card']

  for (const key of keys) {
    const entries = mergeUniqueBy(
      sources.flatMap(source => source?.[key] || []),
      (entry: StateTokenValue) => `${entry.state}|${entry.property}|${entry.value}`
    )
    if (entries.length > 0) {
      merged[key] = entries
    }
  }

  return merged
}

function mergePageAnalysisVariants(analyses: Array<PageStyleAnalysis | null | undefined>): PageStyleAnalysis | null {
  const available = analyses.filter((analysis): analysis is PageStyleAnalysis => Boolean(analysis))
  if (available.length === 0) return null

  const primary = available[0]
  const pickLongest = <T>(selector: (analysis: PageStyleAnalysis) => T[] | undefined): T[] =>
    available
      .map(analysis => selector(analysis) || [])
      .reduce((best, current) => current.length > best.length ? current : best, [] as T[])

  return {
    ...primary,
    typographyTokens: mergeUniqueBy(
      available.flatMap(analysis => analysis.typographyTokens),
      (token: TypographyToken) => token.id || `${token.label}|${token.fontFamily}|${token.fontSize}|${token.fontWeight}`
    ),
    radiusTokens: mergeUniqueBy(
      available.flatMap(analysis => analysis.radiusTokens),
      (token: RadiusToken) => `${token.value}|${token.label}`
    ),
    shadowTokens: mergeUniqueBy(
      available.flatMap(analysis => analysis.shadowTokens),
      (token: ShadowToken) => `${token.value}|${token.label}`
    ),
    spacingTokens: mergeUniqueBy(
      available.flatMap(analysis => analysis.spacingTokens),
      (token: SpacingToken) => `${token.value}|${token.label}`
    ),
    layoutEvidence: mergeUniqueBy(
      available.flatMap(analysis => analysis.layoutEvidence),
      (token: LayoutEvidence) => `${token.kind}|${token.label}`
    ),
    stateTokens: mergeStateTokens(...available.map(analysis => analysis.stateTokens)),
    pageSections: pickLongest<PageSection>(analysis => analysis.pageSections),
    viewportSlices: pickLongest<ViewportSlice>(analysis => analysis.viewportSlices),
    cssTextExcerpt: available.map(analysis => analysis.cssTextExcerpt).find(Boolean) || primary.cssTextExcerpt,
    sourceCount: {
      inlineStyleBlocks: Math.max(...available.map(analysis => analysis.sourceCount.inlineStyleBlocks)),
      linkedStylesheets: Math.max(...available.map(analysis => analysis.sourceCount.linkedStylesheets)),
    },
  }
}

function isLikelyAuthNavigation(url: string): boolean {
  const lower = url.toLowerCase()
  return /\/(login|signin|sign-in|auth|session)(?:[/?#]|$)/.test(lower)
}

async function installClientNavigationLock(page: import('playwright').Page) {
  await page.addInitScript(() => {
    const block = (kind: string, url?: string | URL | null) => {
      try {
        const nextUrl = String(url || '')
        if (/\/(login|signin|sign-in|auth|session)(?:[/?#]|$)/i.test(nextUrl)) {
          console.warn(`[StyleLens:init] blocked client navigation (${kind}): ${nextUrl}`)
          return true
        }
      } catch {
        return false
      }
      return false
    }

    const locationProto = Object.getPrototypeOf(window.location) as Location & {
      assign?: (url: string | URL) => void
      replace?: (url: string | URL) => void
    }

    const originalAssign = locationProto.assign?.bind(window.location)
    const originalReplace = locationProto.replace?.bind(window.location)
    const originalPushState = history.pushState.bind(history)
    const originalReplaceState = history.replaceState.bind(history)

    if (originalAssign) {
      locationProto.assign = ((url: string | URL) => {
        if (block('location.assign', url)) return
        return originalAssign(url)
      }) as typeof window.location.assign
    }

    if (originalReplace) {
      locationProto.replace = ((url: string | URL) => {
        if (block('location.replace', url)) return
        return originalReplace(url)
      }) as typeof window.location.replace
    }

    history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (block('history.pushState', url)) return
      return originalPushState(data, unused, url)
    }) as typeof history.pushState

    history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (block('history.replaceState', url)) return
      return originalReplaceState(data, unused, url)
    }) as typeof history.replaceState
  })
}

async function installBrowserFingerprintAlignment(page: import('playwright').Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true,
    })
  })
}

async function prepareSettledPageForAtomicCapture(page: import('playwright').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      }
      html {
        scroll-behavior: auto !important;
      }
    `,
  }).catch(() => undefined)

  await page.evaluate(async () => {
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
    if (fonts?.ready) {
      await fonts.ready.catch(() => undefined)
    }
  }).catch(() => undefined)

  await page.waitForSelector('h1, main, [role="main"], [data-hero]', { state: 'visible', timeout: 5_000 }).catch(() => undefined)
  const hasStableTypography = await page.waitForFunction(async () => {
    const countVisiblePxText = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let node: Node | null
      let matched = 0
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim()
        if (!text || text.length < 2) continue
        const parent = node.parentElement
        if (!parent) continue
        const rect = parent.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) continue
        const style = getComputedStyle(parent)
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
        if (/\d+(\.\d+)?px/.test(style.fontSize)) matched += 1
      }
      return matched
    }

    const first = countVisiblePxText()
    if (first < 3) return false

    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    const second = countVisiblePxText()
    return second >= 3
  }, { timeout: 5_000 }).then(() => true).catch(() => false)

  console.log('[Screenshotter] stable typography detected:', hasStableTypography)
}

export async function captureScreenshot(targetUrl: string): Promise<ScreenshotResponse> {
  const normalizedUrl = targetUrl.toLowerCase().trim()
  const shouldBypassCache = normalizedUrl.includes('notion.com')
  let pageAnalysis = null

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled'],
    })
    try {
      const browserVersion = browser.version()
      const chromeMajor = browserVersion.split('.')[0] || '136'
      const context = await browser.newContext({
        viewport: { width: 1280, height: 960 },
        deviceScaleFactor: 2,
        locale: 'en-US',
        timezoneId: 'America/Los_Angeles',
        userAgent: [
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'AppleWebKit/537.36 (KHTML, like Gecko)',
          `Chrome/${browserVersion} Safari/537.36`,
        ].join(' '),
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-CH-UA': `"Google Chrome";v="${chromeMajor}", "Chromium";v="${chromeMajor}", "Not:A-Brand";v="99"`,
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"macOS"',
        },
      })
      const page = await context.newPage()
      await installBrowserFingerprintAlignment(page)
      await installClientNavigationLock(page)

      await page.route('**/*', route => {
        const request = route.request()
        if (request.isNavigationRequest() && isLikelyAuthNavigation(request.url())) {
          console.warn('[Screenshotter] Blocking likely auth navigation during same-page capture:', request.url())
          return route.abort('aborted')
        }
        return route.continue()
      })

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await prepareSettledPageForAtomicCapture(page)

      const [screenshotBuffer, desktopAnalysis] = await Promise.all([
        page.screenshot({
          type: 'jpeg',
          quality: 80,
          fullPage: true,
        }),
        analyzePageStylesFromPage(page, targetUrl, {
          pageAlreadySettled: true,
          snapshotCount: 1,
        }),
      ])

      try {
        const viewportAnalyses: PageStyleAnalysis[] = [desktopAnalysis]
        for (const viewport of ANALYSIS_VIEWPORTS.filter(item => !item.primary)) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height })
          await prepareSettledPageForAtomicCapture(page)
          const viewportAnalysis = await analyzePageStylesFromPage(page, targetUrl, {
            pageAlreadySettled: true,
            snapshotCount: 1,
          })
          viewportAnalyses.push(viewportAnalysis)
        }
        pageAnalysis = mergePageAnalysisVariants(viewportAnalyses)
      } catch (analysisError) {
        console.warn(
          '[Screenshotter] Same-page DOM analysis failed; continuing with screenshot-only local capture:',
          analysisError
        )
        pageAnalysis = null
      }
      const dataUrl = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`

      if (!shouldBypassCache) {
        screenshotCache.set(normalizedUrl, dataUrl)
        savePersistentCache(screenshotCache)
      }
      console.log(`[Screenshotter] Local Playwright capture successful and cached. Size: ${screenshotBuffer.byteLength}`)

      return {
        success: true,
        screenshotUrl: dataUrl,
        extractedCss: pageAnalysis?.cssTextExcerpt || '',
        pageAnalysis: pageAnalysis || undefined,
      }
    } finally {
      await browser.close().catch(() => undefined)
    }
  } catch (error) {
    console.warn('[Screenshotter] Local Playwright capture failed, falling back to split mode:', error)
  }

  try {
    pageAnalysis = await analyzePageStyles(targetUrl)
    pageAnalysis = sanitizePageAnalysis(pageAnalysis)
  } catch (error) {
    console.warn('[Screenshotter] Page analysis failed, falling back to screenshot-only mode:', error)
  }
  
  // 1. Check local cache
  if (!shouldBypassCache && screenshotCache.has(normalizedUrl)) {
    console.log(`[Screenshotter] Serving from cache: ${normalizedUrl}`)
    return {
      success: true,
      screenshotUrl: screenshotCache.get(normalizedUrl)!,
      extractedCss: pageAnalysis?.cssTextExcerpt || '',
      pageAnalysis: pageAnalysis || undefined,
    }
  }

  /**
   * Rotation Rule: Each ScreenshotOne key has a FREE quota of 100 screenshots per month.
   * With 6 keys, we have a total pool of 600 free screenshots per month.
   * The system will cycle through keys 1-6 if a "quota reached" error occurs.
   */
  const apiKeys = [
    process.env.SCREENSHOT_ONE_API_KEY,      // Key 1 (Primary)
    process.env.SCREENSHOT_ONE_API_KEY_2,    // Key 2 (Backup 1)
    process.env.SCREENSHOT_ONE_API_KEY_3,    // Key 3 (Backup 2)
    process.env.SCREENSHOT_ONE_API_KEY_4,    // Key 4 (Backup 3)
    process.env.SCREENSHOT_ONE_API_KEY_5,    // Key 5 (Backup 4)
    process.env.SCREENSHOT_ONE_API_KEY_6     // Key 6 (Backup 5)
  ].filter(Boolean) as string[]

  if (apiKeys.length === 0) {
    return { success: false, error: 'No ScreenshotOne API keys configured.' }
  }

  let lastError = null

  // 2. Try keys sequentially
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i]
    try {
      console.log(`[Screenshotter] Attempting capture with Key ${i + 1}/${apiKeys.length}...`)
      const params = new URLSearchParams({
        access_key: apiKey,
        url: targetUrl,
        viewport_width: '1280',
        viewport_height: '960',
        device_scale_factor: '2',
        format: 'jpg',
        image_quality: '80',
        block_ads: 'true',
        block_cookie_banners: 'true',
        delay: '3',
        full_page: 'true'
      })

      const endpoint = `https://api.screenshotone.com/take?${params.toString()}`
      
      const response = await fetch(endpoint)
      
      if (response.status === 400 || response.status === 402 || response.status === 429) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error_message || errorData.error || 'Quota/Limit error'
        console.warn(`[Screenshotter] Key ${i+1} failed: ${errorMsg}`)
        lastError = errorMsg
        
        if (i < apiKeys.length - 1) {
          console.log('[Screenshotter] Rotating to backup key...')
          continue 
        }
      }

      if (!response.ok) {
        throw new Error(`Screenshot API returned ${response.status}`)
      }

      // Convert to Base64 Data URL
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const dataUrl = `data:image/jpeg;base64,${base64}`

      // Update Cache
      if (!shouldBypassCache) {
        screenshotCache.set(normalizedUrl, dataUrl)
        savePersistentCache(screenshotCache)
      }
      console.log(`[Screenshotter] Capture successful and cached. Size: ${buffer.byteLength}`)

      return {
        success: true,
        screenshotUrl: dataUrl,
        extractedCss: pageAnalysis?.cssTextExcerpt || '',
        pageAnalysis: pageAnalysis || undefined,
      }
    } catch (err: any) {
      lastError = err.message
      if (i < apiKeys.length - 1) continue
    }
  }

  return {
    success: false,
    error: `Screenshot failed after trying all keys. Last error: ${lastError}`
  }
}
