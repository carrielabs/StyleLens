import type { AnalysisFailureReason, AnalysisQualityGate } from '@/lib/types'

export type StyleLensV1AcceptanceTarget = {
  id: string
  url: string
}

export type StyleLensV1AcceptanceStatus = 'pass' | 'fail'

export type StyleLensV1AcceptanceResult = {
  targetId: string
  url: string
  score: number
  status: StyleLensV1AcceptanceStatus
  failureReasons: AnalysisFailureReason[]
}

export type StyleLensV1AcceptanceInput = {
  targetId: string
  url: string
  extractionGate: AnalysisQualityGate
  exportGate: AnalysisQualityGate
}

export const STYLELENS_V1_ACCEPTANCE_SCORE_THRESHOLD = 80

export const STYLELENS_V1_REAL_WORLD_TARGETS: StyleLensV1AcceptanceTarget[] = [
  { id: 'rig', url: 'https://rig.ai/' },
  { id: 'mindmarket', url: 'https://mindmarket.com/' },
  { id: 'topanga', url: 'https://topanga.io/' },
  { id: 'aneshk-design', url: 'https://aneshk.design/' },
  { id: 'notion', url: 'https://www.notion.com/' },
  { id: 'stripe', url: 'https://stripe.com/' },
  { id: 'linear', url: 'https://linear.app/' },
]

export const STYLELENS_V1_ACCEPTANCE_CHECKS = [
  'semantic-color-evidence',
  'third-party-noise',
  'component-evidence',
  'measured-coverage',
  'evidence-confidence',
  'export-readiness',
  'generated-export-quality',
]

export function buildStyleLensV1AcceptanceResult(input: StyleLensV1AcceptanceInput): StyleLensV1AcceptanceResult {
  const extractionPasses = gatePasses(input.extractionGate)
  const exportPasses = gatePasses(input.exportGate)
  const score = Math.min(input.extractionGate.score, input.exportGate.score)
  const status: StyleLensV1AcceptanceStatus = extractionPasses && exportPasses ? 'pass' : 'fail'

  return {
    targetId: input.targetId,
    url: input.url,
    score,
    status,
    failureReasons: status === 'pass'
      ? []
      : [
          ...gateFailureReasons('style-extraction-quality', 'Style extraction quality', input.extractionGate),
          ...gateFailureReasons('generated-export-quality', 'Generated export quality', input.exportGate),
        ],
  }
}

function gatePasses(gate: AnalysisQualityGate): boolean {
  return gate.status === 'pass' && gate.score >= STYLELENS_V1_ACCEPTANCE_SCORE_THRESHOLD
}

function gateFailureReasons(
  checkId: string,
  label: string,
  gate: AnalysisQualityGate
): AnalysisFailureReason[] {
  if (gatePasses(gate)) return []

  const severity: AnalysisFailureReason['severity'] =
    gate.status === 'fail' || gate.score < STYLELENS_V1_ACCEPTANCE_SCORE_THRESHOLD
      ? 'blocking'
      : 'warning'

  return [{
    checkId,
    label,
    severity,
    message: `${label} is ${gate.score}/100 · ${gate.status}`,
  }, ...(gate.failureReasons || [])]
}
