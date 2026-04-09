'use client'

import { useState } from 'react'
import type { StyleReport, RadiusToken, ShadowToken, BorderToken, TransitionToken, ButtonSnapshot, InputSnapshot, CardSnapshot, TagSnapshot, PageSection, VisualStyleAnalysis, InteractionStyleAI } from '@/lib/types'
import { gradeTokens, confidenceLabel } from '@/lib/design-details/gradeTokens'
import type { GradedTokenSet } from '@/lib/design-details/gradeTokens'
import { FLAGS } from '@/lib/flags'
import Typography from './Typography'

type MeasuredTab = 'components' | 'shape' | 'space' | 'typography'
type ComponentTab = 'button' | 'input' | 'card' | 'badge'

interface Props {
  report: StyleReport
  lang: 'zh' | 'en'
  onSectionHover?: (section: { yStart: number; yEnd: number } | null) => void
}

export default function DesignInspector({ report, lang, onSectionHover }: Props) {
  const [measuredTab, setMeasuredTab] = useState<MeasuredTab>('components')
  const [compTab, setCompTab] = useState<ComponentTab>('button')
  const [expandedShadows, setExpandedShadows] = useState<Set<number>>(new Set())
  function toggleShadow(i: number) {
    setExpandedShadows(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }
  const [btnHovered, setBtnHovered] = useState(false)
  const [btnActive, setBtnActive] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [hoveredWireframe, setHoveredWireframe] = useState<string | null>(null)

  const { colors, colorSystem, typography, designDetails } = report
  const analysis = report.pageAnalysis
  const sourceIsUrl = report.sourceType === 'url'
  const evidenceSummary = analysis?.evidenceSummary
  const coverageSummary = analysis?.coverageSummary

  // ── Snapshot data (DOM-measured button) ──────────────────────────────────
  const snap: ButtonSnapshot | undefined = analysis?.buttonSnapshot
  // ── Multi-variant snapshot arrays (Codex upstream, defensive access) ─────
  const buttonSnaps: ButtonSnapshot[] = ((analysis as any)?.buttonSnapshots as ButtonSnapshot[] | undefined)?.slice(0, 3) || (snap ? [snap] : [])
  const inputSnaps: InputSnapshot[]   = ((analysis as any)?.inputSnapshots  as InputSnapshot[]  | undefined)?.slice(0, 3) || []
  const cardSnaps:  CardSnapshot[]    = ((analysis as any)?.cardSnapshots   as CardSnapshot[]   | undefined)?.slice(0, 3) || []
  const tagSnaps:   TagSnapshot[]     = ((analysis as any)?.tagSnapshots    as TagSnapshot[]    | undefined)?.slice(0, 3) || []

  // ── Color tokens (fallback chain: colorSystem → colors array → defaults) ──
  const primaryHex   = snap?.backgroundColor
    || colorSystem?.primaryAction?.hex
    || colorSystem?.heroPrimaryAction?.hex
    || colors.find(c => c.role === 'primary')?.hex
    || '#1D1D1F'
  const primaryFgHex = snap?.color
    || (primaryHex ? (isLight(primaryHex) ? '#000000' : '#FFFFFF') : '#FFFFFF')
  const surfaceHex   = colorSystem?.surface?.hex       || colors.find(c => c.role === 'surface')?.hex  || '#F5F5F7'
  const textHex      = colorSystem?.textPrimary?.hex   || colors.find(c => c.role === 'text')?.hex     || '#1a1a1a'
  const borderHex    = colorSystem?.border?.hex        || colors.find(c => c.role === 'border')?.hex   || '#e5e5e5'
  const bgHex        = colorSystem?.pageBackground?.hex || colors.find(c => c.role === 'background')?.hex || '#FFFFFF'

  // ── Preview-safe derived colors (guards against saturated bg, invisible component text) ──
  const previewBg = safePreviewBg(bgHex, designDetails.colorMode)
  const { surface: previewSurface, text: previewText } = safeComponentColors(surfaceHex, textHex, designDetails.colorMode)

  // ── Source name label ─────────────────────────────────────────────────────
  const sourceName = report.sourceLabel.replace(/https?:\/\/(www\.)?/, '').split('/')[0]

  // ── Always show extracted styles directly — no neutral baseline toggle ────
  const effBg        = previewBg
  const effSurface   = previewSurface
  const effText      = previewText
  const effPrimary   = primaryHex
  const effPrimaryFg = primaryFgHex
  const effRadius    = (k: string) => bestRadius(k).value
  const effBorder    = (k: string) => bestBorder(k).value
  const effShadow    = (k: string) => bestShadow(k).value
  const effFont      = typography.fontFamily

  // ── Measured tokens ───────────────────────────────────────────────────────
  const radiusTokens: RadiusToken[]         = analysis?.radiusTokens     || []
  const shadowTokens: ShadowToken[]         = analysis?.shadowTokens     || []
  const borderTokens: BorderToken[]         = analysis?.borderTokens     || []
  const transitionTokens: TransitionToken[] = analysis?.transitionTokens || []
  const spacingTokens                       = analysis?.spacingTokens    || []
  const layoutEvidence                      = analysis?.layoutEvidence   || []
  const stateTokens                         = analysis?.stateTokens      || {}
  const pageMaxWidth                        = analysis?.pageMaxWidth
  const gridColumns                         = analysis?.gridColumns
  // Page sections: DOM-measured (URL) or AI-inferred (image)
  const pageSections: PageSection[]         = analysis?.pageSections?.length
    ? analysis.pageSections
    : (designDetails.pageSections || [])
  const pageSecsMeasured                    = !!(analysis?.pageSections?.length)

  // ── Graded token set (pure function layer) ───────────────────────────────────
  const graded: GradedTokenSet = gradeTokens(radiusTokens, shadowTokens, spacingTokens, layoutEvidence, borderTokens)

  // ── AI-inferred style ─────────────────────────────────────────────────────
  const visualStyle: VisualStyleAnalysis | undefined  = designDetails.visualStyle
  const interactionStyle: InteractionStyleAI | undefined = designDetails.interactionStyle

  const totalEvidenceCount = evidenceSummary?.totalEvidenceCount || 0
  const domEvidenceCount = evidenceSummary?.sourceBreakdown?.['dom-computed'] || 0
  const screenshotEvidenceCount = evidenceSummary?.sourceBreakdown?.['screenshot-sampled'] || 0
  const inferredEvidenceCount = evidenceSummary?.sourceBreakdown?.inferred || 0
  const domEvidenceRatio = totalEvidenceCount > 0 ? domEvidenceCount / totalEvidenceCount : 0
  const screenshotEvidenceRatio = totalEvidenceCount > 0 ? screenshotEvidenceCount / totalEvidenceCount : 0
  const inferredEvidenceRatio = totalEvidenceCount > 0 ? inferredEvidenceCount / totalEvidenceCount : 0
  const hasCssText = Boolean(analysis?.cssTextExcerpt?.trim())
  const styleSourceCount = (analysis?.sourceCount?.inlineStyleBlocks || 0) + (analysis?.sourceCount?.linkedStylesheets || 0)
  const inferredSections = (designDetails.pageSections || []).length > 0 && !pageSecsMeasured
  const hasFallback = inferredEvidenceCount > 0 || typography.confidence === 'inferred' || inferredSections
  const sectionCount = pageSections.length
  const ctaSectionCount = pageSections.filter(section => section.hasCTA).length
  const imageSectionCount = pageSections.filter(section => section.hasImage).length
  const measuredTransitionCount = transitionTokens.length
  const measuredInteractionStates = [...new Set(
    Object.values(stateTokens)
      .flatMap(values => values || [])
      .map(value => value.state)
      .filter(state => state && state !== 'default')
  )]
  const interactionSummaryItems = interactionStyle
    ? [
        interactionStyle.hoverEffect,
        interactionStyle.transitionFeel,
        interactionStyle.animationCharacter,
      ].filter(Boolean)
    : []
  const hasEvidenceCard = FLAGS.ENABLE_REPORT_EVIDENCE_SUMMARY && (
    totalEvidenceCount > 0 || Boolean(evidenceSummary?.overallConfidence) || Boolean(evidenceSummary?.notes?.length)
  )
  const hasCoverageCard = FLAGS.ENABLE_REPORT_COVERAGE_SUMMARY && (
    Boolean(coverageSummary) || styleSourceCount > 0 || hasCssText || hasFallback || sourceIsUrl
  )
  const hasInteractionCard = FLAGS.ENABLE_REPORT_INTERACTION_SUMMARY && (
    measuredInteractionStates.length > 0 || measuredTransitionCount > 0 || interactionSummaryItems.length > 0
  )
  const hasStructureCard = FLAGS.ENABLE_REPORT_INTERACTION_SUMMARY && (
    sectionCount > 0 || Boolean(gridColumns) || Boolean(pageMaxWidth)
  )

  const hasStateData = Object.values(stateTokens).some(
    (arr) => (arr as Array<{ state: string }>).some(v => v.state !== 'default')
  )

  // ── AI fallback CSS values ────────────────────────────────────────────────
  const cssRadius = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const cssShadow = designDetails.cssShadow || 'none'
  const radiusFallbackValues = cssRadius
    .split('|').map(v => v.trim()).filter(v => v && v !== 'none' && !v.includes('var('))
  const shadowFallbackValues = cssShadow === 'none' ? [] :
    cssShadow.split('|').map(v => v.trim()).filter(v => v && v !== 'none' && !v.includes('var('))
  // For UI components, 50%/100% means avatar/icon circles — exclude them from button/card/input radius
  const componentRadiusFallback = radiusFallbackValues.find(v => !v.includes('%')) || '6px'
  const primaryShadow = shadowFallbackValues[0] || 'none'

  // ── Effective snap arrays (real data preferred, synthesized fallback) ─────
  const effectiveButtonSnaps: ButtonSnapshot[] = buttonSnaps.length > 0 ? buttonSnaps : [{
    backgroundColor: primaryHex, color: primaryFgHex,
    borderRadius: componentRadiusFallback, paddingH: '20px', paddingV: '10px',
    fontSize: '14px', fontWeight: String(typography.headingWeight || 600),
    fontFamily: typography.fontFamily, border: 'none',
  }]
  const effectiveInputSnaps: InputSnapshot[] = inputSnaps.length > 0 ? inputSnaps : [{
    backgroundColor: surfaceHex, color: textHex, border: `1px solid ${borderHex}`,
    borderRadius: componentRadiusFallback, paddingH: '14px', paddingV: '10px',
    fontSize: '14px', fontFamily: typography.fontFamily,
  }]
  const effectiveCardSnaps: CardSnapshot[] = cardSnaps.length > 0 ? cardSnaps : [{
    backgroundColor: surfaceHex, border: `1px solid ${borderHex}`,
    borderRadius: componentRadiusFallback,
    boxShadow: primaryShadow !== 'none' ? primaryShadow : undefined,
    padding: '16px 20px',
  }]
  const effectiveTagSnaps: TagSnapshot[] = tagSnaps

  // ── meta.source → friendly label ──────────────────────────────────────────
  function sourceLabel(meta?: { source?: string; confidence?: string; evidenceCount?: number }): string {
    if (!meta?.source) return ''
    if (meta.source === 'dom-computed') return lang === 'zh' ? 'DOM 实测' : 'DOM'
    if (meta.source === 'screenshot-sampled') return lang === 'zh' ? '截图采样' : 'screenshot'
    return lang === 'zh' ? 'AI 推断' : 'AI inferred'
  }
  function sourceDotColor(meta?: { source?: string }): string {
    if (meta?.source === 'dom-computed') return '#34C759'
    if (meta?.source === 'screenshot-sampled') return '#FF9F0A'
    return '#AEAEB2'
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function bestRadius(kind: string): { value: string; measured: boolean } {
    // Prefer DOM-measured radius tokens scoped to this component kind
    const match = radiusTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: match.value, measured: true }
    // Fall back to any measured radius token (prefer non-percentage)
    const nonPctToken = radiusTokens.find(t => !t.value.includes('%'))
    if (nonPctToken) return { value: nonPctToken.value, measured: true }
    if (radiusTokens.length > 0) return { value: radiusTokens[0].value, measured: true }
    // Use buttonSnapshot for button kind
    if (snap?.borderRadius && kind === 'button' && !snap.borderRadius.includes('%'))
      return { value: snap.borderRadius, measured: true }
    // AI fallback — never use percentage for UI components
    return { value: componentRadiusFallback, measured: false }
  }

  function bestShadow(kind: string): { value: string; measured: boolean } {
    const match = shadowTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: match.value, measured: true }
    if (shadowTokens.length > 0) return { value: shadowTokens[0].value, measured: true }
    return { value: primaryShadow, measured: false }
  }

  function bestBorder(kind: string): { value: string; measured: boolean } {
    const match = borderTokens.find(t => (t.componentKinds as string[])?.includes(kind))
    if (match) return { value: `${match.width} ${match.style}${match.color ? ' ' + match.color : ''}`, measured: true }
    if (borderTokens.length > 0) {
      const t = borderTokens[0]
      return { value: `${t.width} ${t.style}${t.color ? ' ' + t.color : ''}`, measured: true }
    }
    return { value: `1px solid ${borderHex}`, measured: false }
  }

  function getStates(kind: string) {
    const entries = (stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)[kind] || []
    return entries.filter(e => e.state !== 'default' && e.value).slice(0, 6)
  }

  // Convert stateTokens for a given kind+state into React inline style (camelCase keys).
  // Skips border sub-properties (borderColor etc.) to avoid React shorthand/longhand conflict.
  function getStateStyle(kind: string, state: 'hover' | 'focus' | 'active'): React.CSSProperties {
    const entries = (stateTokens as Record<string, Array<{ state: string; property: string; value: string }>>)[kind] || []
    const result: Record<string, string> = {}
    // These conflict with the `border` shorthand used in btnStyle
    const skipProps = new Set(['borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderWidth', 'borderStyle'])
    entries
      .filter(e => e.state === state && e.value)
      .forEach(e => {
        const key = e.property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
        if (!skipProps.has(key)) result[key] = e.value
      })
    return result as React.CSSProperties
  }

  // ── Button style (uses exact snapshot if available) ───────────────────────
  const btnStyle: React.CSSProperties = snap ? {
    backgroundColor: snap.backgroundColor,
    color: snap.color,
    borderRadius: snap.borderRadius,
    padding: snap.paddingV && snap.paddingH ? `${snap.paddingV} ${snap.paddingH}` : undefined,
    fontSize: snap.fontSize,
    fontWeight: snap.fontWeight,
    fontFamily: snap.fontFamily || typography.fontFamily,
    border: snap.border || 'none',
    boxShadow: snap.boxShadow,
    letterSpacing: snap.letterSpacing,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } : {
    background: primaryHex,
    color: primaryFgHex,
    border: 'none',
    cursor: 'pointer',
    borderRadius: bestRadius('button').value,
    boxShadow: bestShadow('button').value,
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: typography.headingWeight || 600,
    letterSpacing: typography.letterSpacing || 'normal',
    fontFamily: typography.fontFamily,
    whiteSpace: 'nowrap' as const,
  }

  // Always use real extracted button style
  const effBtnStyle = btnStyle

  // ── Styles ────────────────────────────────────────────────────────────────
  const outerWrap: React.CSSProperties = {
    background: '#FFFFFF', borderRadius: '16px',
    border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
  }
  const tabBar: React.CSSProperties = {
    display: 'flex', gap: '0', borderBottom: '1px solid rgba(0,0,0,0.06)',
    padding: '0 24px', overflowX: 'auto',
  }
  const tabBtn = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '14px 0',
    marginRight: '24px', fontSize: '14px', fontWeight: active ? 600 : 400,
    color: active ? '#1D1D1F' : '#8E8E93',
    borderBottom: active ? '2px solid #1D1D1F' : '2px solid transparent',
    transition: 'all 0.15s ease', flexShrink: 0,
  })
  const tabContent: React.CSSProperties = { padding: '24px' }
  const sectionLabel: React.CSSProperties = {
    margin: '0 0 12px 0', fontSize: '12px', fontWeight: 600,
    color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const dot = (measured: boolean): React.CSSProperties => ({
    width: '6px', height: '6px', borderRadius: '50%',
    background: measured ? '#34C759' : '#AEAEB2',
    flexShrink: 0, display: 'inline-block',
  })
  const chip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 8px', borderRadius: '6px', background: '#F5F5F7',
    fontSize: '12px', color: '#3C3C43',
  }
  const subTabBar: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '20px' }
  const subTabBtn = (active: boolean): React.CSSProperties => ({
    background: active ? '#1D1D1F' : '#F5F5F7',
    border: 'none', cursor: 'pointer',
    padding: '6px 14px', borderRadius: '99px',
    fontSize: '13px', fontWeight: active ? 600 : 400,
    color: active ? '#FFFFFF' : '#3C3C43',
    transition: 'all 0.12s ease',
  })

  const MEASURED_TABS: [MeasuredTab, string][] = [
    ['components', lang === 'zh' ? '组件' : 'Components'],
    ['shape',      lang === 'zh' ? '形态' : 'Shape'],
    ['space',      lang === 'zh' ? '布局' : 'Layout'],
    ['typography', lang === 'zh' ? '字体' : 'Typography'],
  ]

  return (
    <div>
      {(hasEvidenceCard || hasCoverageCard || hasInteractionCard || hasStructureCard) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {hasEvidenceCard && (
            <SummaryCard
              title={lang === 'zh' ? '可信度摘要' : 'Evidence Summary'}
              subtitle={lang === 'zh' ? '看这份报告有多少来自实测，多少来自推断。' : 'Shows how much comes from measured evidence vs inference.'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SourceRatioRow
                  label={lang === 'zh' ? 'DOM 实测占比' : 'DOM measured'}
                  ratio={domEvidenceRatio}
                  count={domEvidenceCount}
                  color="#34C759"
                />
                <SourceRatioRow
                  label={lang === 'zh' ? '截图采样占比' : 'Screenshot sampled'}
                  ratio={screenshotEvidenceRatio}
                  count={screenshotEvidenceCount}
                  color="#FF9F0A"
                />
                <SourceRatioRow
                  label={lang === 'zh' ? 'AI 推断占比' : 'AI inferred'}
                  ratio={inferredEvidenceRatio}
                  count={inferredEvidenceCount}
                  color="#AEAEB2"
                />
              </div>

              {evidenceSummary?.overallConfidence && (
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {lang === 'zh' ? '关键结论可信度' : 'Key conclusion confidence'}
                  </div>
                  <ConfidenceBadge confidence={evidenceSummary.overallConfidence} lang={lang} />
                </div>
              )}

              {totalEvidenceCount > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#8E8E93' }}>
                  {lang === 'zh' ? `共 ${totalEvidenceCount} 条证据信号` : `${totalEvidenceCount} evidence signals total`}
                </div>
              )}

              {evidenceSummary?.notes?.length ? (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {evidenceSummary.notes.slice(0, 3).map(note => (
                    <span key={note} style={summaryNoteStyle}>
                      {note}
                    </span>
                  ))}
                </div>
              ) : null}
            </SummaryCard>
          )}

          {hasCoverageCard && (
            <SummaryCard
              title={lang === 'zh' ? '覆盖度说明' : 'Coverage Summary'}
              subtitle={lang === 'zh' ? '帮助判断哪些结果完整、哪些是兜底。' : 'Helps explain what was covered and what used fallback.'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <CoverageRow
                  label={lang === 'zh' ? '是否 URL 实测' : 'URL measured'}
                  value={sourceIsUrl ? (lang === 'zh' ? '是' : 'Yes') : (lang === 'zh' ? '否' : 'No')}
                  positive={sourceIsUrl}
                />
                <CoverageRow
                  label={lang === 'zh' ? '是否有 CSS 文本' : 'CSS text available'}
                  value={hasCssText ? (lang === 'zh' ? '有' : 'Yes') : (lang === 'zh' ? '无' : 'No')}
                  positive={hasCssText}
                />
                <CoverageRow
                  label={lang === 'zh' ? '样式源数量' : 'Style sources'}
                  value={String(styleSourceCount)}
                  detail={lang === 'zh'
                    ? `内联 ${analysis?.sourceCount?.inlineStyleBlocks || 0} / 外链 ${analysis?.sourceCount?.linkedStylesheets || 0}`
                    : `Inline ${analysis?.sourceCount?.inlineStyleBlocks || 0} / Linked ${analysis?.sourceCount?.linkedStylesheets || 0}`}
                />
                <CoverageRow
                  label={lang === 'zh' ? '是否存在 fallback' : 'Fallback present'}
                  value={hasFallback ? (lang === 'zh' ? '有' : 'Yes') : (lang === 'zh' ? '无' : 'No')}
                  positive={!hasFallback}
                />
              </div>

              {coverageSummary && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {lang === 'zh' ? '覆盖率' : 'Coverage'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1D1D1F' }}>
                      {formatPercent(coverageSummary.overallCoverage)}
                    </div>
                  </div>
                  <div style={{ height: '6px', borderRadius: '999px', background: '#F1F1F3', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, normalizePercent(coverageSummary.overallCoverage) * 100))}%`,
                      height: '100%',
                      background: '#1D1D1F',
                      borderRadius: '999px',
                    }} />
                  </div>
                  {coverageSummary.coveredAreas?.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {coverageSummary.coveredAreas.slice(0, 6).map(area => (
                        <span key={area} style={summaryNoteStyle}>
                          {coverageAreaLabel(area, lang)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </SummaryCard>
          )}

          {hasInteractionCard && (
            <SummaryCard
              title={lang === 'zh' ? '交互与动效' : 'Interaction & Motion'}
              subtitle={lang === 'zh' ? '基于实测交互态和页面动效线索。' : 'Summarized from measured states and motion cues.'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <CoverageRow
                  label={lang === 'zh' ? '检测到的交互态' : 'Measured states'}
                  value={measuredInteractionStates.length ? measuredInteractionStates.join(', ') : (lang === 'zh' ? '无' : 'None')}
                />
                <CoverageRow
                  label={lang === 'zh' ? '过渡 token 数量' : 'Transition tokens'}
                  value={String(measuredTransitionCount)}
                />
                <CoverageRow
                  label={lang === 'zh' ? '动效风格' : 'Motion style'}
                  value={interactionSummaryItems.length ? interactionSummaryItems.join(' · ') : (lang === 'zh' ? '未归纳' : 'Not summarized')}
                />
              </div>
            </SummaryCard>
          )}

          {hasStructureCard && (
            <SummaryCard
              title={lang === 'zh' ? '页面结构总览' : 'Structure Overview'}
              subtitle={lang === 'zh' ? '快速看页面段落、列数和宽度。' : 'Quick summary of sections, columns, and width.'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <CoverageRow
                  label={lang === 'zh' ? '页面段数' : 'Sections'}
                  value={String(sectionCount)}
                />
                <CoverageRow
                  label={lang === 'zh' ? 'CTA 段数' : 'CTA sections'}
                  value={String(ctaSectionCount)}
                />
                <CoverageRow
                  label={lang === 'zh' ? '含图段数' : 'Image sections'}
                  value={String(imageSectionCount)}
                />
                <CoverageRow
                  label={lang === 'zh' ? '主列信息' : 'Columns'}
                  value={gridColumns || (lang === 'zh' ? '未检测到' : 'Not detected')}
                />
                <CoverageRow
                  label={lang === 'zh' ? '页面宽度' : 'Page width'}
                  value={pageMaxWidth || (lang === 'zh' ? '未检测到' : 'Not detected')}
                />
              </div>
            </SummaryCard>
          )}
        </div>
      )}

      {/* ── Tab bar (same style as export code panel) ── */}
      <div style={{
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        paddingBottom: '0',
        alignItems: 'baseline',
        marginBottom: '24px',
      }}>
        {MEASURED_TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMeasuredTab(id)}
            style={{
              padding: '8px 0 12px 0',
              fontSize: '15px',
              fontWeight: measuredTab === id ? 600 : 500,
              letterSpacing: '0',
              background: 'none',
              border: 'none',
              color: measuredTab === id ? '#1D1D1F' : '#AEAEB2',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {label}
            {measuredTab === id && (
              <div style={{
                position: 'absolute', bottom: '-1px', left: '0', right: '0',
                height: '1.5px', background: '#1D1D1F', borderRadius: '1px'
              }} />
            )}
          </button>
        ))}
      </div>

      <div>

        {/* ══════════════ 组件 COMPONENTS ══════════════ */}
        {measuredTab === 'components' && (
          <>
            {/* Component type selector — identical to Typography tab segmented control */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F3F3F4', padding: '4px', borderRadius: '6px' }}>
                {(['button','input','card','badge'] as ComponentTab[]).map(k => (
                  <button key={k} onClick={() => setCompTab(k)} style={{
                    padding: '4px 12px', fontSize: '12px', fontWeight: 500,
                    borderRadius: '4px', cursor: 'pointer', border: 'none',
                    color: compTab === k ? '#111' : '#666',
                    backgroundColor: compTab === k ? '#FFF' : 'transparent',
                    boxShadow: compTab === k ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-sans)',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {k === 'button' ? (lang === 'zh' ? '按钮' : 'Button')
                      : k === 'input' ? (lang === 'zh' ? '输入框' : 'Input')
                      : k === 'card' ? (lang === 'zh' ? '卡片' : 'Card')
                      : (lang === 'zh' ? '标签' : 'Badge')}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Playground canvas — Gemini-style light (#FAFAFA + dot grid + white card variants) ── */}
            <div style={{
              position: 'relative',
              width: '100%',
              minHeight: '160px',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              backgroundColor: '#FAFAFA',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 24px 48px',
            }}>
              {/* Dot grid layer */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }} />
              {/* Variant content — above dot grid */}
              <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', gap: '32px', flexWrap: 'wrap',
                justifyContent: 'center', alignItems: 'center',
              }}>
                {compTab === 'button' && (
                  buttonSnaps.length > 0
                    ? buttonSnaps.map((s, i) => <ButtonVariantCard key={i} snap={s} index={i} lang={lang} getStateStyle={getStateStyle} dark={false} />)
                    : <PlaygroundEmpty lang={lang} kind={lang === 'zh' ? '按钮' : 'Button'} dark={false} />
                )}
                {compTab === 'input' && (
                  inputSnaps.length > 0
                    ? inputSnaps.map((s, i) => <InputVariantCard key={i} snap={s} index={i} lang={lang} dark={false} />)
                    : <PlaygroundEmpty lang={lang} kind={lang === 'zh' ? '输入框' : 'Input'} dark={false} />
                )}
                {compTab === 'card' && (
                  cardSnaps.length > 0
                    ? cardSnaps.map((s, i) => <CardVariantCard key={i} snap={s} index={i} lang={lang} typographyWeight={typography.headingWeight || 600} dark={false} />)
                    : <PlaygroundEmpty lang={lang} kind={lang === 'zh' ? '卡片' : 'Card'} dark={false} />
                )}
                {compTab === 'badge' && (
                  tagSnaps.length > 0
                    ? <TagPlayground snaps={tagSnaps} lang={lang} primaryHex={effPrimary} primaryFgHex={effPrimaryFg} surfaceHex={effSurface} textHex={effText} dark={false} />
                    : <PlaygroundEmpty lang={lang} kind={lang === 'zh' ? '标签' : 'Badge'} dark={false} />
                )}
              </div>
            </div>

            {/* ── Disclosure: CSS values — only show when real data exists for the current tab ── */}
            {(() => {
              const hasData =
                compTab === 'button' ? buttonSnaps.length > 0 :
                compTab === 'input'  ? inputSnaps.length > 0 :
                compTab === 'card'   ? cardSnaps.length > 0 :
                tagSnaps.length > 0
              if (!hasData) return null
              return (
                <>
                  <button
                    onClick={() => setShowTokens(v => !v)}
                    style={{
                      marginTop: '10px', background: 'none', border: 'none',
                      color: '#8E8E93', cursor: 'pointer', fontSize: '12px',
                      padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    {showTokens
                      ? (lang === 'zh' ? '收起数值 ▲' : 'Hide values ▲')
                      : (lang === 'zh' ? '查看数值 ▼' : 'Show values ▼')}
                  </button>

                  {showTokens && (
                    <div style={{ marginTop: '8px' }}>
                      {compTab === 'button' && <>
                        <TokenRow label="background"     value={effectiveButtonSnaps[0]?.backgroundColor || primaryHex}              measured={!!effectiveButtonSnaps[0]?.backgroundColor} />
                        <TokenRow label="color"          value={effectiveButtonSnaps[0]?.color || primaryFgHex}                      measured={!!effectiveButtonSnaps[0]?.color} />
                        <TokenRow label="border-radius"  value={effectiveButtonSnaps[0]?.borderRadius || bestRadius('button').value} measured={!!(effectiveButtonSnaps[0]?.borderRadius) || bestRadius('button').measured} />
                        {effectiveButtonSnaps[0]?.paddingV && effectiveButtonSnaps[0]?.paddingH && <TokenRow label="padding" value={`${effectiveButtonSnaps[0].paddingV} ${effectiveButtonSnaps[0].paddingH}`} measured={true} />}
                        {effectiveButtonSnaps[0]?.fontSize && <TokenRow label="font-size" value={effectiveButtonSnaps[0].fontSize!} measured={true} />}
                        <TokenRow label="font-weight"    value={effectiveButtonSnaps[0]?.fontWeight || String(typography.headingWeight || 600)} measured={!!effectiveButtonSnaps[0]?.fontWeight} />
                        <TokenRow label="font-family"    value={effectiveButtonSnaps[0]?.fontFamily || typography.fontFamily}        measured={!!effectiveButtonSnaps[0]?.fontFamily} />
                        {effectiveButtonSnaps[0]?.boxShadow && <TokenRow label="box-shadow" value={effectiveButtonSnaps[0].boxShadow!} measured={true} />}
                        {effectiveButtonSnaps[0]?.letterSpacing && <TokenRow label="letter-spacing" value={effectiveButtonSnaps[0].letterSpacing!} measured={true} />}
                        {effectiveButtonSnaps[0]?.width && effectiveButtonSnaps[0]?.height && <TokenRow label="size" value={`${effectiveButtonSnaps[0].width} × ${effectiveButtonSnaps[0].height}`} measured={true} />}
                      </>}
                      {compTab === 'input' && <>
                        <TokenRow label="background"    value={inputSnaps[0]?.backgroundColor || ''}            measured={!!inputSnaps[0]?.backgroundColor} />
                        <TokenRow label="border"        value={inputSnaps[0]?.border || ''}                     measured={!!inputSnaps[0]?.border} />
                        <TokenRow label="border-radius" value={inputSnaps[0]?.borderRadius || ''}               measured={!!inputSnaps[0]?.borderRadius} />
                        <TokenRow label="color"         value={inputSnaps[0]?.color || ''}                      measured={!!inputSnaps[0]?.color} />
                        <TokenRow label="font-family"   value={inputSnaps[0]?.fontFamily || ''}                 measured={!!inputSnaps[0]?.fontFamily} />
                      </>}
                      {compTab === 'card' && <>
                        <TokenRow label="background"    value={cardSnaps[0]?.backgroundColor || ''}  measured={!!cardSnaps[0]?.backgroundColor} />
                        <TokenRow label="border"        value={cardSnaps[0]?.border || ''}            measured={!!cardSnaps[0]?.border} />
                        <TokenRow label="border-radius" value={cardSnaps[0]?.borderRadius || ''}      measured={!!cardSnaps[0]?.borderRadius} />
                        <TokenRow label="box-shadow"    value={cardSnaps[0]?.boxShadow || ''}         measured={!!cardSnaps[0]?.boxShadow} />
                      </>}
                      {compTab === 'badge' && <>
                        <TokenRow label="border-radius" value={tagSnaps[0]?.borderRadius || ''}      measured={!!tagSnaps[0]?.borderRadius} />
                        <TokenRow label="background"    value={tagSnaps[0]?.backgroundColor || ''}   measured={!!tagSnaps[0]?.backgroundColor} />
                        <TokenRow label="color"         value={tagSnaps[0]?.color || ''}             measured={!!tagSnaps[0]?.color} />
                      </>}
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}

        {/* ══════════════ 形态 SHAPE ══════════════ */}
        {measuredTab === 'shape' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* 边框圆角 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>{lang === 'zh' ? '边框圆角' : 'Border Radius'}</div>
                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>· {lang === 'zh' ? 'DOM 测量' : 'DOM measured'}</div>
              </div>
              {graded.radius.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {graded.radius.map((t, i) => (
                    <RadiusGalleryItem key={i} token={{ value: t.value, count: t.sampleCount }} />
                  ))}
                </div>
              ) : <EmptyTab lang={lang} />}
            </div>

            {/* 阴影层级 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>{lang === 'zh' ? '阴影层级 & 深度' : 'Shadow Elevation'}</div>
              </div>
              {graded.shadow.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {graded.shadow.map((t, i) => (
                    <ShadowGalleryItem key={i} token={{ value: t.value, count: t.sampleCount }} />
                  ))}
                </div>
              ) : <EmptyTab lang={lang} />}
            </div>

            {/* 边框样式 */}
            {borderTokens.length > 0 && (
              <div>
                <p style={sectionLabel}>{lang === 'zh' ? '边框样式' : 'Border Style'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {borderTokens.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F5F5F7', borderRadius: '10px' }}>
                      <div style={{ width: '32px', height: '0', border: `${t.width} ${t.style} ${t.color || borderHex}` }} />
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#3C3C43' }}>
                        {t.width} {t.style}{t.color ? ` · ${t.color}` : ''}
                      </span>
                      <span style={{ fontSize: '11px', color: '#AEAEB2' }}>{t.sampleCount}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ 布局 LAYOUT ══════════════ */}
        {measuredTab === 'space' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* ── 1. 布局参考画廊 ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>
                  {lang === 'zh' ? '布局参考画廊' : 'Layout Gallery'}
                </div>
                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>· {lang === 'zh' ? '悬停联动截图' : 'hover highlight'}</div>
              </div>
              {pageSections.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {pageSections.map((sec, idx) => {
                    const key = `sec-${idx}`
                    const isHov = hoveredWireframe === key
                    return (
                      <div key={idx}
                        style={{ display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '12px', transition: 'background 0.2s', backgroundColor: isHov ? '#FAFAFA' : 'transparent' }}
                        onMouseEnter={() => {
                          setHoveredWireframe(key)
                          if (onSectionHover) {
                            const highlight = resolveHighlight(sec, analysis?.viewportSlices)
                            if (highlight) onSectionHover(highlight)
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredWireframe(null)
                          onSectionHover?.(null)
                        }}
                      >
                        <WireframePreview purpose={sec.purpose} layout={sec.layout} isHovered={isHov} hasCTA={sec.hasCTA} hasImage={sec.hasImage} />
                        <div style={{ paddingLeft: '4px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: isHov ? '#3B82F6' : '#111', transition: 'color 0.2s' }}>
                            {lang === 'zh' ? purposeLabel(sec.purpose) : (sec.heading || sec.purpose)}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <code style={{ fontSize: '11px', color: '#888', fontFamily: 'ui-monospace, monospace' }}>{sec.layout}</code>
                            {pageSecsMeasured && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34C759', flexShrink: 0 }} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                  {sourceIsUrl
                    ? (lang === 'zh' ? '未检测到页面结构' : 'No page sections detected')
                    : (lang === 'zh' ? '分析中（AI 推断）' : 'AI inferred from screenshot')}
                </p>
              )}
            </div>

            {/* ── 2. 宏观结构特征 ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>
                  {lang === 'zh' ? '宏观结构特征' : 'Technical Traits'}
                </div>
                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>· {lang === 'zh' ? 'DOM 验证' : 'DOM verified'}</div>
              </div>
              {(() => {
                const hasLayout = graded.layout.length > 0 || !!gridColumns
                if (!hasLayout && !designDetails.layoutEn) {
                  return (
                    <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                      {sourceIsUrl ? (lang === 'zh' ? '未检测到' : 'Not detected') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                    </p>
                  )
                }
                return (
                  <>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {gridColumns && (
                        <LayoutChip label={lang === 'zh' ? `列数: ${gridColumns}` : `Columns: ${gridColumns}`} muted={false} />
                      )}
                      {graded.layout.length > 0
                        ? graded.layout.map((item, i) => (
                            <LayoutChip key={i} label={item.label} muted={false} />
                          ))
                        : (lang === 'zh' ? designDetails.layoutZh || designDetails.layoutEn : designDetails.layoutEn)
                            ?.split('|').map((v, i) => (
                              <LayoutChip key={i} label={v.trim()} muted={true} />
                            ))
                      }
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#888' }}>
                      {lang === 'zh' ? '这些是构建该网页底层宏观框架时使用的核心 CSS 技术栈。' : 'Core CSS techniques used to build the page structure.'}
                    </p>
                  </>
                )
              })()}
            </div>

            {/* ── 3. 间距系统 + 页面宽度 ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Spacing */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>
                    {lang === 'zh' ? '间距系统' : 'Spacing Scale'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 500 }}>· {lang === 'zh' ? '高频测量' : 'high-freq'}</div>
                </div>
                {graded.spacing.length > 0 ? (
                  <div style={{ border: '1px solid #EAEAEA', borderRadius: '12px', padding: '4px 20px' }}>
                    {graded.spacing.map((t, i) => (
                      <SpacingRow key={i} token={t} lang={lang} isLast={i === graded.spacing.length - 1} />
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                    {sourceIsUrl ? (lang === 'zh' ? '暂未检测到间距数据' : 'No spacing data') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                  </p>
                )}
              </div>

              {/* Page width */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>
                    {lang === 'zh' ? '页面宽度' : 'Page Width'}
                  </div>
                </div>
                {pageMaxWidth ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '20px', background: '#F5F5F7', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: '#1D1D1F', borderRadius: '4px', width: `${Math.min(100, (parseFloat(pageMaxWidth) / 1920) * 100)}%` }} />
                      </div>
                      <code style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1D1D1F', flexShrink: 0 }}>{pageMaxWidth}</code>
                    </div>
                    <span style={{ fontSize: '11px', color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={dot(true)} />{lang === 'zh' ? '测量值' : 'Measured'}
                    </span>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
                    {sourceIsUrl ? (lang === 'zh' ? '未检测到' : 'Not detected') : (lang === 'zh' ? '需要 URL' : 'Requires URL')}
                  </p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ══════════════ 字体 TYPOGRAPHY ══════════════ */}
        {measuredTab === 'typography' && (
          <Typography
            data={report.typography}
            analysis={report.pageAnalysis}
            sourceType={report.sourceType}
            lang={lang}
            fullWidth={false}
          />
        )}

      </div>
    </div>
  )
}

const summaryNoteStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '999px',
  background: '#F5F5F7',
  color: '#666',
  fontSize: '11px',
  lineHeight: 1.4,
}

function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value > 1 ? value / 100 : value
}

function formatPercent(value: number): string {
  return `${Math.round(normalizePercent(value) * 100)}%`
}

function confidenceText(confidence: 'high' | 'medium' | 'low') {
  if (confidence === 'high') return '高'
  if (confidence === 'medium') return '中'
  return '低'
}

function coverageAreaLabel(
  area: 'color' | 'typography' | 'radius' | 'shadow' | 'spacing' | 'layout' | 'interaction' | 'sections' | 'components',
  lang: 'zh' | 'en'
) {
  const zhMap = {
    color: '颜色',
    typography: '字体',
    radius: '圆角',
    shadow: '阴影',
    spacing: '间距',
    layout: '布局',
    interaction: '交互',
    sections: '分区',
    components: '组件',
  } as const
  const enMap = {
    color: 'Color',
    typography: 'Typography',
    radius: 'Radius',
    shadow: 'Shadow',
    spacing: 'Spacing',
    layout: 'Layout',
    interaction: 'Interaction',
    sections: 'Sections',
    components: 'Components',
  } as const
  return lang === 'zh' ? zhMap[area] : enMap[area]
}

// ── Helper components ──────────────────────────────────────────────────────────

function SummaryCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid rgba(0,0,0,0.06)',
      padding: '18px 18px 16px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#8E8E93', lineHeight: 1.6, marginBottom: '14px' }}>{subtitle}</div>
      {children}
    </div>
  )
}

function SourceRatioRow({
  label,
  ratio,
  count,
  color,
}: {
  label: string
  ratio: number
  count: number
  color: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: '#3C3C43' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#1D1D1F', fontWeight: 600 }}>
          {formatPercent(ratio)}{count > 0 ? ` · ${count}` : ''}
        </div>
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: '#F1F1F3', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, ratio * 100))}%`,
          height: '100%',
          borderRadius: '999px',
          background: color,
        }} />
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence, lang }: { confidence: 'high' | 'medium' | 'low'; lang: 'zh' | 'en' }) {
  const styleMap = {
    high: { bg: 'rgba(52,199,89,0.12)', text: '#1F7A3D' },
    medium: { bg: 'rgba(255,159,10,0.14)', text: '#9A5A00' },
    low: { bg: 'rgba(174,174,178,0.18)', text: '#636366' },
  } as const
  const tone = styleMap[confidence]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 10px',
      borderRadius: '999px',
      background: tone.bg,
      color: tone.text,
      fontSize: '12px',
      fontWeight: 600,
    }}>
      {lang === 'zh' ? confidenceText(confidence) : confidence}
    </span>
  )
}

