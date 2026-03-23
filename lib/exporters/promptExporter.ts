import type { StyleReport } from '@/lib/types'

export function generatePrompt(report: StyleReport, language: 'en' | 'zh' = 'en'): string {
  const { colors, colorSystem, typography, designDetails, gradients } = report

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

  const hex   = (c: typeof bg)    => c ? c.hex.toUpperCase() : null
  const named = (c: typeof bg)    => c ? `${c.hex.toUpperCase()} /* ${c.name} */` : null

  const radius   = designDetails.cssRadius || inferRadius(designDetails.borderRadius)
  const shadow   = designDetails.cssShadow || inferShadow(designDetails.shadowStyle)
  const duration = inferDuration(designDetails.animationTendency)
  const easing   = inferEasing(designDetails.animationTendency)

  const isDark       = designDetails.colorMode === 'dark'
  const isFlat       = isMinimalShadow(designDetails.shadowStyle)
  const isSharp      = isSharpRadius(designDetails.borderRadius)
  const isSubtle     = isSubtleMotion(designDetails.animationTendency)
  const hasGradients = gradients.length > 0

  const hoverHint  = isDark ? 'lighten by 8–10%, no hue shift' : 'darken by 8–10%, no hue shift'
  const btnTextHex = isDark ? (hex(bg) || '#000000') : (hex(bg) || '#ffffff')

  if (language === 'en') {
    return `You are implementing a UI. Treat the following as a binding design contract. Do not deviate from any specified value. Every unspecified decision must default to the most conservative/minimal option.

━━━ DESIGN CONTRACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: ${report.sourceLabel}
Color Mode: ${designDetails.colorMode.toUpperCase()}
Style DNA: ${report.summaryEn || report.summary}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. COLOR CONTRACT

### Palette (use only these colors)
${bg        ? `Background (page base):       ${named(bg)}` : ''}
${surface   ? `Surface (cards, panels):       ${named(surface)}` : ''}
${primary   ? `Primary (CTAs, links, active): ${named(primary)}` : ''}
${secondary ? `Secondary (muted actions):     ${named(secondary)}` : ''}
${accents.length ? `Accent(s) (highlights):        ${accents.map(c => `${c.hex.toUpperCase()} /* ${c.name} */`).join(', ')}` : ''}
${textMain  ? `Text (body, headings):         ${named(textMain)}` : ''}
${border    ? `Border (dividers, outlines):   ${named(border)}` : ''}

### Color Application Rules
- Page background: always ${hex(bg) || 'var(--color-bg)'}
- Card / panel background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
- Primary CTA button background: ${hex(primary) || 'var(--color-primary)'}
- Primary CTA button text: ${btnTextHex}
- Secondary / ghost button: transparent bg, ${hex(border) || 'var(--color-border)'} border, ${hex(primary) || 'var(--color-primary)'} text
- All body text: ${hex(textMain) || 'var(--color-text)'}
- Muted / caption text: ${textMain ? textMain.hex + 'aa' : 'text color at 60% opacity'}
- Dividers and input borders: ${hex(border) || 'var(--color-border)'}
- Hover state: ${hoverHint}${hasGradients ? `

### Gradients (use only these — do not invent others)
${gradients.map((g, i) => `Gradient ${i + 1}: ${g.css}  /* ${g.description} */`).join('\n')}` : ''}

## 2. TYPOGRAPHY CONTRACT

Font Family: ${typography.fontFamily}${typography.googleFontsAlt ? ` (fallback: ${typography.googleFontsAlt})` : ''}
${typography.confidence === 'inferred' ? '(Font was inferred — use exact match or closest system alternative)\n' : ''}Heading Weight:  ${typography.headingWeight}
Body Weight:     ${typography.bodyWeight}
Line Height:     ${typography.lineHeight}
Letter Spacing:  ${typography.letterSpacing}
Text Alignment:  ${typography.alignment}

### Type Hierarchy
- h1: font-weight ${typography.headingWeight}, letter-spacing ${typography.letterSpacing}
- h2–h3: font-weight ${typography.headingWeight}, reduced size
- Body: font-weight ${typography.bodyWeight}, line-height ${typography.lineHeight}
- Captions: font-weight ${typography.bodyWeight}, reduced opacity — do NOT use a lighter weight

## 3. GEOMETRY CONTRACT

Border Radius: ${radius}  ← apply to ALL interactive elements
Box Shadow:    ${shadow}
Border Style:  ${designDetails.borderStyle}
Spacing:       ${designDetails.spacingSystem}
Layout:        ${designDetails.layoutStructure}

## 4. MOTION CONTRACT

Transition: ${duration} ${easing}
Apply to: opacity, background-color, border-color, box-shadow, transform
Do NOT animate: width, height, max-height (unless accordion)

## 5. COMPONENT BASELINE SPECS

### Button (Primary)
background: ${hex(primary) || 'var(--color-primary)'}
color: ${btnTextHex}
border: none
border-radius: ${radius}
padding: [match source visually — not extracted]
font-weight: ${typography.headingWeight}
transition: background ${duration} ${easing}
hover: ${hoverHint} on background

### Button (Secondary / Ghost)
background: transparent
color: ${hex(primary) || 'var(--color-primary)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
padding: [match source visually — not extracted]

### Card / Panel
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
box-shadow: ${shadow}
padding: [match source visually — not extracted]

### Input / Form Field
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
color: ${hex(textMain) || 'var(--color-text)'}
focus: 2px solid ${hex(primary) || 'var(--color-primary)'}, offset 0
placeholder: ${textMain ? textMain.hex + '66' : 'text color at 40% opacity'}

## 6. PROHIBITIONS — NON-NEGOTIABLE

✗ DO NOT use any color outside Section 1 palette
✗ DO NOT use font-weight outside ${typography.bodyWeight}–${typography.headingWeight}
✗ DO NOT invent shadows — use only: ${shadow}
✗ DO NOT use border-radius other than: ${radius}${!hasGradients ? '\n✗ DO NOT use gradients — this design uses flat fills only' : ''}
${isFlat   ? '✗ DO NOT add drop shadows — this design is flat\n' : ''}${isSharp  ? '✗ DO NOT add rounded corners — this design uses sharp edges\n' : ''}${isSubtle ? '✗ DO NOT use bounce/spring easing — use ease-out or linear only\n' : ''}${!isDark  ? '✗ DO NOT use dark backgrounds on main content areas\n' : ''}✗ DO NOT use blue-tinted shadows (e.g. rgba(59,130,246,x)) — neutral or brand color only
✗ DO NOT add decorative shapes, blobs, noise textures, or geometric backgrounds
✗ DO NOT add glassmorphism / backdrop-filter blur
✗ DO NOT shift hue on hover — change lightness/opacity only
✗ DO NOT use system emoji or mixed icon libraries
✗ DO NOT add spacing inconsistent with: ${designDetails.spacingSystem}`
  }

  // ─── Chinese ─────────────────────────────────────────────────────────────────

  return `你正在实现一个 UI 界面。以下是一份绑定性设计契约，不得偏离任何指定的值。所有未指定的决策，必须默认选择最保守/最简约的方案。

━━━ 设计契约 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
来源: ${report.sourceLabel}
颜色模式: ${designDetails.colorMode === 'dark' ? '深色' : designDetails.colorMode === 'light' ? '浅色' : '系统'}
风格基因: ${report.summaryZh || report.summary}
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
- 页面背景：始终使用 ${hex(bg) || 'var(--color-bg)'}
- 卡片/面板背景：${hex(surface) || hex(bg) || 'var(--color-surface)'}
- 主要 CTA 按钮背景：${hex(primary) || 'var(--color-primary)'}
- 主要 CTA 按钮文字：${btnTextHex}
- 次要/幽灵按钮：透明背景，${hex(border) || 'var(--color-border)'} 描边，${hex(primary) || 'var(--color-primary)'} 文字
- 所有正文文字：${hex(textMain) || 'var(--color-text)'}
- 辅助/说明文字：${textMain ? textMain.hex + 'aa' : '文字色 60% 不透明度'}
- 分割线和输入框描边：${hex(border) || 'var(--color-border)'}
- 悬停状态：${isDark ? '亮度提升 8–10%，色相不变' : '亮度降低 8–10%，色相不变'}${hasGradients ? `

### 渐变（只能使用以下渐变，不得自行创造）
${gradients.map((g, i) => `渐变 ${i + 1}: ${g.css}  /* ${g.description} */`).join('\n')}` : ''}

## 2. 字体契约

字体族: ${typography.fontFamily}${typography.googleFontsAlt ? `（替代：${typography.googleFontsAlt}）` : ''}
${typography.confidence === 'inferred' ? '（字体为推断结果，请使用精确匹配或最接近的系统字体）\n' : ''}标题字重:  ${typography.headingWeight}
正文字重:  ${typography.bodyWeight}
行高:      ${typography.lineHeight}
字间距:    ${typography.letterSpacing}
对齐:      ${typography.alignment}

### 字体层级
- h1：字重 ${typography.headingWeight}，字间距 ${typography.letterSpacing}
- h2–h3：字重 ${typography.headingWeight}，字号适当缩小
- 正文：字重 ${typography.bodyWeight}，行高 ${typography.lineHeight}
- 标签/说明：字重 ${typography.bodyWeight}，降低透明度——禁止用更细字重

## 3. 几何契约

圆角:      ${radius}  ← 适用于所有交互元素
阴影:      ${shadow}
边框样式:  ${designDetails.borderStyle}
间距体系:  ${designDetails.spacingSystem}
布局结构:  ${designDetails.layoutStructure}

## 4. 动效契约

过渡: ${duration} ${easing}
适用属性: opacity、background-color、border-color、box-shadow、transform
禁止动画: width、height、max-height（除手风琴场景外）

## 5. 组件基准规范

### 主要按钮
background: ${hex(primary) || 'var(--color-primary)'}
color: ${btnTextHex}
border: none
border-radius: ${radius}
padding: [对照原设计视觉匹配，未提取]
font-weight: ${typography.headingWeight}
transition: background ${duration} ${easing}
hover: 背景${isDark ? '亮度提升 8–10%' : '亮度降低 8–10%'}，色相不变

### 次要按钮 / Ghost
background: transparent
color: ${hex(primary) || 'var(--color-primary)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
padding: [对照原设计视觉匹配，未提取]

### 卡片 / 面板
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
box-shadow: ${shadow}
padding: [对照原设计视觉匹配，未提取]

### 输入框 / 表单
background: ${hex(surface) || hex(bg) || 'var(--color-surface)'}
border: 1px solid ${hex(border) || 'var(--color-border)'}
border-radius: ${radius}
color: ${hex(textMain) || 'var(--color-text)'}
焦点: 2px solid ${hex(primary) || 'var(--color-primary)'}，offset 0
placeholder: ${textMain ? textMain.hex + '66' : '文字色 40% 不透明度'}

## 6. 禁止事项 — 不得违反

✗ 禁止使用色板以外的任何颜色
✗ 禁止使用 ${typography.bodyWeight}–${typography.headingWeight} 范围外的字重
✗ 禁止自创阴影——只允许：${shadow}
✗ 禁止使用除 ${radius} 以外的圆角值${!hasGradients ? '\n✗ 禁止渐变——此设计只使用纯色填充' : ''}
${isFlat   ? '✗ 禁止投影——此设计为扁平风格\n' : ''}${isSharp  ? '✗ 禁止圆角——此设计使用直角\n' : ''}${isSubtle ? '✗ 禁止弹性/回弹动画——只允许 ease-out 或线性\n' : ''}${!isDark  ? '✗ 禁止在正文区域使用深色背景\n' : ''}✗ 禁止蓝色调阴影（如 rgba(59,130,246,x)）——只用中性色或品牌色
✗ 禁止装饰性几何形状、色块、噪点纹理或几何背景
✗ 禁止磨砂玻璃效果（backdrop-filter blur）
✗ 禁止悬停时改变色相——只允许改变亮度/透明度
✗ 禁止混用图标库或使用系统表情符号
✗ 禁止添加与以下间距体系不符的间距：${designDetails.spacingSystem}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inferRadius(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('sharp') || s.includes('none') || s.includes('0px')) return '0px'
  if (s.includes('full') || s.includes('pill')) return '9999px'
  if (s.includes('large') || s.includes('xl')) return '16px'
  if (s.includes('medium') || s.includes('moderate')) return '8px'
  if (s.includes('small') || s.includes('subtle')) return '4px'
  return '6px'
}
function inferShadow(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('none') || s.includes('flat') || s.includes('no shadow')) return 'none'
  if (s.includes('heavy') || s.includes('strong')) return '0 20px 60px rgba(0,0,0,0.25)'
  if (s.includes('medium') || s.includes('moderate')) return '0 4px 16px rgba(0,0,0,0.12)'
  return '0 1px 4px rgba(0,0,0,0.08)'
}
function inferDuration(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('fast') || s.includes('instant')) return '120ms'
  if (s.includes('slow') || s.includes('deliberate')) return '350ms'
  return '200ms'
}
function inferEasing(d: string): string {
  const s = d.toLowerCase()
  if (s.includes('bouncy') || s.includes('spring')) return 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  if (s.includes('linear')) return 'linear'
  return 'ease-out'
}
function isMinimalShadow(d: string): boolean {
  const s = d.toLowerCase()
  return s.includes('none') || s.includes('flat') || s.includes('no shadow') || s.includes('minimal')
}
function isSharpRadius(d: string): boolean {
  const s = d.toLowerCase()
  return s.includes('sharp') || s.includes('0px') || s.includes('no radius')
}
function isSubtleMotion(d: string): boolean {
  const s = d.toLowerCase()
  return s.includes('subtle') || s.includes('minimal') || s.includes('none')
}
