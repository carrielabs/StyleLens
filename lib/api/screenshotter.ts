import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import type { ScreenshotResponse } from '@/lib/types'
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

function isLikelyAuthNavigation(url: string): boolean {
  const lower = url.toLowerCase()
  return /\/(login|signin|sign-in|auth|session)(?:[/?#]|$)/.test(lower)
}

export async function captureScreenshot(targetUrl: string): Promise<ScreenshotResponse> {
  const normalizedUrl = targetUrl.toLowerCase().trim()
  let pageAnalysis = null

  try {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 960 } })

      await page.route('**/*', route => {
        const request = route.request()
        if (request.isNavigationRequest() && isLikelyAuthNavigation(request.url())) {
          console.warn('[Screenshotter] Blocking likely auth navigation during same-page capture:', request.url())
          return route.abort('aborted')
        }
        return route.continue()
      })

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await page.waitForSelector('h1, main, [role="main"], [data-hero]', { state: 'visible', timeout: 5_000 }).catch(() => undefined)
      await page.waitForTimeout(350)

      const [buffer, analysis] = await Promise.all([
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
        pageAnalysis = analysis
      } catch (analysisError) {
        console.warn(
          '[Screenshotter] Same-page DOM analysis failed; continuing with screenshot-only local capture:',
          analysisError
        )
        pageAnalysis = null
      }
      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`

      screenshotCache.set(normalizedUrl, dataUrl)
      savePersistentCache(screenshotCache)
      console.log(`[Screenshotter] Local Playwright capture successful and cached. Size: ${buffer.byteLength}`)

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
  if (screenshotCache.has(normalizedUrl)) {
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
      screenshotCache.set(normalizedUrl, dataUrl)
      savePersistentCache(screenshotCache)
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