function CoverageRow({
  label,
  value,
  detail,
  positive,
}: {
  label: string
  value: string
  detail?: string
  positive?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      paddingBottom: '10px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '12px', color: '#3C3C43' }}>{label}</div>
        {detail ? <div style={{ fontSize: '11px', color: '#8E8E93' }}>{detail}</div> : null}
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: positive === undefined ? '#1D1D1F' : positive ? '#1F7A3D' : '#636366',
        flexShrink: 0,
      }}>
        {value}
      </div>
    </div>
  )
}

function SpacingRow({ token, lang, isLast }: { token: { value: string; freqRatio: number; sampleCount: number }; lang: 'zh' | 'en'; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '9px 12px', margin: '0 -12px',
        borderRadius: '8px',
        backgroundColor: hovered ? '#F5F5F7' : 'transparent',
        transition: 'background 0.15s ease',
        borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
      }}
    >
      <code style={{ width: '40px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', fontWeight: 500, color: '#111', flexShrink: 0 }}>{token.value}</code>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ height: '14px', backgroundColor: hovered ? '#C8C8C8' : '#E0E0E0', borderRadius: '2px', width: `${Math.max(4, token.freqRatio * 160)}px`, transition: 'background 0.15s ease, width 0.3s ease' }} />
        {token.sampleCount > 100 && (
          <span style={{ fontSize: '10px', backgroundColor: '#FEF08A', color: '#854D0E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {lang === 'zh' ? '高频核心' : 'Top hit'}
          </span>
        )}
      </div>
      <div style={{ fontSize: '12px', color: hovered ? '#555' : '#888', flexShrink: 0, transition: 'color 0.15s' }}>{token.sampleCount}× usage</div>
    </div>
  )
}

