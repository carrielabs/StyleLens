import type { StyleReport } from '@/lib/types'

export function generatePrompt(report: StyleReport, language: 'en' | 'zh' = 'en'): string {
  const { colors, typography, designDetails } = report

  // Filter colors by role
  const bgColors = colors.filter(c => c.role === 'background' || c.role === 'surface')
  const primaryColors = colors.filter(c => c.role === 'primary')
  const borderColors = colors.filter(c => c.role === 'border')

  const getHexList = (list: typeof colors) => list.map(c => c.hex.toUpperCase()).join(', ') || 'None'

  if (language === 'en') {
    return `# Role
Expert UI/UX Designer & Frontend Engineer

# Task
Replicate the exact design system defined below to build a high-fidelity, premium user interface. Follow these design tokens strictly.

# Design Tokens

## 1. Color System (Mode: ${designDetails.colorMode})
- Backgrounds & Surfaces: ${getHexList(bgColors)}
- Primary Brand/Action: ${getHexList(primaryColors)}
- Borders & Lines: ${getHexList(borderColors)}

## 2. Typography
- Font Family: ${typography.fontFamily}
- Heading Weight: ${typography.headingWeight}
- Body Weight: ${typography.bodyWeight}
- Alignment: ${typography.alignment}
- Scaling: ${typography.fontSizeScale}

## 3. Spatial & Structural
- Layout Grid: ${designDetails.layoutStructure}
- Spacing System: ${designDetails.spacingSystem}
- Border Radius (Curvature): ${designDetails.borderRadius}

## 4. Depth & Motion
- Shadows / Elevation: ${designDetails.shadowStyle}
- Micro-interactions: ${designDetails.animationTendency}

# Context Summary
${report.summaryEn || report.summary}`
  }

  return `# 角色设定
高级 UI/UX 设计师与前端工程师

# 任务目标
请严格遵循以下提取出的设计系统 Token，构建一个高保真、具备顶级质感的用户界面。

# 设计系统 Token

## 1. 色彩规范 (模式: ${designDetails.colorMode})
- 背景与面板层: ${getHexList(bgColors)}
- 主品牌色/核心动作: ${getHexList(primaryColors)}
- 边框与分割线: ${getHexList(borderColors)}

## 2. 字体排版
- 建议字体: ${typography.fontFamily}
- 标题字重: ${typography.headingWeight}
- 正文字重: ${typography.bodyWeight}
- 缩放比例: ${typography.fontSizeScale}

## 3. 空间与结构
- 布局结构: ${designDetails.layoutStructure}
- 留白与间距: ${designDetails.spacingSystem}
- 边框与圆角: ${designDetails.borderRadius}

## 4. 层级与动效
- 阴影与深度: ${designDetails.shadowStyle}
- 微交互与动效: ${designDetails.animationTendency}

# 风格描述参考
${report.summaryZh || report.summary}`
}
