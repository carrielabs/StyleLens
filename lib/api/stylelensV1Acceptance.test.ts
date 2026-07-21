import { describe, expect, it } from 'vitest'
import {
  STYLELENS_V1_ACCEPTANCE_CHECKS,
  STYLELENS_V1_ACCEPTANCE_SCORE_THRESHOLD,
  STYLELENS_V1_REAL_WORLD_TARGETS,
  buildStyleLensV1AcceptanceResult,
} from '@/lib/api/stylelensV1Acceptance'
import type { AnalysisQualityGate } from '@/lib/types'

function gate(score: number, status: AnalysisQualityGate['status'], checkId = 'fixture'): AnalysisQualityGate {
  return {
    score,
    status,
    checks: [{
      id: checkId,
      label: checkId,
      status,
      score,
      details: `${checkId} details`,
      blocking: status === 'fail',
    }],
    failureReasons: status === 'pass'
      ? []
      : [{
          checkId,
          label: checkId,
          severity: status === 'fail' ? 'blocking' : 'warning',
          message: `${checkId} reason`,
        }],
  }
}

describe('StyleLens v1 acceptance freeze', () => {
  it('freezes the seven real-world acceptance targets and the 80-point pass line', () => {
    expect(STYLELENS_V1_ACCEPTANCE_SCORE_THRESHOLD).toBe(80)
    expect(STYLELENS_V1_REAL_WORLD_TARGETS).toEqual([
      { id: 'rig', url: 'https://rig.ai/' },
      { id: 'mindmarket', url: 'https://mindmarket.com/' },
      { id: 'topanga', url: 'https://topanga.io/' },
      { id: 'aneshk-design', url: 'https://aneshk.design/' },
      { id: 'notion', url: 'https://www.notion.com/' },
      { id: 'stripe', url: 'https://stripe.com/' },
      { id: 'linear', url: 'https://linear.app/' },
    ])
  })

  it('freezes the v1 gate coverage instead of relying on one weak signal', () => {
    expect(STYLELENS_V1_ACCEPTANCE_CHECKS).toEqual([
      'semantic-color-evidence',
      'third-party-noise',
      'component-evidence',
      'measured-coverage',
      'evidence-confidence',
      'export-readiness',
      'generated-export-quality',
    ])
  })

  it('passes only when extraction and generated exports both pass the 80-point line', () => {
    const result = buildStyleLensV1AcceptanceResult({
      targetId: 'mindmarket',
      url: 'https://mindmarket.com/',
      extractionGate: gate(85, 'pass', 'semantic-color-evidence'),
      exportGate: gate(100, 'pass', 'generated-export-quality'),
    })

    expect(result.status).toBe('pass')
    expect(result.score).toBe(85)
    expect(result.failureReasons).toEqual([])
  })

  it('returns blocking failure reasons when either gate falls below v1 acceptance', () => {
    const result = buildStyleLensV1AcceptanceResult({
      targetId: 'mindmarket',
      url: 'https://mindmarket.com/',
      extractionGate: gate(79, 'warn', 'component-evidence'),
      exportGate: gate(60, 'fail', 'generated-export-quality'),
    })

    expect(result.status).toBe('fail')
    expect(result.score).toBe(60)
    expect(result.failureReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        checkId: 'style-extraction-quality',
        severity: 'blocking',
      }),
      expect.objectContaining({
        checkId: 'generated-export-quality',
        severity: 'blocking',
      }),
    ]))
  })
})