function LayoutChip({ label, muted }: { label: string; muted: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
        color: muted ? (hovered ? '#888' : '#AEAEB2') : (hovered ? '#1D1D1F' : '#111'),
        border: `1px solid ${hovered ? '#D0D0D0' : '#EAEAEA'}`,
        backgroundColor: hovered ? '#F0F0F0' : '#FAFAFA',
        transition: 'all 0.15s ease',
        cursor: 'default', display: 'inline-block',
      }}
    >
      {label}
    </span>
  )
}

function ComponentPreview({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: bg, borderRadius: '12px', padding: '32px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '140px', border: '1px solid rgba(0,0,0,0.06)',
    }}>
      {children}
    </div>
  )
}

// ── Playground variant cards ───────────────────────────────────────────────

function PlaygroundEmpty({ lang, kind, dark = true }: { lang: 'zh' | 'en'; kind: string; dark?: boolean }) {
  const muted = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'
  const faint = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <code style={{ fontSize: '12px', color: muted, fontFamily: 'ui-monospace, monospace' }}>
        {lang === 'zh' ? `未检测到 ${kind}` : `No ${kind} detected`}
      </code>
      <code style={{ fontSize: '10px', color: faint, fontFamily: 'ui-monospace, monospace' }}>
        {lang === 'zh' ? '该页面可能不包含此组件' : 'This page may not contain this component'}
      </code>
    </div>
  )
}

