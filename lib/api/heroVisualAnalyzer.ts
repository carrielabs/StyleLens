import sharp from 'sharp'
import type { ComponentKind, PageColorCandidate, PageStyleAnalysis, TokenMeta } from '@/lib/types'
import { buildSemanticColorSystem } from '@/lib/api/pageAnalyzer'
import { detectEmbeddedMediaRegion, detectHeroCtaRegions, detectHeroRegion, type VisualRegion } from '@/lib/api/heroRegionDetector'

function quantizeChannel(channel: number): number {
  return Math.max(0, Math.min(255, Math.round(channel / 16) * 16))
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function isNearNeutral(r: number, g: number, b: number): boolean {
  return Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 18
}

function isExtremeMonochrome(r: number, g: number, b: number): boolean {
  const avg = (r + g + b) / 3
  return avg < 18 || avg > 246
}

async function extractDominantRegionColors(
  imageBuffer: Buffer,
  region: VisualRegion
): Promise<string[]> {
  if (region.width <= 4 || region.height <= 4) return []

  const { data, info } = await sharp(imageBuffer)
    .extract(region)
    .resize(96, 96, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map<string, number>()
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = rgbToHex(quantizeChannel(r), quantizeChannel(g), quantizeChannel(b))
    buckets.set(key, (buckets.get(key) || 0) + 1)
  }

  const ranked = [...buckets.entries()]
    .map(([hex, count]) => {
      const r = Number.parseInt(hex.slice(1, 3), 16)
      const g = Number.parseInt(hex.slice(3, 5), 16)
      const b = Number.parseInt(hex.slice(5, 7), 16)
      let priority = count
      if (!isNearNeutral(r, g, b)) priority += 60
      if (!isExtremeMonochrome(r, g, b)) priority += 30
      return { hex, priority }
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)

  return ranked.map(item => item.hex)
}

async function extractVibrantRegionColors(
  imageBuffer: Buffer,
  region: VisualRegion
): Promise<string[]> {
  if (region.width <= 4 || region.height <= 4) return []

  const { data, info } = await sharp(imageBuffer)
    .extract(region)
    .resize(160, 96, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map<string, { count: number; chroma: number; brightness: number }>()
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (r + g + b) / 3
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    if (brightness < 55 || brightness > 235 || chroma < 34) continue

    const key = rgbToHex(quantizeChannel(r), quantizeChannel(g), quantizeChannel(b))
    const current = buckets.get(key) || { count: 0, chroma: 0, brightness: 0 }
    current.count += 1
    current.chroma += chroma
    current.brightness += brightness
    buckets.set(key, current)
  }

  return [...buckets.entries()]
    .map(([hex, value]) => ({
      hex,
      score: value.count + (value.chroma / Math.max(value.count, 1)) * 2.2,
      brightness: value.brightness / Math.max(value.count, 1),
      chroma: value.chroma / Math.max(value.count, 1),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score
      if (a.chroma !== b.chroma) return b.chroma - a.chroma
      return b.brightness - a.brightness
    })
    .slice(0, 5)
    .map(item => item.hex)
}

async function extractHeroEdgeColors(
  imageBuffer: Buffer,
  heroRegion: VisualRegion,
  embeddedMediaRegion?: VisualRegion | null
): Promise<string[]> {
  const sideWidth = Math.max(24, Math.floor(heroRegion.width * 0.16))
  const topBandHeight = Math.max(24, Math.floor(heroRegion.height * 0.22))
  const lowerBandTop = heroRegion.top + Math.max(0, Math.floor(heroRegion.height * 0.58))
  const lowerBandHeight = Math.max(24, Math.floor(heroRegion.height * 0.18))

  const regions = [
    { left: heroRegion.left, top: heroRegion.top, width: sideWidth, height: heroRegion.height },
    { left: heroRegion.left + heroRegion.width - sideWidth, top: heroRegion.top, width: sideWidth, height: heroRegion.height },
    { left: heroRegion.left, top: heroRegion.top, width: heroRegion.width, height: topBandHeight },
    { left: heroRegion.left, top: lowerBandTop, width: Math.max(24, Math.floor(heroRegion.width * 0.18)), height: lowerBandHeight },
    { left: heroRegion.left + heroRegion.width - Math.max(24, Math.floor(heroRegion.width * 0.18)), top: lowerBandTop, width: Math.max(24, Math.floor(heroRegion.width * 0.18)), height: lowerBandHeight },
  ]
    .filter(region => region.width > 8 && region.height > 8)
    .filter(region => {
      if (!embeddedMediaRegion) return true
      const intersects =
        region.left < embeddedMediaRegion.left + embeddedMediaRegion.width &&
        region.left + region.width > embeddedMediaRegion.left &&
        region.top < embeddedMediaRegion.top + embeddedMediaRegion.height &&
        region.top + region.height > embeddedMediaRegion.top
      return !intersects
    })

  const colors = new Map<string, { weight: number; brightness: number; chroma: number }>()
  let darkRegionVotes = 0
  let lightRegionVotes = 0
  for (const region of regions) {
    const sampled = await extractDominantRegionColors(imageBuffer, region)
    sampled.forEach((hex, index) => {
      const weight = Math.max(1, 5 - index)
      const r = Number.parseInt(hex.slice(1, 3), 16)
      const g = Number.parseInt(hex.slice(3, 5), 16)
      const b = Number.parseInt(hex.slice(5, 7), 16)
      const brightness = (r + g + b) / 3
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)
      if (brightness < 120) darkRegionVotes += weight
      if (brightness > 215) lightRegionVotes += weight
      const current = colors.get(hex) || { weight: 0, brightness, chroma }
      current.weight += weight
      current.brightness = brightness
      current.chroma = chroma
      colors.set(hex, current)
    })
  }

  const prefersDarkHero = darkRegionVotes > lightRegionVotes * 1.2

  return [...colors.entries()]
    .map(([hex, value]) => {
      let score = value.weight
      if (prefersDarkHero && value.brightness > 225) score -= 8
      if (prefersDarkHero && value.brightness > 200 && value.chroma < 18) score -= 5
      if (prefersDarkHero && value.brightness < 110) score += 4
      return { hex, score }
    })
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .map(item => item.hex)
    .slice(0, 5)
}

async function extractHeroActionColors(
  imageBuffer: Buffer,
  regions: VisualRegion[]
): Promise<string[]> {
  const colors = new Map<string, number>()
  for (const region of regions) {
    const sampled = await extractVibrantRegionColors(imageBuffer, region)
    sampled.forEach((hex, index) => {
      const r = Number.parseInt(hex.slice(1, 3), 16)
      const g = Number.parseInt(hex.slice(3, 5), 16)
      const b = Number.parseInt(hex.slice(5, 7), 16)
      const brightness = (r + g + b) / 3
      const chroma = Math.max(r, g, b) - Math.min(r, g, b)
      const isEligible = chroma >= 28 && brightness > 40 && brightness < 235
      if (!isEligible) return
      const weight = Math.max(1, 6 - index) + Math.round(chroma / 32)
      colors.set(hex, (colors.get(hex) || 0) + weight)
    })
  }

  return [...colors.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 4)
}

export async function analyzeHeroVisualSignals(imageBuffer: Buffer): Promise<PageColorCandidate[]> {
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0
  if (width < 40 || height < 40) return []

  const heroRegion = await detectHeroRegion(imageBuffer)
  if (!heroRegion) return []
  const embeddedMediaRegion = await detectEmbeddedMediaRegion(imageBuffer, heroRegion)
  const heroColors = await extractHeroEdgeColors(imageBuffer, heroRegion, embeddedMediaRegion)
  const ctaRegions = await detectHeroCtaRegions(imageBuffer, heroRegion, embeddedMediaRegion)
  const heroActionColors = await extractHeroActionColors(imageBuffer, ctaRegions)
  const contentColors = await extractDominantRegionColors(imageBuffer, {
    left: 0,
    top: Math.floor(height * 0.42),
    width,
    height: Math.max(40, Math.floor(height * 0.42)),
  })

  const heroKinds: ComponentKind[] = ['hero', 'section', 'surface']
  const contentKinds: ComponentKind[] = ['card', 'surface', 'section']
  const visualMeta = (
    confidence: TokenMeta['confidence'],
    evidenceCount: number,
    context: string
  ): TokenMeta => ({
    source: 'screenshot-sampled',
    confidence,
    evidenceCount,
    context,
  })

  return [
    ...heroColors.map((hex, index) => ({
      hex,
      property: 'screenshot-hero',
      selectorHint: 'hero-region',
      count: 18 - index,
      roleHints: ['background', 'hero'],
      layerHints: ['hero'] as Array<'global' | 'hero' | 'content'>,
      componentKinds: heroKinds,
      evidenceScore: 30 - index * 3,
      meta: visualMeta(index === 0 ? 'high' : 'medium', 18 - index, 'hero color'),
    })),
    ...heroActionColors.map((hex, index) => ({
      hex,
      property: 'cta-background',
      selectorHint: 'hero-visual-cta',
      count: 16 - index,
      roleHints: ['primary', 'cta', 'accent'],
      layerHints: ['hero'] as Array<'global' | 'hero' | 'content'>,
      componentKinds: ['hero', 'button'] as ComponentKind[],
      evidenceScore: 28 - index * 4,
      meta: visualMeta(index === 0 ? 'high' : 'medium', 16 - index, 'hero action color'),
    })),
    ...contentColors.map((hex, index) => ({
      hex,
      property: 'screenshot-content',
      selectorHint: 'content-region',
      count: 8 - index,
      roleHints: ['surface'],
      layerHints: ['global'] as Array<'global' | 'hero' | 'content'>,
      componentKinds: contentKinds,
      evidenceScore: 12 - index * 2,
      meta: visualMeta('medium', 8 - index, 'content color'),
    })),
  ]
}

export async function mergeScreenshotColorSignals(
  pageAnalysis: PageStyleAnalysis | undefined,
  base64Data: string
): Promise<PageStyleAnalysis | undefined> {
  if (!pageAnalysis) return pageAnalysis

  try {
    const imageBuffer = Buffer.from(base64Data, 'base64')
    const visualCandidates = await analyzeHeroVisualSignals(imageBuffer)
    if (!visualCandidates.length) return pageAnalysis

    const augmentedCandidates = [...pageAnalysis.colorCandidates]

    for (const visualCandidate of visualCandidates) {
      const current = augmentedCandidates.find(candidate =>
        candidate.hex.toUpperCase() === visualCandidate.hex.toUpperCase() &&
        candidate.layerHints.some(layer => visualCandidate.layerHints.includes(layer))
      )
      if (current) {
        const existingEvidence = current.meta?.evidenceCount || current.count
        const visualEvidence = visualCandidate.meta?.evidenceCount || visualCandidate.count
        const isCrossConfirmed =
          current.meta?.source === 'dom-computed' &&
          visualCandidate.meta?.source === 'screenshot-sampled'

        current.count += visualCandidate.count
        current.evidenceScore = (current.evidenceScore || 0) + (visualCandidate.evidenceScore || 0)
        current.roleHints = [...new Set([...current.roleHints, ...visualCandidate.roleHints])]
        current.layerHints = [...new Set([...(current.layerHints || []), ...visualCandidate.layerHints])] as Array<'global' | 'hero' | 'content'>
        current.componentKinds = [...new Set([...(current.componentKinds || []), ...(visualCandidate.componentKinds || [])])]
        if (current.property === 'color' || current.property === 'border-color') {
          current.property = visualCandidate.property
        }
        current.meta = {
          source: current.meta?.source === 'dom-computed'
            ? 'dom-computed'
            : (visualCandidate.meta?.source || current.meta?.source || 'screenshot-sampled'),
          confidence: isCrossConfirmed
              ? 'high'
              : current.meta?.confidence === 'high' || visualCandidate.meta?.confidence === 'high'
                ? 'high'
                : current.meta?.confidence === 'medium' || visualCandidate.meta?.confidence === 'medium'
                  ? 'medium'
                  : 'low',
          evidenceCount: existingEvidence + visualEvidence,
          context: isCrossConfirmed
            ? `${current.meta?.context || visualCandidate.meta?.context || 'color'} (confirmed)`
            : (current.meta?.context || visualCandidate.meta?.context),
          viewport: current.meta?.viewport || visualCandidate.meta?.viewport,
        }
      } else {
        augmentedCandidates.push(visualCandidate)
      }
    }

    return {
      ...pageAnalysis,
      colorCandidates: augmentedCandidates,
      semanticColorSystem: buildSemanticColorSystem(augmentedCandidates),
    }
  } catch (error) {
    console.warn('[heroVisualAnalyzer] Screenshot color analysis failed:', error)
    return pageAnalysis
  }
}
