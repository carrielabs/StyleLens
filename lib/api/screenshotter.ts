import type { ScreenshotResponse } from '@/lib/types'

export async function captureScreenshot(url: string): Promise<ScreenshotResponse> {
  // Free fallback MVP: Use ScreenshotOne API or a public alternative to get the screenshot.
  // Using a widely available free endpoint for MVP:
  const apiKey = process.env.SCREENSHOT_ONE_API_KEY || process.env.SCREENSHOT_ONE_API_KEY_2
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Screenshot service API key (1 or 2) not configured in environment.'
    }
  }

  try {
    // ScreenshotOne API params
    const params = new URLSearchParams({
      access_key: apiKey,
      url: url,
      viewport_width: '1280',
      viewport_height: '960',
      device_scale_factor: '2',
      format: 'jpg',
      image_quality: '80',
      block_ads: 'true',
      block_cookie_banners: 'true',
      delay: '3', // Wait for animations to settle
      full_page: 'true' // V8 User requested full page capture
    })

    const endpoint = `https://api.screenshotone.com/take?${params.toString()}`

    return {
      success: true,
      screenshotUrl: endpoint,
      // For MVP without headless browser, we leave extractedCss empty.
      // Phase 2 will implement Playwright for CSS scraping.
      extractedCss: ''
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to capture screenshot'
    }
  }
}