function VariantLabel({ children, dark = true }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <code style={{
      fontSize: '10px',
      color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
      fontFamily: 'ui-monospace, "Cascadia Code", monospace',
      letterSpacing: '0.03em', whiteSpace: 'nowrap',
      display: 'block', textAlign: 'center', maxWidth: '180px',
      overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {children}
    </code>
  )
}

function ButtonVariantCard({ snap, index, lang, getStateStyle, dark = true }: {
  snap: ButtonSnapshot
  index: number
  lang: 'zh' | 'en'
  getStateStyle: (kind: string, state: 'hover' | 'focus' | 'active') => React.CSSProperties
  dark?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)

  // Detect whether button has a real (non-transparent) fill
  const isTransparentBg = !snap.backgroundColor
    || snap.backgroundColor === 'transparent'
    || snap.backgroundColor === 'rgba(0,0,0,0)'
    || snap.backgroundColor.toLowerCase() === '#ffffff00'

  // Canvas is always light (#FAFAFA) — ensure transparent buttons have readable text
  // snap.color from a light-theme page is reliable; guard against invisible white-on-white
  const canvasColor = isTransparentBg
    ? (snap.color && !isLight(snap.color) ? snap.color : '#1D1D1F')
    : snap.color
      ? snap.color
      : (snap.backgroundColor && isLight(snap.backgroundColor) ? '#1D1D1F' : '#FFFFFF')

  // Transparent-bg buttons without a border get a subtle dark outline on light canvas
  const canvasBorder = isTransparentBg && (!snap.border || snap.border === 'none')
    ? '1px solid rgba(0,0,0,0.18)'
    : snap.border || 'none'

  // "filled" = has real background color (even if also has border)
  // "outlined" = transparent background + explicit border
  // "ghost" = transparent background + no border
  const hasFill = !isTransparentBg
  const hasBorder = !!(snap.border && snap.border !== 'none')
  const labelKind = hasFill ? 'filled'
    : hasBorder ? 'outlined'
    : 'ghost'

  // Hover: filled buttons get a brightness-down effect; outlined/ghost get a subtle bg fill
  const hoverStyle: React.CSSProperties = hovered && !active
    ? hasFill
      ? { filter: 'brightness(0.90)' }
      : { backgroundColor: 'rgba(0,0,0,0.05)' }
    : {}
  const activeStyle: React.CSSProperties = active
    ? { transform: 'scale(0.97)', filter: hasFill ? 'brightness(0.83)' : 'none' }
    : {}

  const btnStyle: React.CSSProperties = {
    backgroundColor: isTransparentBg ? 'transparent' : snap.backgroundColor,
    color: canvasColor,
    borderRadius: snap.borderRadius || '6px',
    padding: snap.paddingV && snap.paddingH ? `${snap.paddingV} ${snap.paddingH}` : '10px 20px',
    fontSize: snap.fontSize || '14px',
    fontWeight: snap.fontWeight || 600,
    fontFamily: snap.fontFamily || 'inherit',
    border: canvasBorder,
    boxShadow: snap.boxShadow,
    letterSpacing: snap.letterSpacing,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.2s ease',
    outline: 'none',
    ...hoverStyle,
    ...activeStyle,
  }
  const labelRadius = snap.borderRadius ? `r:${snap.borderRadius}` : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <button
        style={btnStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setActive(false) }}
        onMouseDown={() => setActive(true)}
        onMouseUp={() => setActive(false)}
      >
        {isValidButtonText(snap.text) ? snap.text : (lang === 'zh' ? '主要按钮' : 'Button')}
      </button>
      <VariantLabel dark={dark}>{labelKind}{labelRadius ? `  ·  ${labelRadius}` : ''}{snap.fontWeight ? `  ·  ${snap.fontWeight}` : ''}</VariantLabel>
    </div>
  )
}

