/**
 * @vitest-environment node
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, it } from 'vitest'
import { analyzeHeroVisualSignals } from '@/lib/api/heroVisualAnalyzer'
import { buildSemanticColorSystem } from '@/lib/api/pageAnalyzer'

const CACHE_PATH = path.join(process.cwd(), '.screenshot_cache.json')

describe('notion cache debug', () => {
  it.skipIf(!existsSync(CACHE_PATH))('prints semantic slots from cached notion screenshot', async () => {
    const raw = JSON.parse(await readFile(CACHE_PATH, 'utf8')) as Record<string, string>
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
