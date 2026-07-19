import type { ColorToken, StyleReport } from '@/lib/types'

export function generatePrompt(report: StyleReport, language: 'en' | 'zh' = 'en'): string {
  const { colors, colorSystem, typography, designDetails, gradients } = report
  const analysis = report.pageAnalysis

  // Prefer colorSystem (Codex's precise extraction) with fallback to colors array
  const bg       = colorSystem?.pageBackground   || colorSystem?.heroBackground || colors.find(c => c.role === 'background')
  const surface  = colorSystem?.surface          || colors.find(c => c.role === 'surface')
  const primary  = colorSystem?.primaryAction    || colors.find(c => c.role === 'primary')
  const secondary = colorSystem?.secondaryAction || colors.find(c => c.role === 'secondary')
  const textMain = colorSystem?.textPrimary      || colors.find(c => c.role === 'text')
  const border   = colorSystem?.border           || colors.find(c => c.role === 'border')
  const accents  = colorSystem?.contentColors?.length
    ? colorSystem.contentColors
    : colors.filter(c => c.role === 'accent')

  const hex   = (c: ColorToken | undefined) => c ? c.hex.toUpperCase() : null
  const named = (c: ColorToken | undefined) => c ? `${c.hex.toUpperCase()} /* ${c.name} */` : null

  const radius   = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const shadow   = designDetails.cssShadow || inferShadow(designDetails.shadowStyle)
  const duration = inferDuration(designDetails.animationTendency)
  const easing   = inferEasing(designDetails.animationTendency)
  const button = analysis?.buttonSnapshot || analysis?.buttonSnapshots?.[0]
  const input = analysis?.inputSnapshots?.[0]
  const card = analysis?.cardSnapshots?.[0]
  const buttonPadding = pairPadding(button?.paddingV, button?.paddingH) || firstSpacing(analysis, '12px 16px')
  const inputPadding = pairPadding(input?.paddingV, input?.paddingH) || firstSpacing(analysis, '8px 12px')
  const cardPadding = card?.padding || firstSpacing(analysis, '16px')
  const evidenceBasis = buildEvidenceBasis(report, language)
  const tasteDna = buildTasteDna(report, language)

  const isDark       = designDetails.colorMode === 'dark'
  const isFlat       = isMinimalShadow(designDetails.shadowStyle)
  const isSharp      = isSharpRadius(designDetails.borderRadius)
  const isSubtle     = isSubtleMotion(designDetails.animationTendency)
  const hasGradients = gradients.length > 0

  const hoverHint = isDark
    ? 'lighten the background by 8–10%, no hue shift'
    : 'darken the background by 8–10%, no hue shift'

  const btnTextColor = isDark
    ? (bg ? hex(bg) : '#000000')
    : (bg ? hex(bg) : '#ffffff')

  if (language === 'en') {
    return `You are implementing a UI. Treat the following as a binding design contract. Do not deviate from any specified value. Every unspecified decision must default to the most conservative/minimal option.

━━━ DESIGN CONTRACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: ${report.sourceLabel}
Color Mode: ${designDetails.colorMode.toUpperCase()}
Style DNA: ${report.summaryEn || report.summary}
Taste DNA: ${tasteDna}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. COLOR CONTRACT

### Palette (use only these colors)
${bg        ? `Background (page base):       ${named(bg)}` : ''}
${surface   ? `Surface (cards, panels):      ${named(surface)}` : ''}
${primary   ? `Primary (CTAs, links, active): ${named(primary)}` : ''}
${secondary ? `Secondary (muted actions):    ${named(secondary)}` : ''}
${accents.length ? `Accent(s) (highlights):       ${accents.map(c => `${c.hex.toUpperCase()} /* ${c.name} */`).join(', ')}` : ''}
${textMain  ? `Text (body, headings):        ${named(textMain)}` : ''}
${border    ? `Border (dividers, outlines):  ${named(border)}` : ''}

### Color Application Rules
- Page background: always ${hex(bg) || 'var(--color-bg-base)'}
- Card / panel background: always ${hex(surface) || hex(bg) || 'var(--color-bg-surface)'}
- Primary CTA button background: ${hex(primary) || 'var(--color-primary)'}
- Primary CTA button text: ${btnTextColor}
- Secondary / ghost button: transparent background, ${hex(border) || 'var(--color-border)'} border, ${hex(primary) || 'var(--color-primary)'} text
- All body text: ${hex(textMain) || 'var(--color-text)'}
- Muted / caption text: ${textMain ? textMain.hex + 'aa' : 'var(--color-text) at 60% opacity'}
- Dividers and input borders: ${hex(border) || 'var(--color-border)'}
- Hover state color shift: ${hoverHint}${hasGradients ? `

### Gradients (use only these, do not invent others)
${gradients.map((g, i) => `Gradient ${i + 1}: ${g.css}  /* ${g.description} */`).join('\n')}` : ''}

## 2. TYPOGRAPHY CONTRACT

Font Family: ${typography.fontFamily}${typography.googleFontsAlt ? ` — if unavailable, use: ${typography.googleFontsAlt}` : ''}
${typography.confidence === 'inferred' ? '(Font was inferred from visual — use exact match or closest system alternative)\n' : ''}
Heading Weight:  ${typography.headingWeight}
Body Weight:     ${typography.bodyWeight}
Line Height:     ${typography.lineHeight}
Letter Spacing:  ${typography.letterSpacing}
Text Alignment:  ${typography.alignment}
Text Treatment:  ${typography.textTreatment}

### Type Hierarchy Application
- h1: font-weight ${typography.headingWeight}, letter-spacing ${typography.letterSpacing}
- h2–h3: font-weight ${typography.headingWeight}, slightly reduced size
- Body / paragraph: font-weight ${typography.bodyWeight}, line-height ${typography.lineHeight}
- Labels / captions: font-weight ${typography.bodyWeight}, reduced opacity — do NOT use a lighter weight font

## 3. GEOMETRY CONTRACT

Border Radius:   ${radius}  ← apply to ALL interactive elements (buttons, cards, inputs, modals)
Box Shadow:      ${shadow}
Border Style:    ${designDetails.borderStyle}
Spacing System:  ${designDetails.spacingSystem}
Layout:          ${designDetails.layoutStructure}

## 4. MOTION CONTRACT

Transition:      ${duration} ${easing}
Apply to:        opacity, background-color, border-color, box-shadow, transform
Do NOT animate:  width, height, max-height (unless explicitly needed for accordion/expand)

## 5. COMPONENT BASELINE SPECS

### Button (Primary)
background: ${hex(primary) || 'var(--color-primary)'}
color: ${btnTextColor}
border: none
border-radius: ${radius}
padding: ${buttonPadding}
font-weight: ${typography.headingWeight}
transition: background ${duration} ${easing}
hover: ${hoverHint} on background

### Button (Secondary / Ghost Button)
background: transparent
color: ${hex(primary) || 'var(--color-primary)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
padding: ${buttonPadding}

### Card / Panel (Card / Panel)
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
box-shadow: ${shadow}
padding: ${cardPadding}

### Input / Form Field (Input / Form Field)
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
color: ${hex(textMain) || 'var(--color-text)'}
padding: ${inputPadding}
focus outline: 2px solid ${hex(primary) || 'var(--color-primary)'}, offset 0
placeholder color: ${textMain ? textMain.hex + '66' : 'var(--color-text) at 40% opacity'}

## 6. Evidence Basis

${evidenceBasis}

## 7. PROHIBITIONS — NON-NEGOTIABLE

✗ DO NOT use any color outside the palette defined in Section 1
✗ DO NOT use font-weight values outside ${typography.bodyWeight}–${typography.headingWeight}
✗ DO NOT invent shadows — use only: ${shadow}
✗ DO NOT use border-radius values other than: ${radius}${!hasGradients ? '\n✗ DO NOT use gradients — this design uses flat fills only' : ''}
${isFlat  ? '✗ DO NOT add drop shadows or elevation layers — this design is flat\n' : ''}${isSharp ? '✗ DO NOT add rounded corners — this design uses sharp right angles\n' : ''}${isSubtle ? '✗ DO NOT use bounce, spring, or elastic easing — use ease-out or linear only\n' : ''}${!isDark  ? '✗ DO NOT use dark backgrounds on main content areas — this is a light-mode design\n' : ''}✗ DO NOT use blue-tinted shadows (e.g. rgba(59,130,246,0.x)) — shadows must use neutral or brand color
✗ DO NOT add decorative shapes, abstract blobs, noise textures, or geometric backgrounds unless shown in source
✗ DO NOT add glassmorphism / backdrop-filter blur effects
✗ DO NOT shift hue on hover — only change lightness/opacity
✗ DO NOT use system emoji or icon fonts — use a consistent icon library or none at all
✗ DO NOT add padding or margin that would create spacing inconsistent with: ${designDetails.spacingSystem}`
  }

  // ─── Chinese version ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return `你正在实现一个 UI 界面。以下是一份绑定性设计契约，不得偏离任何指定的值。所有未指定的决策，必须默认选择最保守/最简约的方案。

━━━ 设计契约 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
来源: ${report.sourceLabel}
颜色模式: ${designDetails.colorMode === 'dark' ? '深色' : designDetails.colorMode === 'light' ? '浅色' : '系统'}
风格基因: ${report.summaryZh || report.summary}
Taste DNA: ${tasteDna}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. 色彩契约

### 色板（只能使用以下颜色）
${bg        ? `背景色（页面底层）:           ${named(bg)}` : ''}
${surface   ? `面板色（卡片、容器）:         ${named(surface)}` : ''}
${primary   ? `主色（CTA、链接、激活态）:    ${named(primary)}` : ''}
${secondary ? `辅助色（次要操作）:           ${named(secondary)}` : ''}
${accents.length ? `强调色（高亮、内容色）:       ${accents.map(c => `${c.hex.toUpperCase()} /* ${c.name} */`).join(', ')}` : ''}
${textMain  ? `文字色（正文、标题）:         ${named(textMain)}` : ''}
${border    ? `边框色（分割线、描边）:       ${named(border)}` : ''}

### 颜色使用规则
- 页面背景：始终使用 ${hex(bg) || 'var(--color-bg-base)'}
- 卡片/面板背景：始终使用 ${hex(surface) || hex(bg) || 'var(--color-bg-surface)'}
- 主要 CTA 按钮背景：${hex(primary) || 'var(--color-primary)'}
- 主要 CTA 按钮文字：${btnTextColor}
- 次要/幽灵按钮：透明背景，${hex(border) || 'var(--color-border)'} 描边，${hex(primary) || 'var(--color-primary)'} 文字
- 所有正文文字：${hex(textMain) || 'var(--color-text)'}
- 辅助/说明文字：${textMain ? textMain.hex + 'aa' : 'var(--color-text) 60% 不透明度'}
- 分割线和输入框描边：${hex(border) || 'var(--color-border)'}
- 悬停状态色彩变化：${isDark ? '亮度提升 8–10%，色相不变' : '亮度降低 8–10%，色相不变'}${hasGradients ? `

### 渐变（只能使用以下渐变，不得自行创造）
${gradients.map((g, i) => `渐变 ${i + 1}: ${g.css}  /* ${g.description} */`).join('\n')}` : ''}

## 2. 字体契约

字体族: ${typography.fontFamily}${typography.googleFontsAlt ? `（不可用时替换为：${typography.googleFontsAlt}）` : ''}
${typography.confidence === 'inferred' ? '（字体为推断结果——请使用精确匹配或最接近的系统字体备选）\n' : ''}
标题字重:  ${typography.headingWeight}
正文字重:  ${typography.bodyWeight}
行高:      ${typography.lineHeight}
字间距:    ${typography.letterSpacing}
文本对齐:  ${typography.alignment}
文本处理:  ${typography.textTreatment}

### 字体层级应用规范
- h1：字重 ${typography.headingWeight}，字间距 ${typography.letterSpacing}
- h2–h3：字重 ${typography.headingWeight}，字号适当缩小
- 正文/段落：字重 ${typography.bodyWeight}，行高 ${typography.lineHeight}
- 标签/说明：字重 ${typography.bodyWeight}，降低透明度——禁止使用更细的字重

## 3. 几何契约

圆角:      ${radius}  ← 适用于所有交互元素（按钮、卡片、输入框、弹窗）
阴影:      ${shadow}
边框样式:  ${designDetails.borderStyle}
间距体系:  ${designDetails.spacingSystem}
布局结构:  ${designDetails.layoutStructure}

## 4. 动效契约

过渡时长与缓动: ${duration} ${easing}
适用属性: opacity、background-color、border-color、box-shadow、transform
禁止动画: width、height、max-height（除非手风琴/展开场景明确需要）

## 5. 组件基准规范

### 主要按钮（Primary Button）
background: ${hex(primary) || 'var(--color-primary)'}
color: ${btnTextColor}
border: none
border-radius: ${radius}
padding: ${buttonPadding}
font-weight: ${typography.headingWeight}
transition: background ${duration} ${easing}
hover: 背景${isDark ? '亮度提升 8–10%' : '亮度降低 8–10%'}，色相不变

### 次要按钮（Secondary / Ghost Button）
background: transparent
color: ${hex(primary) || 'var(--color-primary)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
padding: ${buttonPadding}

### 卡片/面板（Card / Panel）
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
box-shadow: ${shadow}
padding: ${cardPadding}

### 输入框/表单（Input / Form Field）
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
color: ${hex(textMain) || 'var(--color-text)'}
padding: ${inputPadding}
焦点样式: 2px solid ${hex(primary) || 'var(--color-primary)'}，offset 0
placeholder: ${textMain ? textMain.hex + '66' : 'var(--color-text) 40% 不透明度'}

## 6. 证据依据

${evidenceBasis}

## 7. 禁止事项 — 不得违反

✗ 禁止使用第 1 节色板以外的任何颜色
✗ 禁止使用 ${typography.bodyWeight}–${typography.headingWeight} 范围外的字重
✗ 禁止自创阴影——只允许使用：${shadow}
✗ 禁止使用除 ${radius} 以外的圆角值${!hasGradients ? '\n✗ 禁止使用渐变——此设计只使用纯色填充' : ''}
${isFlat  ? '✗ 禁止添加投影或层叠阴影——此设计为扁平风格\n' : ''}${isSharp ? '✗ 禁止圆角——此设计使用直角\n' : ''}${isSubtle ? '✗ 禁止弹性/回弹/spring 缓动——只允许 ease-out 或线性\n' : ''}${!isDark  ? '✗ 禁止在正文区域使用深色背景——这是浅色模式设计\n' : ''}✗ 禁止蓝色调阴影（如 rgba(59,130,246,0.x)）——阴影只能使用中性色或品牌色
✗ 禁止添加装饰性几何形状、抽象色块、噪点纹理或几何背景，除非原设计中有
✗ 禁止磨砂玻璃效果（backdrop-filter blur）
✗ 禁止悬停时改变色相——只允许改变亮度/透明度
✗ 禁止使用系统表情符号或图标字体——使用统一图标库或不用图标
✗ 禁止添加与以下间距体系不符的 padding/margin：${designDetails.spacingSystem}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferRadius(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('sharp') || d.includes('none') || d.includes('0px')) return '0px'
  if (d.includes('full') || d.includes('pill')) return '9999px'
  if (d.includes('large') || d.includes('xl') || d.includes('24')) return '16px'
  if (d.includes('medium') || d.includes('moderate')) return '8px'
  if (d.includes('small') || d.includes('subtle') || d.includes('4')) return '4px'
  return '6px'
}

function inferShadow(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('none') || d.includes('flat') || d.includes('no shadow')) return 'none'
  if (d.includes('heavy') || d.includes('strong') || d.includes('dramatic')) return '0 20px 60px rgba(0,0,0,0.25)'
  if (d.includes('medium') || d.includes('moderate')) return '0 4px 16px rgba(0,0,0,0.12)'
  return '0 1px 4px rgba(0,0,0,0.08)'
}