function InputVariantCard({ snap, index, lang, dark = true }: {
  snap: InputSnapshot
  index: number
  lang: 'zh' | 'en'
  dark?: boolean
}) {
  // Derive readable text color based on input's actual background
  const inputBg = snap.backgroundColor || 'rgba(255,255,255,0.06)'
  const inputIsLight = snap.backgroundColor ? isLight(snap.backgroundColor) : false
  const inputTextColor = snap.color
    ? snap.color  // trust the real measured color
    : inputIsLight ? '#1D1D1F' : 'rgba(255,255,255,0.9)'
  const inputBorderColor = snap.border && snap.border !== 'none'
    ? snap.border
    : inputIsLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.15)'

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    color: inputTextColor,
    border: inputBorderColor,
    borderRadius: snap.borderRadius || '6px',
    padding: snap.paddingV && snap.paddingH ? `${snap.paddingV} ${snap.paddingH}` : '10px 14px',
    fontSize: snap.fontSize || '14px',
    fontFamily: snap.fontFamily || 'inherit',
    outline: 'none',
    width: '220px',
    boxSizing: 'border-box' as const,
  }
  const labelBorder = snap.border && snap.border !== 'none' ? 'bordered' : 'borderless'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <input
        readOnly
        defaultValue=""
        placeholder={snap.placeholder || (lang === 'zh' ? '输入框示例' : 'Input placeholder')}
        style={inputStyle}
      />
      <VariantLabel dark={dark}>{labelBorder}{snap.borderRadius ? `  ·  r:${snap.borderRadius}` : ''}</VariantLabel>
    </div>
  )
}

