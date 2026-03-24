/**
 * @vitest-environment node
 */

import { readFile } from 'node:fs/promises'
import { describe, it } from 'vitest'
import { analyzeHeroVisualSignals } from '@/lib/api/heroVisualAnalyzer'
import { buildSemanticColorSystem } from '@/lib/api/pageAnalyzer'

describe('notion cache debug', () => {
  it('prints semantic slots from cached notion screenshot', async () => {
    const cachePath = '/Users/shaobaolu/Desktop/网球网站/StyleLens/.screenshot_cache.json'
    const raw = JSON.parse(await readFile(cachePath, 'utf8')) as Record<string, string>
    const dataUrl = raw['https://www.notion.com/']
    const base64 = dataUrl.split(',')[1]
    const imageBuffer = Buffer.from(base64, 'base64')
    const candidates = await analyzeHeroVisualSignals(imageBuffer)
    const semantic = buildSemanticColorSystem(candidates)

    console.log(JSON.stringify({
      heroBackground: semantic?.heroBackground?.hex,
      heroPrimaryAction: semantic?.heroPrimaryAction?.hex,
      heroSecondaryAction: semantic?.heroSecondaryAction?.hex,
      pageBackground: semantic?.pageBackground?.hex,
      topCandidates: candidates.slice(0, 10).map(candidate => ({
        hex: candidate.hex,
        property: candidate.property,
        layerHints: candidate.layerHints,
        roleHints: candidate.roleHints,
      })),
    }, null, 2))
  })
})