function inferDuration(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('instant') || d.includes('fast')) return '120ms'
  if (d.includes('slow') || d.includes('deliberate')) return '350ms'
  return '200ms'
}

function inferEasing(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('bouncy') || d.includes('spring')) return 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  if (d.includes('ease-in')) return 'ease-in'
  if (d.includes('linear')) return 'linear'
  return 'ease-out'
}

function pairPadding(vertical?: string, horizontal?: string): string | null {
  if (!vertical || !horizontal) return null
  if (vertical === horizontal) return vertical
  return `${vertical} ${horizontal}`
}

function firstSpacing(reportAnalysis: StyleReport['pageAnalysis'], fallback: string): string {
  return reportAnalysis?.spacingTokens?.[0]?.value || reportAnalysis?.spacingCandidates?.[0] || fallback
}

function buildEvidenceBasis(report: StyleReport, language: 'en' | 'zh'): string {
  const summary = report.pageAnalysis?.evidenceSummary
  const coverage = report.pageAnalysis?.coverageSummary
  const tokens = [
    report.pageAnalysis?.typographyTokens?.[0] ? 'typography' : null,
    report.pageAnalysis?.radiusTokens?.[0] ? 'radius' : null,
    report.pageAnalysis?.spacingTokens?.[0] ? 'spacing' : null,
    report.pageAnalysis?.buttonSnapshots?.[0] || report.pageAnalysis?.buttonSnapshot ? 'button' : null,
    report.pageAnalysis?.cardSnapshots?.[0] ? 'card' : null,
    report.pageAnalysis?.inputSnapshots?.[0] ? 'input' : null,
  ].filter(Boolean).join(', ') || 'color'

  if (language === 'zh') {
    return [
      `- 证据来源: dom-computed 为主，截图只作辅助。`,
      `- 整体可信度: ${summary?.overallConfidence || 'medium'}，证据数量: ${summary?.totalEvidenceCount ?? 'n/a'}。`,
      `- 已覆盖: ${coverage?.coveredAreas?.join(', ') || tokens}。`,
      `- 关键测量项: ${tokens}。`,
    ].join('\n')
  }

  return [
    `- Evidence source: dom-computed first; screenshots are supporting context only.`,
    `- Overall confidence: ${summary?.overallConfidence || 'medium'}; evidence count: ${summary?.totalEvidenceCount ?? 'n/a'}.`,
    `- Covered areas: ${coverage?.coveredAreas?.join(', ') || tokens}.`,
    `- Key measured signals: ${tokens}.`,
  ].join('\n')
}