function CardVariantCard({ snap, index, lang, typographyWeight, dark = true }: {
  snap: CardSnapshot
  index: number
  lang: 'zh' | 'en'
  typographyWeight: number
  dark?: boolean
}) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: snap.backgroundColor || 'rgba(255,255,255,0.08)',
    border: snap.border || '1px solid rgba(255,255,255,0.1)',
    borderRadius: snap.borderRadius || '12px',
    boxShadow: snap.boxShadow,
    padding: snap.padding || '16px 20px',
    width: '200px',
    boxSizing: 'border-box' as const,
  }
  const hasShadow = !!(snap.boxShadow && snap.boxShadow !== 'none')
  // Derive readable text colors based on card's actual background
  const cardBg = snap.backgroundColor || 'rgba(255,255,255,0.08)'
  const cardIsLight = snap.backgroundColor ? isLight(snap.backgroundColor) : false
  const cardHeadingColor = cardIsLight ? '#1D1D1F' : '#FFFFFF'
  const cardBodyColor = cardIsLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div style={cardStyle}>
        <div style={{
          fontSize: snap.headingFontSize || '14px',
          fontWeight: snap.headingFontWeight ? Number(snap.headingFontWeight) : typographyWeight,
          color: cardHeadingColor,
          marginBottom: '6px',
          fontFamily: 'inherit',
        }}>
          {snap.headingText || (lang === 'zh' ? '卡片标题' : 'Card Title')}
        </div>
        <div style={{ fontSize: '12px', color: cardBodyColor, fontFamily: 'inherit' }}>
          {lang === 'zh' ? '内容描述文字' : 'Description text'}
        </div>
      </div>
      <VariantLabel dark={dark}>r:{snap.borderRadius || '?'}  ·  {hasShadow ? 'elevated' : 'flat'}</VariantLabel>
    </div>
  )
}

function TagPlayground({ snaps, lang, primaryHex, primaryFgHex, surfaceHex, textHex, dark = true }: {
  snaps: TagSnapshot[]
  lang: 'zh' | 'en'
  primaryHex: string
  primaryFgHex: string
  surfaceHex: string
  textHex: string
  dark?: boolean
}) {
  // Synthesize 3 variants when no real data
  const displaySnaps: Array<{ backgroundColor: string; color: string; border?: string; borderRadius: string; paddingH?: string; paddingV?: string; fontSize?: string; fontWeight?: string; text?: string }> =
    snaps.length > 0 ? snaps.map(s => ({
      backgroundColor: s.backgroundColor || primaryHex,
      color: s.color || primaryFgHex,
      border: s.border,
      borderRadius: s.borderRadius || '999px',
      paddingH: s.paddingH,
      paddingV: s.paddingV,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      text: s.text,
    })) : [
      { backgroundColor: primaryHex, color: primaryFgHex, borderRadius: '999px', text: lang === 'zh' ? '主要' : 'Primary' },
      { backgroundColor: 'transparent', color: primaryHex, border: `1px solid ${primaryHex}`, borderRadius: '999px', text: lang === 'zh' ? '边框' : 'Outline' },
      { backgroundColor: surfaceHex, color: textHex, borderRadius: '999px', text: lang === 'zh' ? '次要' : 'Secondary' },
    ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {displaySnaps.map((s, i) => (
          <span key={i} style={{
            backgroundColor: s.backgroundColor,
            color: s.color,
            border: s.border || 'none',
            borderRadius: s.borderRadius,
            padding: s.paddingV && s.paddingH ? `${s.paddingV} ${s.paddingH}` : '4px 12px',
            fontSize: s.fontSize || '12px',
            fontWeight: s.fontWeight ? Number(s.fontWeight) : 500,
            whiteSpace: 'nowrap' as const,
          }}>
            {s.text || (lang === 'zh' ? `标签 ${i + 1}` : `Tag ${i + 1}`)}
          </span>
        ))}
      </div>
      <VariantLabel dark={dark}>r:{displaySnaps[0]?.borderRadius || '999px'}{snaps.length > 0 ? `  ·  ${snaps.length} variant${snaps.length > 1 ? 's' : ''}` : '  ·  synthesized'}</VariantLabel>
    </div>
  )
}

function TokenRow({ label, value, measured }: { label: string; value: string; measured: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: '#8E8E93', minWidth: '108px', flexShrink: 0 }}>{label}</span>
      <code style={{ fontSize: '12px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {value}
      </code>
    </div>
  )
}

function StateRow({ state, prop, value }: { state: string; prop: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 12px', background: '#F5F5F7', borderRadius: '8px',
    }}>
      <code style={{ fontSize: '11px', color: '#8E8E93', minWidth: '60px' }}>:{state}</code>
      <span style={{ fontSize: '11px', color: '#AEAEB2', flex: 1 }}>{prop}</span>
      <code style={{ fontSize: '11px', color: '#1D1D1F', fontFamily: 'var(--font-mono)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </code>
    </div>
  )
}

// ── Wireframe preview for layout gallery ────────────────────────────────────
// ── Gemini: useCopy hook + CopyToast ────────────────────────────────────────
function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return [copied, copy]
}

function CopyToast({ show }: { show: boolean }) {
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#111', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '100px', opacity: show ? 1 : 0, pointerEvents: 'none', transition: 'all 0.2s ease', zIndex: 10 }}>已复制</div>
  )
}

