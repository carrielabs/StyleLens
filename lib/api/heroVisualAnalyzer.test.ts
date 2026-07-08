/**
 * @vitest-environment node
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { analyzeHeroVisualSignals } from '@/lib/api/heroVisualAnalyzer'
import { buildSemanticColorSystem } from '@/lib/api/pageAnalyzer'

const FIXTURE_DIR = path.join(process.cwd(), 'test', 'fixtures', 'visual')
const NOTION_FIXTURE = path.join(FIXTURE_DIR, 'notion.com .jpeg')
const REAL_PAGE_FIXTURES = [
  NOTION_FIXTURE,
  path.join(FIXTURE_DIR, 'linear-app.png'),
  path.join(FIXTURE_DIR, 'supabase.png'),
]

function getBrightness(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return (r + g + b) / 3
}

describe('heroVisualAnalyzer', () => {
  it('extracts dark hero frame colors without being dominated by embedded white media', async () => {
    const width = 900
    const height = 1200
    const image = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })

    const darkHero = await sharp({
      create: {
        width,
        height: 360,
        channels: 3,
        background: '#16132C',
      },
    }).png().toBuffer()

    const embeddedPanel = await sharp({
      create: {
        width: 560,
        height: 170,
        channels: 3,
        background: '#F6F6F6',
      },
    }).png().toBuffer()

    const heroButton = await sharp({
      create: {
        width: 140,
        height: 40,
        channels: 3,
        background: '#5B6CFF',
      },
    }).png().toBuffer()

    const contentCard = await sharp({
      create: {
        width: 280,
        height: 220,
        channels: 3,
        background: '#FFCA4D',
      },
    }).png().toBuffer()

    const buffer = await image
      .composite([
        { input: darkHero, left: 0, top: 0 },
        { input: embeddedPanel, left: 170, top: 130 },
        { input: heroButton, left: 380, top: 96 },
        { input: contentCard, left: 60, top: 520 },
      ])
      .png()
      .toBuffer()

    const candidates = await analyzeHeroVisualSignals(buffer)
    const heroHexes = candidates
      .filter(candidate => candidate.layerHints.includes('hero'))
      .map(candidate => candidate.hex)
    const contentHexes = candidates
      .filter(candidate => candidate.property === 'screenshot-content')
      .map(candidate => candidate.hex)

    expect(heroHexes.some(hex => getBrightness(hex) < 40)).toBe(true)
    expect(heroHexes).not.toContain('#F6F6F6')
    expect(contentHexes.length).toBeGreaterThan(0)
  })

  it.skipIf(!existsSync(NOTION_FIXTURE))('extracts a dark hero and non-white action cues from the real Notion screenshot fixture', async () => {
    const imageBuffer = await readFile(NOTION_FIXTURE)
    const candidates = await analyzeHeroVisualSignals(imageBuffer)
    const semantic = buildSemanticColorSystem(candidates)

    const summary = {
      heroBackground: semantic?.heroBackground?.hex,
      heroPrimaryAction: semantic?.heroPrimaryAction?.hex,
      heroAccentColors: semantic?.heroAccentColors?.map(color => color.hex) || [],
      topCandidates: candidates.slice(0, 8).map(candidate => ({
        hex: candidate.hex,
        property: candidate.property,
        hints: candidate.roleHints,
      })),
    }

    console.log(JSON.stringify(summary, null, 2))

    expect(semantic?.heroBackground).toBeDefined()
    expect(getBrightness(semantic?.heroBackground?.hex || '#FFFFFF')).toBeLessThan(70)
    if (semantic?.heroPrimaryAction) {
      expect(getBrightness(semantic.heroPrimaryAction.hex)).toBeGreaterThan(60)
    }
  })

  it.skipIf(REAL_PAGE_FIXTURES.some(fixturePath => !existsSync(fixturePath)))('profiles the three real landing page fixtures for manual review', async () => {
    for (const fixturePath of REAL_PAGE_FIXTURES) {
      const imageBuffer = await readFile(fixturePath)
      const candidates = await analyzeHeroVisualSignals(imageBuffer)
      const semantic = buildSemanticColorSystem(candidates)

      console.log(JSON.stringify({
        fixturePath,
        heroBackground: semantic?.heroBackground?.hex,
        heroPrimaryAction: semantic?.heroPrimaryAction?.hex,
        heroAccentColors: semantic?.heroAccentColors?.map(color => color.hex) || [],
        pageBackground: semantic?.pageBackground?.hex,
        topCandidates: candidates.slice(0, 8).map(candidate => ({
          hex: candidate.hex,
          property: candidate.property,
          hints: candidate.roleHints,
        })),
      }, null, 2))

      expect(candidates.length).toBeGreaterThan(0)
      expect(semantic?.heroBackground).toBeDefined()
    }
  })
})
