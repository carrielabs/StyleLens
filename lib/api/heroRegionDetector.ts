import sharp from 'sharp'

export type VisualRegion = { left: number; top: number; width: number; height: number }

type TileCandidate = VisualRegion & {
  brightness: number
  chroma: number
  contrast: number
  score: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

async function loadRgb(imageBuffer: Buffer, width: number) {
  const { data, info } = await sharp(imageBuffer)
    .resize({ width, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return { data, width: info.width, height: info.height, channels: info.channels }
}

function avgColor(
  data: Buffer,
  imageWidth: number,
  channels: number,
  region: VisualRegion
) {
  let rTotal = 0
  let gTotal = 0
  let bTotal = 0
  let count = 0

  for (let y = region.top; y < region.top + region.height; y += 1) {
    for (let x = region.left; x < region.left + region.width; x += 1) {
      const index = (y * imageWidth + x) * channels
      rTotal += data[index]
      gTotal += data[index + 1]
      bTotal += data[index + 2]
      count += 1
    }
  }

  const r = rTotal / Math.max(count, 1)
  const g = gTotal / Math.max(count, 1)
  const b = bTotal / Math.max(count, 1)
  const brightness = (r + g + b) / 3
  const chroma = Math.max(r, g, b) - Math.min(r, g, b)
  return { brightness, chroma }
}

export async function detectHeroRegion(imageBuffer: Buffer): Promise<VisualRegion | null> {
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width || 0
  const height = metadata.height || 0
  if (width < 40 || height < 40) return null

  return {
    left: 0,
    top: 0,
    width,
    height: Math.max(
      320,
      Math.min(
        Math.floor(height * 0.18),
        Math.floor(width * 0.55),
        1800
      )
    ),
  }
}

export async function detectEmbeddedMediaRegion(
  imageBuffer: Buffer,
  heroRegion: VisualRegion
): Promise<VisualRegion | null> {
  const sampleWidth = 180
  const { data, width, height, channels } = await loadRgb(imageBuffer, sampleWidth)
  const scaleX = heroRegion.width / width
  const scaleY = heroRegion.height / Math.max(height, 1)

  const searchTop = Math.floor(height * 0.18)
  const searchBottom = Math.floor(height * 0.9)
  const startX = Math.floor(width * 0.18)
  const endX = Math.floor(width * 0.82)
  const tileW = Math.max(6, Math.floor(width * 0.06))
  const tileH = Math.max(6, Math.floor(height * 0.045))

  let best: (VisualRegion & { area: number; brightness: number; chroma: number }) | null = null

  for (let y = searchTop; y < searchBottom - tileH; y += Math.max(3, Math.floor(tileH / 2))) {
    for (let x = startX; x < endX - tileW; x += Math.max(3, Math.floor(tileW / 2))) {
      const tile = { left: x, top: y, width: tileW, height: tileH }
      const { brightness, chroma } = avgColor(data, width, channels, tile)
      if (brightness < 205 || chroma > 26) continue

      let expandW = tileW
      let expandH = tileH
      while (x + expandW + tileW < endX) {
        const probe = { left: x + expandW, top: y, width: tileW, height: tileH }
        const sample = avgColor(data, width, channels, probe)
        if (sample.brightness < 196 || sample.chroma > 30) break
        expandW += tileW
      }

      while (y + expandH + tileH < searchBottom) {
        const probe = { left: x, top: y + expandH, width: Math.min(expandW, endX - x), height: tileH }
        const sample = avgColor(data, width, channels, probe)
        if (sample.brightness < 196 || sample.chroma > 30) break
        expandH += tileH
      }

      const area = expandW * expandH
      if (!best || area > best.area) {
        best = { left: x, top: y, width: expandW, height: expandH, area, brightness, chroma }
      }
    }
  }

  if (!best) return null
  if (best.area < width * height * 0.035) return null

  return {
    left: Math.floor(best.left * scaleX),
    top: Math.floor(best.top * scaleY),
    width: Math.floor(best.width * scaleX),
    height: Math.floor(best.height * scaleY),
  }
}

export async function detectHeroCtaRegions(
  imageBuffer: Buffer,
  heroRegion: VisualRegion,
  embeddedMediaRegion?: VisualRegion | null
): Promise<VisualRegion[]> {
  const sampleWidth = 220
  const { data, width, height, channels } = await loadRgb(imageBuffer, sampleWidth)
  const scaleX = heroRegion.width / width
  const scaleY = heroRegion.height / Math.max(height, 1)

  const ctaBottomLimit = embeddedMediaRegion
    ? Math.floor((embeddedMediaRegion.top / Math.max(heroRegion.height, 1)) * height) - 4
    : Math.floor(height * 0.55)
  const searchTop = Math.floor(height * 0.12)
  const searchBottom = clamp(ctaBottomLimit, searchTop + 12, Math.floor(height * 0.62))
  const startX = Math.floor(width * 0.2)
  const endX = Math.floor(width * 0.8)
  const tileW = Math.max(6, Math.floor(width * 0.035))
  const tileH = Math.max(5, Math.floor(height * 0.032))

  const tiles: TileCandidate[] = []

  for (let y = searchTop; y < searchBottom - tileH; y += Math.max(2, Math.floor(tileH / 2))) {
    for (let x = startX; x < endX - tileW; x += Math.max(2, Math.floor(tileW / 2))) {
      const tile = { left: x, top: y, width: tileW, height: tileH }
      const center = avgColor(data, width, channels, tile)
      if (center.chroma < 26 || center.brightness < 42 || center.brightness > 235) continue

      const pad = 2
      const surround = {
        left: clamp(x - pad, 0, width - 1),
        top: clamp(y - pad, 0, height - 1),
        width: clamp(tileW + pad * 2, 1, width - clamp(x - pad, 0, width - 1)),
        height: clamp(tileH + pad * 2, 1, height - clamp(y - pad, 0, height - 1)),
      }
      const outer = avgColor(data, width, channels, surround)
      const contrast = Math.abs(center.brightness - outer.brightness) + Math.abs(center.chroma - outer.chroma) * 0.6
      if (contrast < 18) continue

      const score = center.chroma * 1.3 + contrast + Math.max(0, 180 - Math.abs(center.brightness - 120))
      tiles.push({ ...tile, brightness: center.brightness, chroma: center.chroma, contrast, score })
    }
  }

  const ranked = tiles.sort((a, b) => b.score - a.score)
  const picked: VisualRegion[] = []

  for (const tile of ranked) {
    const overlaps = picked.some(region =>
      tile.left < region.left + region.width &&
      tile.left + tile.width > region.left &&
      tile.top < region.top + region.height &&
      tile.top + tile.height > region.top
    )
    if (overlaps) continue

    picked.push({
      left: Math.floor(tile.left * scaleX),
      top: Math.floor(tile.top * scaleY),
      width: Math.max(48, Math.floor(tile.width * scaleX * 2.4)),
      height: Math.max(20, Math.floor(tile.height * scaleY * 1.8)),
    })
    if (picked.length >= 4) break
  }

  return picked
}
