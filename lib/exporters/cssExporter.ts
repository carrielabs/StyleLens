import type { StyleReport } from '@/lib/types'

export function generateCssVariables(report: StyleReport): string {
  const { colors, typography, designDetails } = report

  // Filter colors by roles to generate meaningful semantic variables
  const bg = colors.find(c => c.role === 'background')?.hex || '#ffffff'
  const surface = colors.find(c => c.role === 'surface')?.hex || '#f5f5f5'
  const primary = colors.find(c => c.role === 'primary')?.hex || '#000000'
  const accent = colors.find(c => c.role === 'accent')?.hex || '#3b82f6'
  const textMain = colors.find(c => c.role === 'text')?.hex || '#1a1a1a'
  const border = colors.find(c => c.role === 'border')?.hex || '#e5e5e5'

  // Guess rounded corners based on the design details description
  let radius = '8px'
  if (designDetails.borderRadius.toLowerCase().includes('large') || designDetails.borderRadius.includes('16')) radius = '16px'
  if (designDetails.borderRadius.toLowerCase().includes('full') || designDetails.borderRadius.includes('pill')) radius = '9999px'
  if (designDetails.borderRadius.toLowerCase().includes('small') || designDetails.borderRadius.includes('4')) radius = '4px'
  if (designDetails.borderRadius.toLowerCase().includes('none') || designDetails.borderRadius.includes('sharp')) radius = '0px'

  // Guess animation
  let transition = 'all 0.2s ease'
  if (designDetails.animationTendency.toLowerCase().includes('slow')) transition = 'all 0.4s ease-in-out'
  if (designDetails.animationTendency.toLowerCase().includes('bouncy') || designDetails.animationTendency.toLowerCase().includes('spring')) transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  if (designDetails.animationTendency.toLowerCase().includes('fast')) transition = 'all 0.15s ease-out'

  let css = `:root {
  /* Colors */
  --color-bg-base: ${bg};
  --color-bg-surface: ${surface};
  --color-primary: ${primary};
  --color-accent: ${accent};
  --color-text-main: ${textMain};
  --color-border: ${border};

  /* Typography */
  --font-family: ${typography.fontFamily};
  --font-weight-heading: ${typography.headingWeight};
  --font-weight-body: ${typography.bodyWeight};
  --line-height-base: ${typography.lineHeight};
  --letter-spacing: ${typography.letterSpacing};

  /* Geometry & Animation */
  --radius-base: ${radius};
  --transition-base: ${transition};`

  if (report.gradients.length > 0) {
    css += `\n\n  /* Gradients */`
    report.gradients.forEach((g, i) => {
      css += `\n  --gradient-${i + 1}: ${g.css};`
    })
  }

  css += `\n}`

  return css
}
