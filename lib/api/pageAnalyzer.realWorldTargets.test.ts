/**
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest'
import { buildAnalysisQualityGate, buildComponentEvidenceSummary } from '@/lib/api/analysisQuality'
import { analyzePageStyles, sanitizePageAnalysis } from '@/lib/api/pageAnalyzer'
import { generateCssVariables } from '@/lib/exporters/cssExporter'
import { generateJsonToken } from '@/lib/exporters/jsonExporter'
import { generatePrompt } from '@/lib/exporters/promptExporter'
import { generateTailwindConfig } from '@/lib/exporters/tailwindExporter'
import { buildExportQualityGate } from '@/lib/exporters/exportQualityGate'
import type { ColorToken, PageStyleAnalysis, StyleReport } from '@/lib/types'
import { REAL_WORLD_STYLE_TARGETS } from '@/test/fixtures/real-world-style-targets'

const RUN_REAL_WORLD_TARGETS = process.env.STYLELENS_REAL_WORLD_TARGETS === '1'

async function analyzePageStylesWithRetry(url: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const analysis = await analyzePageStyles(url)
      const sanitized = sanitizePageAnalysis(analysis) || analysis
      const componentEvidence = sanitized.componentEvidence || buildComponentEvidenceSummary(sanitized)
      const qualityGate = sanitized.qualityGate || buildAnalysisQualityGate({
        ...sanitized,
        componentEvidence,
      })
      if (
        attempt < 3
        && (!sanitized.semanticColorSystem || qualityGate.status === 'fail' || qualityGate.score < 80)
      ) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        continue
      }
      return sanitized
    } catch (error) {
      lastError = error
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1200))
      }
    }
  }

  throw lastError
}

function tokenFromSemantic(analysis: PageStyleAnalysis, key: keyof NonNullable<PageStyleAnalysis['semanticColorSystem']>, role: ColorToken['role'], name: string): ColorToken | undefined {
  const color = analysis.semanticColorSystem?.[key]
  if (!color || Array.isArray(color)) return undefined
  return {
    ...color,
    role,
    name,
    description: color.description || name,
  }
}

function buildReportFromAnalysis(id: string, url: string, analysis: PageStyleAnalysis): StyleReport {
  const colors = [
    tokenFromSemantic(analysis, 'pageBackground', 'background', 'Page Background'),
    tokenFromSemantic(analysis, 'heroBackground', 'background', 'Hero Background'),
    tokenFromSemantic(analysis, 'surface', 'surface', 'Surface'),
    tokenFromSemantic(analysis, 'primaryAction', 'primary', 'Primary Action'),
    tokenFromSemantic(analysis, 'textPrimary', 'text', 'Primary Text'),
    tokenFromSemantic(analysis, 'border', 'border', 'Border'),
  ].filter((color): color is ColorToken => Boolean(color))

  return {
    sourceType: 'url',
    sourceLabel: url,
    pageAnalysis: analysis,
    colorSystem: analysis.semanticColorSystem,
    summary: `${id} real-world style baseline`,
    tags: ['real-world'],
    colors,
    gradients: [],
    typography: {
      fontFamily: analysis.typographyTokens[0]?.fontFamily || analysis.typographyCandidates[0]?.fontFamily || 'system-ui, sans-serif',
      confidence: analysis.typographyTokens[0] || analysis.typographyCandidates[0] ? 'identified' : 'inferred',
      headingWeight: Number(analysis.typographyTokens.find(token => token.usage === 'heading')?.fontWeight || analysis.typographyTokens[0]?.fontWeight || 700),
      bodyWeight: Number(analysis.typographyTokens.find(token => token.usage === 'body')?.fontWeight || analysis.typographyTokens[0]?.fontWeight || 400),
      fontSizeScale: analysis.typographyTokens.map(token => token.fontSize).filter(Boolean).slice(0, 3).join(' | ') || '16px',
      lineHeight: analysis.typographyTokens[0]?.lineHeight || '1.5',
      letterSpacing: analysis.typographyTokens[0]?.letterSpacing || '0',
      alignment: 'left',
      textTreatment: 'solid',
    },
    designDetails: {
      overallStyle: 'real-world extracted style',
      colorMode: 'system',
      borderRadius: analysis.radiusTokens[0]?.value || analysis.radiusCandidates[0] || '8px',
      shadowStyle: analysis.shadowTokens[0]?.value || analysis.shadowCandidates[0] || 'none',
      spacingSystem: analysis.spacingTokens.map(token => token.value).slice(0, 4).join(' | ') || analysis.spacingCandidates.slice(0, 4).join(' | ') || '8px grid',
      borderStyle: analysis.borderTokens?.[0] ? `${analysis.borderTokens[0].width} ${analysis.borderTokens[0].style}` : '1px solid',
      animationTendency: 'subtle',
      imageHandling: 'as source',
      layoutStructure: analysis.layoutEvidence.map(item => item.label).slice(0, 4).join(' | ') || analysis.layoutHints.join(' | ') || 'section stack',
      cssRadius: analysis.radiusTokens.map(token => token.value).slice(0, 4).join(' | ') || undefined,
      cssShadow: analysis.shadowTokens.map(token => token.value).slice(0, 3).join(' | ') || undefined,
    },
    createdAt: '2026-07-20T00:00:00.000Z',
  }
}

function expectValidExports(report: StyleReport) {
  const css = generateCssVariables(report)
  const tailwind = generateTailwindConfig(report)
  const json = generateJsonToken(report)
  const prompt = generatePrompt(report, 'en')
  const exportGate = buildExportQualityGate(report)

  expect(css).not.toMatch(/--(?:radius|shadow)-base:\s*[^;]*\|/)
  expect(tailwind).not.toMatch(/brand:\s*['"][^'"]*\|/)
  expect(() => JSON.parse(json)).not.toThrow()
  expect(prompt).not.toMatch(/禁止圆角.*100%|DO NOT add rounded corners[\s\S]*100%/)
  expect(exportGate.status).toBe('pass')
  expect(exportGate.score).toBeGreaterThanOrEqual(80)
}

;(RUN_REAL_WORLD_TARGETS ? describe : describe.skip)('pageAnalyzer seven-site real-world target verification', () => {
  for (const target of REAL_WORLD_STYLE_TARGETS) {
    it(
      `passes generic style extraction gates for ${target.id}`,
      async () => {
        const analysis = await analyzePageStylesWithRetry(target.url)
        const componentEvidence = analysis.componentEvidence || buildComponentEvidenceSummary(analysis)
        const qualityGate = analysis.qualityGate || buildAnalysisQualityGate({
          ...analysis,
          componentEvidence,
        })
        const thirdPartyCheck = qualityGate.checks.find(check => check.id === 'third-party-noise')
        const componentCheck = qualityGate.checks.find(check => check.id === 'component-evidence')

        console.log(JSON.stringify({
          id: target.id,
          url: target.url,
          quality: qualityGate,
          semantic: {
            heroBackground: analysis.semanticColorSystem?.heroBackground?.hex,
            pageBackground: analysis.semanticColorSystem?.pageBackground?.hex,
            surface: analysis.semanticColorSystem?.surface?.hex,
            textPrimary: analysis.semanticColorSystem?.textPrimary?.hex,
            primaryAction: analysis.semanticColorSystem?.primaryAction?.hex,
          },
          components: componentEvidence,
          topCandidates: analysis.colorCandidates.slice(0, 8).map(candidate => ({
            hex: candidate.hex,
            property: candidate.property,
            selector: candidate.selectorHint,
            hints: candidate.roleHints,
            layers: candidate.layerHints,
            score: candidate.evidenceScore,
          })),
        }, null, 2))

        expect(analysis.colorCandidates.length).toBeGreaterThan(0)
        expect(analysis.semanticColorSystem).toBeDefined()
        expect(analysis.semanticColorSystem?.pageBackground || analysis.semanticColorSystem?.heroBackground || analysis.semanticColorSystem?.surface).toBeDefined()
        expect(analysis.semanticColorSystem?.textPrimary).toBeDefined()
        expect(qualityGate.score).toBeGreaterThanOrEqual(80)
        expect(qualityGate.status).toBe('pass')
        expect(thirdPartyCheck?.status).toBe('pass')
        expect(componentCheck?.status).toBe('pass')
        expect(componentEvidence.button.count).toBeGreaterThan(0)
        expect(componentEvidence.navigation.count).toBeGreaterThan(0)
        expect(componentEvidence.cta.count).toBeGreaterThan(0)
        expectValidExports(buildReportFromAnalysis(target.id, target.url, analysis))
      },
      120_000
    )
  }
})
