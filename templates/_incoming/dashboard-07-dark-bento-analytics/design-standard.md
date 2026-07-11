# Dark Bento Analytics 设计标准

## 核心原则

暗黑科技、Bento Grid、高密度数据报告。页面用于大厂级经营分析和管理层 BI 汇报，必须结论先行、指标分层、图表信息可追溯。

## 黄金阅读动线

1. Row 1：`key-takeaways`，关键结论通栏跨 4 列。
2. Row 2：`market-overview` 北极星指标大盘，加两个 1x1 辅助指标。
3. Row 3：`funnel-analysis` 商业化漏斗，加 `bar-chart` 月度营收。
4. Row 4：`multi-line-chart` 核心流量对比，加 `quadrant-analysis` 波士顿矩阵。
5. Row 5：`activity-heatmap` 活跃热力图，加 `revenue-donut` 和 `unit-economics`。
6. Row 6：`attribution-waterfall` 异动归因，加 `ab-testing`、`radar-chart`、`realtime-alerts`。

## 色彩

- 页面背景：`#000000`。
- 卡片背景：`#111111`。
- 卡片描边：`#262626`。
- 悬停描边：`#444444`。
- 主强调色：`#E31937`。
- Tooltip 背景：`rgba(34, 34, 34, 0.95)`。
- Tooltip 描边：`#444444`。

## 字体

- 字体族：`system-ui`, `PingFang SC`, `Microsoft YaHei`, `sans-serif`。
- 超大指标：`clamp(3.5rem, 5vw, 5rem)`，字重 800。
- 模块标题：18px-20px，字重 700。
- 辅助说明：12px-14px，使用灰色层级。
- 数字和时间：优先使用等宽字体或 `font-mono`。

## Tooltip 规范

- 所有图表节点需要包裹 `group` 类。
- Tooltip 使用统一 `.ui-tooltip`。
- 背景为深灰毛玻璃，细边框，圆角 8px。
- `z-index` 为 50，保证浮层压在图表之上。
- 右侧边缘元素使用 `.ui-tooltip.align-right` 避免溢出。
- LLM 更新图表数据时，必须同步更新 `.ui-tooltip` 文案。

## 防重叠布局

- 带背景趋势图的卡片必须使用 `flex-col`。
- 标题和关键数字放在上方。
- 图表放在下方独立区域，使用 `flex-grow`、固定高度或 `min-height`。
- 禁止把核心数字用绝对定位压在图表上。

## 当前限制

- 未生成 `preview.png`。
- 本轮按低性能模式执行，未打开浏览器、未截图、未启动 dev server。
