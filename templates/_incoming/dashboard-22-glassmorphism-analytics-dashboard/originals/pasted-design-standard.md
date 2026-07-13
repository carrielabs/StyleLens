# Gemini Design Standard

## 1. 设计原则

极简与通透：采用现代毛玻璃 Glassmorphism 风格，摈弃厚重的实体卡片和生硬的边框。

数据聚焦：利用克制的排版和高对比度核心指标，让用户一眼抓住重点。

轻拟物光影：告别死板纯色背景，采用弥散光晕的浅蓝、浅橙背景，营造高级数字空间感。

## 2. 视觉基础

### 字体

Font Family: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

- 页面大标题：30px / Bold / `#111827`
- 卡片标题：16px / Medium / `#374151`
- 核心指标数字：24px / Bold / `#111827`
- 辅助信息：11px - 14px / `#6B7280` 或 `#9CA3AF`

### 色彩系统

- 页面底层：`#F0F4F8` + 弥散光晕。
- 卡片背景：`rgba(255, 255, 255, 0.75)` + `backdrop-filter: blur(20px)`。
- 品牌蓝：`#3B82F6`
- 成功绿：`#10B981`
- 活力橙：`#F59E0B`
- 梦幻紫：`#8B5CF6`

## 3. 图表与组件规范

- KPI Gauge：240 度开口半圆环，粗线条，圆角端点，数据在图表中心偏左展示。
- Trend Gauge：180 度纯半圆，极细轨道线，配合加粗进度线，内部采用气泡式数据标签。
- Segmented Bar：采用类似条形码的密集竖线排列，通过颜色透明度交错体现质感。
- Hover：卡片去除复杂 hover 动画；可编辑区域点击时显示微弱蓝色底框。
