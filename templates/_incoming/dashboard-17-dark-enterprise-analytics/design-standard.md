# Design Standard

## 企业级数据分析 Dashboard 设计规范

主题：Dark Enterprise Analytics / Dark Analytics Theme

## 1. 设计哲学与视觉基调

本模板以“数据即 UI”为核心原则，通过极简线条、精准留白和高对比度排版，形成企业级、管理层视角的数据报告风格。

适用场景：

- 高管经营复盘
- 年度或季度业务报告
- 核心系统状态监控
- 深度数据分析洞察

不适用场景：

- C 端娱乐化活动页
- 重图文营销落地页
- 复杂表单交互管理后台

## 2. 颜色规范

- 背景色：`#0A0A0A`
- 模块背景：`#161616`
- 主指标强调色：`#E6D3C0`
- 正文色：`#E5E7EB`
- 次要文字：`#888888`
- 上涨/优秀：`#34D399`
- 下降/风险：`#F87171`
- 中性/强调：`#60A5FA`
- 边框：`#2A2A2A`
- Tooltip 背景：`#222222`

## 3. 字体与排版

字体栈：

`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

数字字体：

`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

排版规则：

- 模块英文标题使用极小字号和大写样式。
- 中文主标题在英文标题下方或后方，层级更高。
- KPI 数字使用等宽数字特征，保证对齐。
- 禁止倾斜体中文、过重中文粗体和文字渐变。

## 4. 留白与网格

- 页面最大宽度：约 `1400px`
- 页面结构：滚动式 Dashboard
- 模块间距：大留白，约 `40px - 80px`
- 卡片内边距：`24px`
- 栅格：基于 Tailwind Grid 的响应式布局

## 5. 交互规范

- 图表 Hover 使用 ECharts tooltip。
- Tooltip 使用深灰背景、透明边框和浅色文字。
- 可编辑文字 hover 时显示弱底色与虚线描边。
- 图表容器不可编辑，避免误操作。

## 6. 入库修正

- 原始 HTML 部分图表 tooltip 会覆盖通用深色配置。
- 入库版已统一 tooltip 背景为 `#222222`，边框为透明。
