import { DisplayStyleReport } from '../types'

// High-fidelity SVG logos for brands to avoid broken images in the UI
const LOGOS = {
  linear: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzVFNkFEMiIvPjxwYXRoIGQ9Ik0xOCAyNEwyOCAxNkwzOCAyNEwyOCAzMkwxOCAyNFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTI4IDMyTDM4IDI0TDQ4IDMyTDM4IDQwTDI4IDMyWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+`,
  stripe: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzYzNUJGRiIvPjxwYXRoIGQ9Ik0yMCAyOEMyMCAyNCAyNCAyMCAyOCAyMEg0MEM0NCAyMCA0OCAyNCA0OCAyOEM0OCAzMiA0NCAzNiA0MCAzNkgzNlYzOEg0MFYzMkg0NFYzNkM0NCA0MCA0MCA0NCAzNiA0NEgyOEMyNCA0NCAyMCA0MCAyMCAzNlYzMlYyOFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+`,
  vercel: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzAwMDAwMCIvPjxwYXRoIGQ9Ik0zMiAxNkw0OCA0NEgxNkwzMiAxNloiIGZpbGw9IndoaXRlIi8+PC9zdmc+`,
  apple: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzAwMDAwMCIvPjxwYXRoIGQ9Ik0zMiAzOEMzNy41MjI4IDM4IDQyIDMzLjUyMjggNDIgMjhDMzYuNDc3MiAyOCAzMiAzMi40NzcyIDMyIDM4Wm0wIDBDMjYuNDc3MiAzOCAyMiAzMy41MjI4IDIyIDI4QzI3LjUyMjggMjggMzIgMzIuNDc3MiAzMiAzOFoiIGZpbGw9IndoaXRlIi8+PC9zdmc+`,
  notion: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDYpIi8+PHBhdGggZD0iTTIwIDIwSDMwVjQwSDIwdjB6TTMwIDQwSDUwVjIwSDMwdjB6IiBmaWxsPSIjMzczNTJGIi8+PC9zdmc+`,
  framer: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNCIgZmlsbD0iIzAwNTVGRiIvPjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEwyMCAyMFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTIwIDIwTDIwIDQ0SDQ0TDIwIDIwWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+`
}

export const BRAND_PRESETS: Record<string, DisplayStyleReport> = {
  linear: {
    id: 'preset_linear',
    sourceType: 'url',
    sourceLabel: 'Linear',
    screenshotUrl: '/presets/linear_source.png',
    summaryZh: 'Linear 的高级感核心在于对“微小对比度”和“亚像素级精度”的病态追求。它通过 0.5px 的边框和 590 的非标准字重（Inter Variable）营造出一种超越常规组件库的精密感。',
    summaryEn: 'The core of Linear\'s premium feel lies in its pathological pursuit of "micro-contrast" and "sub-pixel precision." It uses 0.5px borders and non-standard 590 weights (Inter Variable) to create a sense of precision beyond regular UI kits.',
    summary: 'Pathological pursuit of micro-contrast and sub-pixel precision.',
    tags: ['Inter Variable', '0.5px Border', 'LCH Neutral', 'Precision UI'],
    tagsZh: ['Inter 变量字体', '0.5px 边框', 'LCH 中性色', '精密 UI'],
    colors: [
      { role: 'background', hex: '#08090a', rgb: '8, 9, 10', hsl: '210, 11%, 4%', name: 'Primary BG', description: 'Core application base' },
      { role: 'surface', hex: '#0f1011', rgb: '15, 16, 17', hsl: '210, 6%, 6%', name: 'Level 1 Surface', description: 'Sidebar & Panel background' },
      { role: 'primary', hex: '#5e6ad2', rgb: '94, 106, 210', hsl: '234, 58%, 60%', name: 'Linear Indigo', description: 'Active element accent' },
      { role: 'text', hex: '#f7f8f8', rgb: '247, 248, 248', hsl: '180, 2%, 97%', name: 'Heading Text', description: 'High contrast foreground' },
      { role: 'secondary', hex: '#d0d6e0', rgb: '208, 214, 224', hsl: '218, 19%, 85%', name: 'Body Text', description: 'Supportive content color' }
    ],
    gradients: [],
    typography: {
      fontFamily: '"Inter Variable", Inter, -apple-system, sans-serif',
      confidence: 'identified',
      headingWeight: 590,
      bodyWeight: 400,
      fontSizeScale: '1.25',
      lineHeight: '1.06',
      letterSpacing: '-0.022em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'High-Precision Dark Tech',
      colorMode: 'dark',
      borderRadius: '8px',
      shadowStyle: 'Subtle Layered Shadow',
      spacingSystem: '4px / 8px / 12px Grid',
      borderStyle: '0.5px solid rgba(255,255,255,0.08)',
      animationTendency: 'Elastic / Fast (Cubic Bezier)',
      imageHandling: 'Hard Edge + 1px Stroke',
      layoutStructure: 'Dense Sidebar + Multi-pane Workspace',
      cssRadius: '4px | 8px | 12px | 16px | 24px',
      cssShadow: '0 2px 4px rgba(0,0,0,0.1) | 0 4px 24px rgba(0,0,0,0.2) | 0 1px 1px 0px rgba(0,0,0,0.07), 0 0 1px 0px rgba(0,0,0,0.08)',
      motionZh: '150ms (迅速反馈) | 200ms (常用转场) | cubic-bezier(0.4, 0, 0.2, 1) | 弹性惯性动效',
      spacingZh: '4px (基准步进) | 8px (标准间距) | 12px (紧凑布局) | 24px (页面内边距) | 32px (模块间距)',
      layoutZh: 'Sidebar (高密度侧边栏) | Header Navigation (全局导航) | Pane Workspace (多面板工作区) | Modal Dialog (非模态弹窗)'
    },
    createdAt: new Date().toISOString()
  }
}