function RadiusGalleryItem({ token }: { token: { value: string; count: number } }) {
  const [copied, copy] = useCopy()
  return (
    <div onClick={() => copy(`border-radius: ${token.value};`)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}>
      <div style={{ width: '48px', height: '48px', backgroundColor: '#F5F5F7', border: '1px solid #E5E5E5', borderRadius: token.value, display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'border-color 0.15s ease' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#111'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E5E5'}>
        <CopyToast show={copied} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#111', fontWeight: 500 }}>{token.value}</span>
        <span style={{ fontSize: '10px', color: '#AEAEB2' }}>{token.count}×</span>
      </div>
    </div>
  )
}

function ShadowGalleryItem({ token }: { token: { value: string; count: number } }) {
  const [copied, copy] = useCopy()
  return (
    <div onClick={() => copy(`box-shadow: ${token.value};`)}
      style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s ease', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F9F9FA' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
      <CopyToast show={copied} />
      {/* Shadow preview — Gemini-style: dot grid box + floating white card */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0,
        background: 'radial-gradient(#E5E5E5 1px, transparent 1px)',
        backgroundSize: '8px 8px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ width: '40px', height: '40px', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #F0F0F0', boxShadow: token.value }} />
      </div>
      {/* Shadow value — wraps naturally, fills middle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#111',
          wordBreak: 'break-all', lineHeight: 1.6,
        }}>
          {token.value}
        </span>
        <span style={{ fontSize: '11px', color: '#AEAEB2' }}>{token.count}×</span>
      </div>
    </div>
  )
}

// ── Resolve which portion of the screenshot to highlight on hover ─────────
// Priority: viewportSlices (geometric, per-screen) → screenStartPct → yStartPct
function resolveHighlight(
  sec: PageSection,
  viewportSlices?: Array<{ index: number; yStartPct: number; yEndPct: number; dominantSectionId?: string }>
): { yStart: number; yEnd: number } | null {
  // 1. Use viewportSlices — find slices that overlap this section's Y range
  if (viewportSlices && viewportSlices.length > 0 && sec.yStartPct != null && sec.yEndPct != null) {
    const overlapping = viewportSlices.filter(
      s => s.yStartPct < sec.yEndPct! && s.yEndPct > sec.yStartPct!
    )
    if (overlapping.length > 0) {
      return {
        yStart: overlapping[0].yStartPct,
        yEnd: overlapping[overlapping.length - 1].yEndPct,
      }
    }
  }
  // 2. Fall back to screen-mapped coords if available
  const yStart = sec.screenStartPct ?? sec.yStartPct
  const yEnd   = sec.screenEndPct   ?? sec.yEndPct
  if (yStart != null && yEnd != null) return { yStart, yEnd }
  return null
}

function purposeLabel(purpose: string): string {
  const map: Record<string, string> = {
    hero: '主视觉', features: '功能区', pricing: '定价', testimonials: '评价',
    cta: '行动区', footer: '页脚', section: '内容区',
  }
  return map[purpose] || purpose
}

function WireframePreview({ purpose, layout, isHovered, hasCTA, hasImage }: {
  purpose: string
  layout: string
  isHovered: boolean
  hasCTA?: boolean
  hasImage?: boolean
}) {
  const accent    = isHovered ? '#3B82F6' : '#C8C8CC'
  const secondary = isHovered ? 'rgba(59,130,246,0.22)' : '#E2E2E7'
  const block     = isHovered ? 'rgba(59,130,246,0.10)' : '#EBEBF0'
  const box: React.CSSProperties = {
    width: '100%', height: '96px',
    backgroundColor: isHovered ? '#EFF6FF' : '#F7F7F8',
    borderRadius: '8px',
    border: isHovered ? '1.5px solid rgba(59,130,246,0.55)' : '1px solid #E2E2E7',
    overflow: 'hidden', boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    boxShadow: isHovered ? '0 4px 12px rgba(59,130,246,0.10)' : 'none',
  }

  // ── layout is the primary driver ──────────────────────────────────────────

  if (layout === '2-column') {
    return (
      <div style={{ ...box, display: 'flex', padding: '12px', gap: '10px', alignItems: 'stretch' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px' }}>
          <div style={{ width: '75%', height: '10px', backgroundColor: accent, borderRadius: '2px' }} />
          <div style={{ width: '100%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
          <div style={{ width: '85%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
          {hasCTA && <div style={{ width: '48px', height: '14px', backgroundColor: accent, borderRadius: '3px', marginTop: '2px', opacity: 0.85 }} />}
        </div>
        <div style={{ flex: 1, backgroundColor: block, borderRadius: '5px' }} />
      </div>
    )
  }

  if (layout === 'asymmetric') {
    // 60 / 40 split — visually distinct from 2-column
    return (
      <div style={{ ...box, display: 'flex', padding: '12px', gap: '10px', alignItems: 'stretch' }}>
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '5px' }}>
          <div style={{ width: '70%', height: '10px', backgroundColor: accent, borderRadius: '2px' }} />
          <div style={{ width: '100%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
          <div style={{ width: '80%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
          <div style={{ width: '55%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
        </div>
        <div style={{ flex: 2, backgroundColor: block, borderRadius: '5px' }} />
      </div>
    )
  }

  if (layout === '3-column-grid') {
    return (
      <div style={{ ...box, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '10px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ backgroundColor: block, borderRadius: '5px', display: 'flex', flexDirection: 'column', padding: '6px', gap: '4px' }}>
            <div style={{ width: '14px', height: '14px', backgroundColor: secondary, borderRadius: '3px' }} />
            <div style={{ width: '80%', height: '5px', backgroundColor: accent, borderRadius: '2px', marginTop: '2px' }} />
            <div style={{ width: '100%', height: '4px', backgroundColor: secondary, borderRadius: '2px' }} />
          </div>
        ))}
      </div>
    )
  }

  if (layout === '4-column-grid') {
    return (
      <div style={{ ...box, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', padding: '10px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ backgroundColor: block, borderRadius: '4px', display: 'flex', flexDirection: 'column', padding: '5px', gap: '3px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: secondary, borderRadius: '2px' }} />
            <div style={{ width: '90%', height: '4px', backgroundColor: accent, borderRadius: '2px', marginTop: '2px' }} />
            <div style={{ width: '100%', height: '3px', backgroundColor: secondary, borderRadius: '2px' }} />
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'grid') {
    return (
      <div style={{ ...box, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px', padding: '10px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ backgroundColor: block, borderRadius: '5px' }} />
        ))}
      </div>
    )
  }

  // ── full-width: purpose as secondary discriminator ────────────────────────

  if (purpose === 'footer') {
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', padding: '10px 12px', gap: '6px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ width: '60%', height: '6px', backgroundColor: accent, borderRadius: '2px' }} />
              <div style={{ width: '100%', height: '4px', backgroundColor: secondary, borderRadius: '2px' }} />
              <div style={{ width: '80%', height: '4px', backgroundColor: secondary, borderRadius: '2px' }} />
              <div style={{ width: '90%', height: '4px', backgroundColor: secondary, borderRadius: '2px' }} />
            </div>
          ))}
        </div>
        <div style={{ height: '1px', backgroundColor: secondary }} />
      </div>
    )
  }

  if (purpose === 'pricing') {
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', gap: '7px' }}>
        <div style={{ width: '35%', height: '8px', backgroundColor: accent, borderRadius: '2px' }} />
        <div style={{ display: 'flex', gap: '6px', flex: 1, width: '100%' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, backgroundColor: i === 1 ? (isHovered ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.06)') : block,
              borderRadius: '5px',
              border: i === 1 ? `1.5px solid ${accent}` : '1px solid transparent',
              display: 'flex', flexDirection: 'column', gap: '3px', padding: '5px',
            }}>
              <div style={{ width: '50%', height: '5px', backgroundColor: i === 1 ? accent : secondary, borderRadius: '2px' }} />
              <div style={{ width: '65%', height: '8px', backgroundColor: i === 1 ? accent : secondary, borderRadius: '2px', opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (purpose === 'testimonials') {
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', padding: '8px 14px', gap: '5px', justifyContent: 'center' }}>
        <div style={{ fontSize: '22px', lineHeight: 1, color: accent, fontFamily: 'Georgia, serif', opacity: 0.55 }}>"</div>
        <div style={{ width: '90%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
        <div style={{ width: '72%', height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: i === 0 ? accent : block, border: `1px solid ${secondary}`, opacity: i === 0 ? 0.7 : 1 }} />
          ))}
        </div>
      </div>
    )
  }

  if (purpose === 'cta') {
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', gap: '7px' }}>
        <div style={{ width: '55%', height: '11px', backgroundColor: accent, borderRadius: '2px' }} />
        <div style={{ width: '38%', height: '7px', backgroundColor: secondary, borderRadius: '2px' }} />
        <div style={{ width: '80px', height: '20px', backgroundColor: accent, borderRadius: '4px', marginTop: '3px', opacity: 0.85 }} />
      </div>
    )
  }

  if (purpose === 'features') {
    return (
      <div style={{ ...box, display: 'flex', flexDirection: 'column', padding: '10px 14px', gap: '5px', justifyContent: 'center' }}>
        <div style={{ width: '40%', height: '9px', backgroundColor: accent, borderRadius: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '3px' }}>
          {[1, 0.9, 0.75].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />
              <div style={{ width: `${w * 100}%`, height: '6px', backgroundColor: secondary, borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // hero / default full-width
  return (
    <div style={{ ...box, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px', gap: '6px' }}>
      <div style={{ width: '65%', height: '14px', backgroundColor: accent, borderRadius: '3px' }} />
      <div style={{ width: '45%', height: '8px', backgroundColor: secondary, borderRadius: '3px' }} />
      {hasCTA !== false && (
        <div style={{ width: '64px', height: '18px', backgroundColor: accent, borderRadius: '3px', marginTop: '4px', opacity: 0.8 }} />
      )}
    </div>
  )
}

function SectionRow({ section, measured, lang, primaryHex }: {
  section: PageSection; measured: boolean; lang: 'zh' | 'en'; primaryHex: string
}) {
  const purposeColors: Record<string, string> = {
    hero: primaryHex,
    features: '#34C759',
    pricing: '#FF9F0A',
    testimonials: '#AF52DE',
    cta: '#FF3B30',
    footer: '#8E8E93',
    section: '#007AFF',
  }
  const purposeLabel: Record<string, { en: string; zh: string }> = {
    hero:         { en: 'Hero',         zh: '主视觉' },
    features:     { en: 'Features',     zh: '功能介绍' },
    pricing:      { en: 'Pricing',      zh: '定价' },
    testimonials: { en: 'Testimonials', zh: '用户评价' },
    cta:          { en: 'CTA',          zh: '行动召唤' },
    footer:       { en: 'Footer',       zh: '页脚' },
    section:      { en: 'Section',      zh: '内容区' },
  }
  const color = purposeColors[section.purpose] || '#8E8E93'
  const label = lang === 'zh'
    ? (purposeLabel[section.purpose]?.zh || section.purpose)
    : (purposeLabel[section.purpose]?.en || section.purpose)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '10px', background: '#F5F5F7',
    }}>
      {/* Color indicator */}
      <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      {/* Purpose badge */}
      <div style={{
        padding: '3px 8px', borderRadius: '6px',
        background: `${color}20`, color,
        fontSize: '11px', fontWeight: 700, flexShrink: 0, minWidth: '64px', textAlign: 'center',
      }}>
        {label}
      </div>
      {/* Heading — strip AI qualifier suffixes like "(implied)", "(skeleton)", "(inferred)" */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '12px', color: '#3C3C43', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {section.heading
            ? section.heading.replace(/\s*\((implied|skeleton|inferred|estimated|assumed|unknown)[^)]*\)/gi, '').trim() || (lang === 'zh' ? '（无标题）' : '(no heading)')
            : (lang === 'zh' ? '（无标题）' : '(no heading)')}
        </div>
        <div style={{ fontSize: '11px', color: '#AEAEB2', marginTop: '2px' }}>
          {section.layout}{section.columns > 1 ? ` · ${section.columns} col` : ''}
          {section.hasCTA ? ` · ${lang === 'zh' ? '有CTA' : 'has CTA'}` : ''}
          {section.hasImage ? ` · ${lang === 'zh' ? '有图' : 'has image'}` : ''}
        </div>
      </div>
      {/* Measured dot */}
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
    </div>
  )
}

function InteractionChip({ label, value, measured }: { label: string; value: string; measured: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', background: '#F5F5F7', borderRadius: '10px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: '#8E8E93', minWidth: '80px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1D1D1F' }}>{value}</span>
    </div>
  )
}

function StyleFactCard({ label, value, sub, measured, accent, lang }: {
  label: string; value: string; sub?: string; measured: boolean; accent?: string; lang?: 'zh' | 'en'
}) {
  // Only apply capitalize for purely ASCII/Latin values (English); Chinese values don't need it
  const isLatinValue = /^[\x00-\x7F\s-]+$/.test(value)
  return (
    <div style={{
      padding: '14px 16px', background: '#F5F5F7', borderRadius: '12px',
      borderLeft: accent ? `3px solid ${accent}` : '3px solid #E5E5EA',
    }}>
      <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1D1D1F', textTransform: isLatinValue ? 'capitalize' : 'none' }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#AEAEB2' }}>
          {sub}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: measured ? '#34C759' : '#AEAEB2', display: 'inline-block' }} />
        <span style={{ fontSize: '10px', color: '#AEAEB2' }}>
          {measured
            ? (lang === 'zh' ? '测量值' : 'Measured')
            : (lang === 'zh' ? 'AI 推断' : 'AI inferred')}
        </span>
      </div>
    </div>
  )
}

