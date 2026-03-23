import { DisplayStyleReport } from '../types'

export const BRAND_PRESETS: Record<string, DisplayStyleReport> = {
  linear: {
    id: 'preset_linear',
    sourceType: 'url',
    sourceLabel: 'Linear',
    summaryZh: 'Linear 的高级感源于其对暗色调下极小对比度的精准控制，以及 Inter 字体的 -0.02em 紧凑排版。',
    summaryEn: 'Linear\'s premium feel stems from precise control of minimal contrast in dark tones and tight -0.02em tracking of the Inter typeface.',
    summary: 'Linear\'s premium feel stems from precise control of minimal contrast in dark tones.',
    tags: ['Dark Mode', 'Tooling', 'High Contrast', 'Minimalist'],
    tagsZh: ['深色模式', '工具型', '高对比度', '极简'],
    colors: [
      { role: 'background', hex: '#0C0C0E', rgb: '12, 12, 14', hsl: '240, 8%, 5%', name: 'Deep charcoal', description: 'Primary dark background surface' },
      { role: 'surface', hex: '#161618', rgb: '22, 22, 24', hsl: '240, 4%, 9%', name: 'Elevated surface', description: 'Secondary surface for cards and navigation' },
      { role: 'primary', hex: '#5E6AD2', rgb: '94, 106, 210', hsl: '234, 58%, 60%', name: 'Linear Purple', description: 'Core brand accent color' },
      { role: 'text', hex: '#F7F8F8', rgb: '247, 248, 248', hsl: '180, 2%, 97%', name: 'Off-white', description: 'Main content text' },
      { role: 'border', hex: '#262629', rgb: '38, 38, 41', hsl: '240, 4%, 15%', name: 'Subtle border', description: 'Thin borders for layout separation' }
    ],
    gradients: [],
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      confidence: 'identified',
      headingWeight: 600,
      bodyWeight: 400,
      fontSizeScale: 'Minor Second',
      lineHeight: '1.5',
      letterSpacing: '-0.02em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'Tech Minimalist',
      colorMode: 'dark',
      borderRadius: '8px',
      shadowStyle: 'Subtle Inner Glow',
      spacingSystem: '4px / 8px tight grid',
      borderStyle: '1px solid with 0.08 opacity',
      animationTendency: 'Fast / Snappy',
      imageHandling: 'Sharp corners with subtle inner border',
      layoutStructure: 'Sidebar-centric with nested navigation',
      cssRadius: '8px',
      cssShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      motionZh: '快速且干脆',
      spacingZh: '紧凑的 4px/8px 网格',
      layoutZh: '以侧边栏为中心的多层级导航'
    },
    createdAt: new Date().toISOString()
  },
  stripe: {
    id: 'preset_stripe',
    sourceType: 'url',
    sourceLabel: 'Stripe',
    summaryZh: 'Stripe 是全球 SaaS 设计的黄金方案，其核心在于极高质量的流体阴影和极度舒适的排版间距。',
    summaryEn: 'Stripe is the gold standard for global SaaS design, centered on high-quality fluid shadows and exceptionally comfortable spacing.',
    summary: 'The gold standard for global SaaS design, focused on fluid shadows and spacing.',
    tags: ['SaaS', 'Clean', 'Professional', 'Light'],
    tagsZh: ['SaaS', '洁净', '专业', '浅色'],
    colors: [
      { role: 'background', hex: '#F6F9FC', rgb: '246, 249, 252', hsl: '210, 33%, 98%', name: 'Cool gray', description: 'Light background with blue hint' },
      { role: 'surface', hex: '#FFFFFF', rgb: '255, 255, 255', hsl: '0, 0%, 100%', name: 'Pure White', description: 'Primary card and content surface' },
      { role: 'primary', hex: '#635BFF', rgb: '99, 91, 255', hsl: '243, 100%, 68%', name: 'Stripe Blurple', description: 'Iconic brand primary color' },
      { role: 'text', hex: '#0A2540', rgb: '10, 37, 64', hsl: '210, 73%, 15%', name: 'Dark Navy', description: 'Heading and primary text' },
      { role: 'accent', hex: '#00D4FF', rgb: '0, 212, 255', hsl: '191, 100%, 50%', name: 'Cyan accent', description: 'Secondary interaction color' }
    ],
    gradients: [
      { css: 'linear-gradient(135deg, #635BFF 0%, #212D63 100%)', description: 'Iconic login and hero gradient' }
    ],
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      confidence: 'identified',
      headingWeight: 500,
      bodyWeight: 400,
      fontSizeScale: 'Perfect Fourth',
      lineHeight: '1.6',
      letterSpacing: '-0.01em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'Modern Enterprise',
      colorMode: 'light',
      borderRadius: '4px',
      shadowStyle: 'Layered Fluid Shadows',
      spacingSystem: 'Flexible, generous white space',
      borderStyle: 'Minimal / Shadow-based',
      animationTendency: 'Fluid / Elegant',
      imageHandling: 'Subtle rounding with multi-layered shadows',
      layoutStructure: 'Bento-box style and multi-column flows',
      cssRadius: '4px',
      cssShadow: '0 50px 100px -20px rgba(50, 50, 93, 0.25), 0 30px 60px -30px rgba(0, 0, 0, 0.3)',
      motionZh: '优雅且流动',
      spacingZh: '慷慨的留白与灵活的模块',
      layoutZh: '多列排布与 Bento 盒式布局'
    },
    createdAt: new Date().toISOString()
  },
  apple: {
    id: 'preset_apple',
    sourceType: 'url',
    sourceLabel: 'Apple',
    summaryZh: 'Apple 设计的精髓在于“呼吸感”，极致的留白配合 SF Pro 字体的完美排版，营造出奢华的节奏感。',
    summaryEn: 'The essence of Apple design lies in its "breathability"—minimalism paired with perfect SF Pro typography creates a luxurious rhythm.',
    summary: 'Luxurious rhythm through extreme whitespace and perfect typography.',
    tags: ['Premium', 'Luxury', 'Minimal', 'Breathable'],
    tagsZh: ['高端', '奢侈', '极简', '呼吸感'],
    colors: [
      { role: 'background', hex: '#FFFFFF', rgb: '255, 255, 255', hsl: '0, 0%, 100%', name: 'White', description: 'Clean white canvas' },
      { role: 'text', hex: '#1D1D1F', rgb: '29, 29, 31', hsl: '240, 3%, 10%', name: 'Eerie Black', description: 'Standard Apple high-contrast text' },
      { role: 'secondary', hex: '#86868B', rgb: '134, 134, 139', hsl: '240, 3%, 54%', name: 'Cool gray', description: 'Secondary descriptive text' },
      { role: 'primary', hex: '#0071E3', rgb: '0, 113, 227', hsl: '210, 100%, 45%', name: 'Link Blue', description: 'Actionable link color' },
      { role: 'border', hex: '#D2D2D7', rgb: '210, 210, 215', hsl: '240, 5%, 87%', name: 'Platinum', description: 'Ultra-thin dividers' }
    ],
    gradients: [],
    typography: {
      fontFamily: 'SF Pro Display, SF Pro Icons, Helvetica Neue, sans-serif',
      confidence: 'identified',
      headingWeight: 600,
      bodyWeight: 400,
      fontSizeScale: 'Major Third',
      lineHeight: '1.4',
      letterSpacing: '0.011em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'Humanist Minimalist',
      colorMode: 'light',
      borderRadius: '20px',
      shadowStyle: 'Almost Invisible / Soft',
      spacingSystem: 'Large, modular padding',
      borderStyle: 'Refined / Non-obtrusive',
      animationTendency: 'Organic / Gentle',
      imageHandling: 'Large, full-width with high-definition rendering',
      layoutStructure: 'Modular sections with massive margins',
      cssRadius: '20px',
      cssShadow: '0 4px 12px rgba(0,0,0,0.05)',
      motionZh: '自然且温润',
      spacingZh: '模组化的大留白系统',
      layoutZh: '带有巨大页边距的模块化层级'
    },
    createdAt: new Date().toISOString()
  },
  vercel: {
    id: 'preset_vercel',
    sourceType: 'url',
    sourceLabel: 'Vercel',
    summaryZh: 'Vercel 代表了纯粹的开发者美学：黑白对比、锐利的线条和 Geist 字体的几何美。',
    summaryEn: 'Vercel represents pure developer aesthetics: stark black-and-white contrast, sharp lines, and the geometric beauty of Geist.',
    summary: 'Pure developer aesthetics: stark B/W contrast and geometric beauty.',
    tags: ['Developer', 'Monochrome', 'Sharp', 'Modern'],
    tagsZh: ['开发者', '单色', '锐利', '现代'],
    colors: [
      { role: 'background', hex: '#FFFFFF', rgb: '255, 255, 255', hsl: '0, 0%, 100%', name: 'Pure White', description: 'Clean white background' },
      { role: 'text', hex: '#000000', rgb: '0, 0, 0', hsl: '0, 0%, 0%', name: 'Pure Black', description: 'Maximum contrast text' },
      { role: 'primary', hex: '#000000', rgb: '0, 0, 0', hsl: '0, 0%, 0%', name: 'Black', description: 'Primary action color' },
      { role: 'secondary', hex: '#666666', rgb: '102, 102, 102', hsl: '0, 0%, 40%', name: 'Medium Gray', description: 'Supportive text and icons' },
      { role: 'border', hex: '#EAEAEA', rgb: '234, 234, 234', hsl: '0, 0%, 92%', name: 'Soft gray', description: 'Grid line and border color' }
    ],
    gradients: [],
    typography: {
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      confidence: 'identified',
      headingWeight: 700,
      bodyWeight: 400,
      fontSizeScale: 'Minor Third',
      lineHeight: '1.5',
      letterSpacing: '-0.04em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'Developer Brutalist',
      colorMode: 'light',
      borderRadius: '6px',
      shadowStyle: 'Hard / None',
      spacingSystem: 'Strict 4px baseline grid',
      borderStyle: '1px solid with high visibility',
      animationTendency: 'Instant / Fast',
      imageHandling: 'Crisp edges with high contrast borders',
      layoutStructure: 'Geometric grids and linear flows',
      cssRadius: '6px',
      cssShadow: 'none',
      motionZh: '极其迅速，近乎瞬间',
      spacingZh: '严格的 4 像素基准网格',
      layoutZh: '几何感极强的栅格系统'
    },
    createdAt: new Date().toISOString()
  },
  notion: {
    id: 'preset_notion',
    sourceType: 'url',
    sourceLabel: 'Notion',
    summaryZh: 'Notion 的成功在于“无感”的设计：像纸张一样的配色，以及让用户专注于内容的排版。',
    summaryEn: 'Notion\'s success lies in its "invisible" design: paper-like colors and typography that lets users focus purely on content.',
    summary: 'Invisible design: paper-like colors that focus on content.',
    tags: ['Workspace', 'Soft', 'Universal', 'Editorial'],
    tagsZh: ['协作', '柔和', '通用', '编辑感'],
    colors: [
      { role: 'background', hex: '#FFFFFF', rgb: '255, 255, 255', hsl: '0, 0%, 100%', name: 'White', description: 'Clean workspace canvas' },
      { role: 'surface', hex: '#F7F6F3', rgb: '247, 246, 243', hsl: '45, 14%, 96%', name: 'Ivory', description: 'Soft background for sidebar/cards' },
      { role: 'text', hex: '#37352F', rgb: '55, 53, 47', hsl: '45, 8%, 20%', name: 'Off-black', description: 'Warm charcoal text' },
      { role: 'secondary', hex: '#9B9A97', rgb: '155, 154, 151', hsl: '45, 2%, 60%', name: 'Taupe gray', description: 'Secondary metadata text' },
      { role: 'accent', hex: '#EB5757', rgb: '235, 87, 87', hsl: '0, 79%, 63%', name: 'Notion Red', description: 'Warning and accent color' }
    ],
    gradients: [],
    typography: {
      fontFamily: 'Inter, Segoe UI, sans-serif',
      confidence: 'identified',
      headingWeight: 600,
      bodyWeight: 400,
      fontSizeScale: 'Major Second',
      lineHeight: '1.5',
      letterSpacing: '-0.01em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'Editorial Minimalist',
      colorMode: 'light',
      borderRadius: '3px',
      shadowStyle: 'Soft / Card-based',
      spacingSystem: 'Standard document-like padding',
      borderStyle: 'Soft thin lines',
      animationTendency: 'Default / Reliable',
      imageHandling: 'Clean frames with subtle 1px border',
      layoutStructure: 'Flexible blocks and sidebars',
      cssRadius: '3px',
      cssShadow: '0 1px 3px rgba(0,0,0,0.12)',
      motionZh: '可靠且默认',
      spacingZh: '标准的文档流式间距',
      layoutZh: '高度灵活的块级布局'
    },
    createdAt: new Date().toISOString()
  },
  framer: {
    id: 'preset_framer',
    sourceType: 'url',
    sourceLabel: 'Framer',
    summaryZh: 'Framer 是创意表达的极致：大胆的补色对比、大半径圆角，以及充满现代感的毛玻璃效果。',
    summaryEn: 'Framer is the ultimate in creative expression: bold complementary contrasts, large radius corners, and modern glassmorphism.',
    summary: 'Creative expression through bold contrasts and glassmorphism.',
    tags: ['Creative', 'Design Tool', 'Glassmorphism', 'Vibrant'],
    tagsZh: ['创意', '设计工具', '毛玻璃', '鲜艳'],
    colors: [
      { role: 'background', hex: '#000000', rgb: '0, 0, 0', hsl: '0, 0%, 0%', name: 'Black', description: 'Deep canvas for creative work' },
      { role: 'primary', hex: '#0055FF', rgb: '0, 85, 255', hsl: '220, 100%, 50%', name: 'Framer Blue', description: 'Primary brand accent' },
      { role: 'accent', hex: '#FF3366', rgb: '255, 51, 102', hsl: '345, 100%, 60%', name: 'Vibrant Pink', description: 'High-energy secondary color' },
      { role: 'surface', hex: '#111111', rgb: '17, 17, 17', hsl: '0, 0%, 7%', name: 'Dark Surface', description: 'Floating UI components' },
      { role: 'text', hex: '#FFFFFF', rgb: '255, 255, 255', hsl: '0, 0%, 100%', name: 'Pure White', description: 'High-visibility text' }
    ],
    gradients: [
      { css: 'radial-gradient(circle at top left, #333 0%, #000 100%)', description: 'Subtle background texture' }
    ],
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      confidence: 'identified',
      headingWeight: 500,
      bodyWeight: 400,
      fontSizeScale: 'Golden Ratio',
      lineHeight: '1.2',
      letterSpacing: '-0.03em',
      alignment: 'left',
      textTreatment: 'solid'
    },
    designDetails: {
      overallStyle: 'Playful High-End',
      colorMode: 'dark',
      borderRadius: '24px',
      shadowStyle: 'Glowing / Vibrant',
      spacingSystem: 'Visual contrast driven spacing',
      borderStyle: 'Gradient borders / Floating',
      animationTendency: 'Bouncy / Smooth',
      imageHandling: 'Large radius with intense gloss',
      layoutStructure: 'Freeform floating interface',
      cssRadius: '24px',
      cssShadow: '0 20px 40px rgba(0,0,0,0.4)',
      motionZh: '富有弹性且平滑',
      spacingZh: '视觉对比驱动的非对称间距',
      layoutZh: '自由浮动的界面结构'
    },
    createdAt: new Date().toISOString()
  }
}
