# 企业级数据分析 Dashboard 设计规范 (Dark Analytics Theme)

## 1. 设计哲学 & 视觉基调

本模板秉持“数据即 UI (Data is UI)”的核心原则。摒弃花哨的装饰、夸张的渐变和厚重的阴影，通过极简的线条、精准的留白和高对比度的排版，打造企业级、管理层视角的专业数据报告风格。

适用场景：高管经营复盘、年度/季度业务报告、核心系统状态监控、深度数据分析洞察。

不适用场景：C端娱乐化活动页、重图文的营销落地页、需要复杂表单交互的管理后台界面。

## 2. 颜色规范 (Color Palette)

- 背景色 (Background): `#0A0A0A`
- 模块背景 (Card Surface): `#161616`
- 主指标强调色 (Accent/KPI): `#E6D3C0`
- 正文色 (Primary Text): `#E5E7EB`
- 次要文字 (Muted Text): `#888888`
- 上涨/优秀 (Positive): `#34D399`
- 下降/风险 (Negative): `#F87171`
- 中性/强调 (Highlight): `#60A5FA`

## 3. 字体与排版规范 (Typography)

字体栈: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`

数字字体: 强烈建议图表和 KPI 使用等宽数字特征的字体，保证上下对齐。

中文排版规则:

- 模块英文标题（全大写）与中文主标题组合出现，英文在前/上，字号极小（如 10px），中文在后/下，字号偏大。
- 避免中英文/数字之间缺失空格。
- 禁止使用倾斜体中文、禁止使用粗体字重超过 700 的中文、禁止文字渐变。

## 4. 留白与网格 (Spacing & Grid)

采用 12 列响应式网格。

模块间距保持 40px - 80px，卡片内部 padding 保持 20px - 24px。

## 5. 交互规范 (Hover & Interactions)

图表 Hover: 必须使用 ECharts 自带的 tooltip，背景采用深灰色 `#222`，边框透明，文字清晰。

可编辑文本 Hover: 后台配置人员鼠标悬浮时，展现极弱的底色变化（如 `bg-white/5`）。
