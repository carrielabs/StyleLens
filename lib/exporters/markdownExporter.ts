import type { StyleReport } from '@/lib/types'

export function generateMarkdown(report: StyleReport, lang: 'en' | 'zh' = 'zh'): string {
  const { colors, colorSystem, typography, designDetails, gradients } = report
  const isEn = lang === 'en'

  const summary    = isEn ? (report.summaryEn || report.summary) : (report.summaryZh || report.summary)
  const activeTags = isEn ? (report.tagsEn || report.tags) : (report.tagsZh || report.tags)
  const radius     = designDetails.cssRadius || designDetails.borderRadius
  const shadow     = designDetails.cssShadow || designDetails.shadowStyle

  // Prefer colorSystem order (Codex's precise extraction) with fallback to colors array
  const displayColors = colorSystem
    ? [
        colorSystem.heroBackground,
        colorSystem.pageBackground,
        colorSystem.surface,
        colorSystem.textPrimary,
        colorSystem.textSecondary,
        colorSystem.border,
        colorSystem.primaryAction,
        colorSystem.secondaryAction,
        ...(colorSystem.contentColors || []),
      ].filter((c): c is NonNullable<typeof c> => Boolean(c))
    : colors

  let md = isEn ? `# Style Analysis Report\n\n` : `# 风格分析报告\n\n`

  md += isEn
    ? `**Source**: ${report.sourceLabel}  \n**Color Mode**: ${designDetails.colorMode}  \n**Overall**: ${summary}\n`
    : `**来源**: ${report.sourceLabel}  \n**颜色模式**: ${designDetails.colorMode === 'dark' ? '深色' : designDetails.colorMode === 'light' ? '浅色' : '系统'}  \n**整体风格**: ${summary}\n`

  if (activeTags && activeTags.length > 0) {
    md += '\n' + activeTags.map(t => `\`${t}\``).join(' ') + '\n'
  }

  // ── Color System ──────────────────────────────────────────────────────────
  md += isEn ? `\n## Color System\n\n` : `\n## 色彩系统\n\n`
  md += isEn
    ? `| Role | Hex | Name | Usage |\n|------|-----|------|-------|\n`
    : `| 角色 | 颜色值 | 名称 | 用途说明 |\n|------|--------|------|----------|\n`

  const roleMap: Record<string, string> = isEn ? {
    background: 'Background', surface: 'Surface', primary: 'Primary',
    secondary: 'Secondary', accent: 'Accent', text: 'Text',
    border: 'Border', other: 'Other'
  } : {
    background: '背景色', surface: '面板色', primary: '主色',
    secondary: '辅助色', accent: '强调色', text: '文字色',
    border: '边框色', other: '其他'
  }

  displayColors.forEach(c => {
    const role = roleMap[c.role] || c.role
    md += `| ${role} | \`${c.hex.toUpperCase()}\` | ${c.name} | ${c.description || '—'} |\n`
  })

  if (gradients.length > 0) {
    md += isEn ? `\n### Gradients\n` : `\n### 渐变\n`
    gradients.forEach((g, i) => {
      md += `- **${isEn ? `Gradient ${i + 1}` : `渐变 ${i + 1}`}**: \`${g.css}\` — ${g.description}\n`
    })
  }

  // ── Typography ────────────────────────────────────────────────────────────
  md += isEn ? `\n## Typography\n\n` : `\n## 字体排版\n\n`
  md += isEn ? `| Property | Value |\n|----------|-------|\n` : `| 属性 | 值 |\n|------|----|\n`

  if (isEn) {
    md += `| Font Family | ${typography.fontFamily} |\n`
    if (typography.googleFontsAlt) md += `| Google Fonts Alt | ${typography.googleFontsAlt} |\n`
    md += `| Confidence | ${typography.confidence} |\n`
    md += `| Heading Weight | ${typography.headingWeight} |\n`
    md += `| Body Weight | ${typography.bodyWeight} |\n`
    md += `| Line Height | ${typography.lineHeight} |\n`
    md += `| Letter Spacing | ${typography.letterSpacing} |\n`
    md += `| Size Scale | ${typography.fontSizeScale} |\n`
    md += `| Alignment | ${typography.alignment} |\n`
    md += `| Text Treatment | ${typography.textTreatment} |\n`
  } else {
    md += `| 字体族 | ${typography.fontFamily} |\n`
    if (typography.googleFontsAlt) md += `| Google Fonts 替代 | ${typography.googleFontsAlt} |\n`
    md += `| 识别置信度 | ${typography.confidence === 'identified' ? '已识别' : '推断'} |\n`
    md += `| 标题字重 | ${typography.headingWeight} |\n`
    md += `| 正文字重 | ${typography.bodyWeight} |\n`
    md += `| 行高 | ${typography.lineHeight} |\n`
    md += `| 字间距 | ${typography.letterSpacing} |\n`
    md += `| 字号比例 | ${typography.fontSizeScale} |\n`
    md += `| 对齐方式 | ${typography.alignment} |\n`
    md += `| 文本处理 | ${typography.textTreatment} |\n`
  }

  // ── Design Details ────────────────────────────────────────────────────────
  md += isEn ? `\n## Design Details\n\n` : `\n## 设计细节\n\n`
  md += isEn ? `| Property | Value |\n|----------|-------|\n` : `| 属性 | 值 |\n|------|----|\n`

  if (isEn) {
    md += `| Border Radius | ${radius} |\n`
    md += `| Box Shadow | ${shadow} |\n`
    md += `| Border Style | ${designDetails.borderStyle} |\n`
    md += `| Spacing System | ${designDetails.spacingSystem} |\n`
    md += `| Layout Structure | ${designDetails.layoutStructure} |\n`
    md += `| Animation | ${designDetails.animationTendency} |\n`
    md += `| Image Handling | ${designDetails.imageHandling} |\n`
    md += `| Overall Style | ${designDetails.overallStyle} |\n`
  } else {
    md += `| 圆角 | ${radius} |\n`
    md += `| 阴影 | ${shadow} |\n`
    md += `| 边框样式 | ${designDetails.borderStyle} |\n`
    md += `| 间距体系 | ${designDetails.spacingSystem} |\n`
    md += `| 布局结构 | ${designDetails.layoutStructure} |\n`
    md += `| 动效倾向 | ${designDetails.animationTendency} |\n`
    md += `| 图像处理 | ${designDetails.imageHandling} |\n`
    md += `| 整体风格 | ${designDetails.overallStyle} |\n`
  }

  return md
}
