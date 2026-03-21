import type { StyleReport } from '@/lib/types'

export function generateMarkdown(report: StyleReport, lang: 'en' | 'zh' = 'zh'): string {
  const { colors, typography, designDetails, tags, tagsEn, tagsZh, summaryEn, summaryZh, summary } = report
  const isEn = lang === 'en'

  let md = isEn ? `## Style Analysis Report\n\n` : `## 风格分析报告\n\n`
  
  md += isEn 
    ? `**Overall Style**: ${summaryEn || summary}\n`
    : `**整体风格**: ${summaryZh || summary}\n`

  const activeTags = isEn ? (tagsEn || tags) : (tagsZh || tags)
  if (activeTags && activeTags.length > 0) {
    md += isEn 
      ? `**Tags**: ${activeTags.map(t => `\`${t}\``).join(' ')}\n`
      : `**风格标签**: ${activeTags.map(t => `\`${t}\``).join(' ')}\n`
  }
  
  md += isEn ? `\n### Color System\n` : `\n### 色彩系统\n`
  md += isEn 
    ? `| Role | Hex Code | Color Name |\n|------|----------|------------|\n`
    : `| 用途角色 | 颜色值 | 颜色名称 |\n|----------|--------|----------|\n`
  
  const roleMap: Record<string, string> = isEn ? {
    background: 'Background', surface: 'Surface', primary: 'Primary', 
    secondary: 'Secondary', accent: 'Accent', text: 'Text', 
    border: 'Border', other: 'Other'
  } : {
    background: '背景色', surface: '面板底色', primary: '主品牌色', 
    secondary: '辅助色', accent: '强调色', text: '文字色', 
    border: '边框色', other: '其他'
  }

  colors.forEach(c => {
    const roleLabel = roleMap[c.role] || c.role
    md += `| ${roleLabel} | \`${c.hex.toUpperCase()}\` | ${c.name} |\n`
  })

  md += isEn ? `\n### Typography\n` : `\n### 字体排版\n`
  md += isEn 
    ? `- **Font Family**: ${typography.fontFamily}\n- **Heading Weight**: ${typography.headingWeight} · **Body Weight**: ${typography.bodyWeight}\n- **Line Height**: ${typography.lineHeight} · **Letter Spacing**: ${typography.letterSpacing}\n- **Treatment**: ${typography.alignment} aligned, ${typography.textTreatment}\n`
    : `- **字体族**: ${typography.fontFamily}\n- **标题字重**: ${typography.headingWeight} · **正文字重**: ${typography.bodyWeight}\n- **行高**: ${typography.lineHeight} · **字间距**: ${typography.letterSpacing}\n- **文本特征**: ${typography.alignment}对齐, ${typography.textTreatment}\n`

  md += isEn ? `\n### Design Details\n` : `\n### 设计细节\n`
  md += isEn 
    ? `- **Border Radius**: ${designDetails.borderRadius}\n- **Shadows**: ${designDetails.shadowStyle}\n- **Borders**: ${designDetails.borderStyle}\n- **Spatial Layout**: ${designDetails.spacingSystem}. ${designDetails.layoutStructure}\n- **Motion**: ${designDetails.animationTendency}\n- **Images**: ${designDetails.imageHandling}\n`
    : `- **圆角特征**: ${designDetails.borderRadius}\n- **阴影处理**: ${designDetails.shadowStyle}\n- **边框样式**: ${designDetails.borderStyle}\n- **空间与布局**: ${designDetails.spacingSystem}. ${designDetails.layoutStructure}\n- **交互与动效**: ${designDetails.animationTendency}\n- **图像处理**: ${designDetails.imageHandling}\n`

  return md
}
