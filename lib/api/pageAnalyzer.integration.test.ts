/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { analyzePageStyles } from '@/lib/api/pageAnalyzer'

const TARGETS = [
  'https://linear.app',
  'https://stripe.com',
  'https://www.apple.com',
  'https://www.notion.com/',
]

describe('pageAnalyzer real-world verification', () => {
  for (const url of TARGETS) {
    it(
      `extracts semantic color slots for ${url}`,
      async () => {
        const analysis = await analyzePageStyles(url)

        const summary = {
          url,
          heroBackground: analysis.semanticColorSystem?.heroBackground?.hex,
          pageBackground: analysis.semanticColorSystem?.pageBackground?.hex,
          surface: analysis.semanticColorSystem?.surface?.hex,
          textPrimary: analysis.semanticColorSystem?.textPrimary?.hex,
          primaryAction: analysis.semanticColorSystem?.primaryAction?.hex,
          contentColors: analysis.semanticColorSystem?.contentColors?.map(color => color.hex) || [],
          topCandidates: analysis.colorCandidates.slice(0, 8).map(candidate => ({
            hex: candidate.hex,
            property: candidate.property,
            hints: candidate.roleHints,
            layers: candidate.layerHints,
            score: candidate.evidenceScore,
          })),
        }

        console.log(JSON.stringify(summary, null, 2))

        expect(analysis.colorCandidates.length).toBeGreaterThan(0)
        expect(analysis.semanticColorSystem).toBeDefined()
        expect(
          analysis.semanticColorSystem?.heroBackground
          || analysis.semanticColorSystem?.pageBackground
        ).toBeDefined()
        expect(analysis.semanticColorSystem?.textPrimary).toBeDefined()
      },
      60_000
    )
  }
})
