import type { StyleReport } from '@/lib/types'

export function generateJsonToken(report: StyleReport): string {
  const { colors, typography, designDetails } = report

  // Map colors into a primitive design token structure
  const colorTokens: Record<string, any> = {
    bg: {},
    text: {},
    primary: {},
    secondary: {},
    accent: {},
    border: {},
    other: {}
  }

  colors.forEach((c, index) => {
    const roleGroup = colorTokens[c.role] || colorTokens.other
    // Try to use color name or default to numeric index
    const key = c.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `color${index + 1}`
    roleGroup[key] = { value: c.hex, type: 'color' }
  })

  // Clean empty role groups
  Object.keys(colorTokens).forEach(k => {
    if (Object.keys(colorTokens[k]).length === 0) delete colorTokens[k]
  })

  const token = {
    stylelens: {
      meta: {
        source: report.sourceLabel,
        style: designDetails.overallStyle,
        mode: designDetails.colorMode
      },
      color: colorTokens,
      typography: {
        fontFamily: { value: typography.fontFamily, type: 'fontFamilies' },
        headingWeight: { value: typography.headingWeight, type: 'fontWeights' },
        bodyWeight: { value: typography.bodyWeight, type: 'fontWeights' },
        lineHeight: { value: typography.lineHeight, type: 'lineHeights' },
        letterSpacing: { value: typography.letterSpacing, type: 'letterSpacing' }
      },
      effect: {
        shadow: { value: designDetails.shadowStyle, type: 'boxShadow' },
        border: { value: designDetails.borderStyle, type: 'border' }
      },
      size: {
        radius: { value: designDetails.borderRadius, type: 'borderRadius' },
        spacing: { value: designDetails.spacingSystem, type: 'spacing' }
      }
    }
  }

  return JSON.stringify(token, null, 2)
}