function EmptyTab({ lang }: { lang: 'zh' | 'en' }) {
  return (
    <p style={{ margin: 0, fontSize: '13px', color: '#AEAEB2' }}>
      {lang === 'zh' ? '未检测到数据' : 'No data detected'}
    </p>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: '#8E8E93' }}>{label}</span>
    </span>
  )
}

/** Convert #RRGGBB to "r,g,b" for use in rgba() strings */
function hexToRgbParts(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '0,0,0'
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ].join(',')
}

function translateIconStyle(v: string): string {
  const m: Record<string, string> = {
    'minimal': '极简线条', 'outline': '描边', 'solid': '实心填充',
    'rounded-outline': '圆角描边', 'duotone': '双色调', 'mixed': '混合风格',
    'none': '无图标',
  }
  return m[v] || v
}

function translateDensity(v: string): string {
  const m: Record<string, string> = {
    'sparse': '稀疏', 'comfortable': '适中', 'dense': '紧凑',
  }
  return m[v] || v
}

function translateColorTemp(v: string): string {
  const m: Record<string, string> = {
    'warm': '暖色调', 'cool': '冷色调', 'neutral': '中性',
  }
  return m[v] || v
}

function translateImageStyle(v: string): string {
  const m: Record<string, string> = {
    'photography': '摄影图片', 'illustration': '插图',
    'product-screenshots': '产品截图', 'abstract': '抽象图形',
    'mixed': '混合', 'none': '无图片',
  }
  return m[v] || v
}

function inferRadius(d: string): string {
  const s = (d || '').toLowerCase()
  if (s.includes('sharp') || s.includes('0px')) return '0px'
  if (s.includes('full') || s.includes('pill')) return '9999px'
  if (s.includes('large') || s.includes('xl')) return '16px'
  if (s.includes('medium')) return '8px'
  if (s.includes('small')) return '4px'
  return '6px'
}

/** Extract a color value (rgb/rgba/hex) from a CSS value string, for swatch rendering */
function extractColorFromCssValue(v: string): string | null {
  const m = v.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b/)
  return m ? m[0] : null
}

/** Filter out useless AI non-answers like "None observed in provided data." */
function isUsefulAiValue(v: string): boolean {
  if (!v) return false
  const lower = v.toLowerCase()
  return !(
    lower.startsWith('none observed') ||
    lower.startsWith('not observed') ||
    lower.startsWith('not detected') ||
    lower.startsWith('no data') ||
    lower.startsWith('no information') ||
    lower.startsWith('unable to') ||
    lower.startsWith('cannot determine') ||
    lower.includes('provided data') ||
    lower === 'none' ||
    lower === 'n/a' ||
    lower === 'unknown'
  )
}

function isLight(hex: string): boolean {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

/**
 * Guard against saturated action/accent colors being used as preview backgrounds.
 * If the hex has HSL saturation > 0.25, it's a chromatic color (e.g. Linear's #5E6AD2),
 * not a neutral page background — fall back to a safe neutral based on colorMode.
 */
function safePreviewBg(hex: string, colorMode: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  if (s > 0.25) {
    return colorMode === 'dark' ? '#1C1C1E' : '#F5F5F7'
  }
  return hex
}

/**
 * Return contrast-safe surface + text colors for component previews.
 * Fixes cases where dark-mode sites have surfaceHex incorrectly assigned as white,
 * or where both extracted colors are the same luminance (invisible text).
 */
function safeComponentColors(
  surface: string,
  text: string,
  colorMode: string
): { surface: string; text: string } {
  const surfaceLight = isLight(surface)
  const textLight = isLight(text)

  // Dark site but both extracted colors are light → surface is wrong, use dark surface
  if (colorMode === 'dark' && surfaceLight && textLight) {
    return { surface: '#2C2C2E', text }
  }
  // Light site but both are dark → text is probably wrong
  if (colorMode === 'light' && !surfaceLight && !textLight) {
    return { surface, text: '#1D1D1F' }
  }
  // Same luminance bucket → flip text
  if (surfaceLight === textLight) {
    return { surface, text: surfaceLight ? '#1D1D1F' : '#FFFFFF' }
  }
  return { surface, text }
}

/**
 * Validate that snap.text is actually a usable button label, not error text or garbage.
 */
function isValidButtonText(text: string | undefined): text is string {
  if (!text) return false
  const t = text.trim()
  if (t.length === 0 || t.length > 60) return false
  const lower = t.toLowerCase()
  if (
    lower.includes('错误') || lower.includes('error') || lower.includes('failed') ||
    lower.includes('undefined') || lower.includes('null') ||
    lower.startsWith('http') || lower.includes('@') ||
    lower.includes('exception') || lower.includes('warning')
  ) return false
  return true
}