function buildTasteDna(report: StyleReport, language: 'en' | 'zh'): string {
  const colorMode = report.designDetails.colorMode
  const radius = report.designDetails.cssRadius || report.designDetails.borderRadius
  const spacing = report.designDetails.spacingSystem

  if (language === 'zh') {
    return `${colorMode === 'dark' ? '深色高对比' : '浅色清晰'}、${radius} 圆角、${spacing} 间距共同形成风格识别点；复用时保留这些比例，不要用额外装饰替代。`
  }

  return `${colorMode === 'dark' ? 'Dark high-contrast' : 'Light clear'} surfaces, ${radius} radius, and ${spacing} spacing create the recognizable taste; preserve these ratios instead of adding decoration.`
}

function isMinimalShadow(description: string): boolean {
  const d = description.toLowerCase()
  return d.includes('none') || d.includes('flat') || d.includes('no shadow') || d.includes('minimal')
}

function isSharpRadius(description: string): boolean {
  const d = description.toLowerCase()
  const variants = d.split('|').map(item => item.trim()).filter(Boolean)
  if (variants.length > 1) {
    return variants.every(value => value === '0' || value === '0px' || value.includes('sharp') || value.includes('no radius'))
  }
  return d.includes('sharp') || d.includes('0px') || d.includes('no radius')
}

function isSubtleMotion(description: string): boolean {
  const d = description.toLowerCase()
  return d.includes('subtle') || d.includes('minimal') || d.includes('none')
}
