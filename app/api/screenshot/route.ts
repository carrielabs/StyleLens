import { NextResponse } from 'next/server'
import { captureScreenshot } from '@/lib/api/screenshotter'
import type { ScreenshotRequest } from '@/lib/types'

export const maxDuration = 30

// Block SSRF: only allow public HTTP(S) URLs, reject private/internal ranges
function isSafeUrl(rawUrl: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

  const host = parsed.hostname.toLowerCase()

  // Block localhost variants
  if (host === 'localhost' || host === '0.0.0.0') return false

  // Block .local domains
  if (host.endsWith('.local')) return false

  // Block IPv4 private / loopback ranges
  const ipv4Parts = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Parts) {
    const [a, b] = [Number(ipv4Parts[1]), Number(ipv4Parts[2])]
    if (
      a === 10 ||                          // 10.0.0.0/8
      a === 127 ||                         // 127.0.0.0/8 loopback
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) ||          // 192.168.0.0/16
      (a === 169 && b === 254)             // 169.254.0.0/16 link-local (AWS metadata)
    ) return false
  }

  // Block IPv6 loopback / link-local
  if (host === '::1' || host.startsWith('fe80:')) return false

  return true
}

export async function POST(req: Request) {
  try {
    const body: ScreenshotRequest = await req.json()

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: 'Missing target URL' },
        { status: 400 }
      )
    }

    if (!isSafeUrl(body.url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or disallowed URL' },
        { status: 400 }
      )
    }

    const result = await captureScreenshot(body.url)

    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Screenshot API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to capture screenshot' },
      { status: 500 }
    )
  }
}
