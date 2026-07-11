# Template Slots

## `data-section="key-takeaways"`

- 置顶高管摘要。
- 包含三个核心业务结论。
- 适合填充经营结论、增长风险、预算建议。

## `data-section="market-overview"`

- 北极星指标大盘。
- 包含主指标、趋势 SVG、HTML 数据切片和 `.ui-tooltip`。
- 适合填充客户数、GMV、活跃企业数、核心增长指标。

## `data-section="metric-card-1"`

- 总营收指标卡。
- 包含指标名称、说明、主数值和目标达成 tooltip。

## `data-section="metric-card-2"`

- MAU 指标卡。
- 包含指标名称、说明、主数值和环比变化。

## `data-section="funnel-analysis"`

- 商业化转化漏斗。
- 适合填充访问、激活、试用、付费等转化阶段。

## `data-section="bar-chart"`

- 月度营收柱状图。
- 默认高亮最新月份。

## `data-section="multi-line-chart"`

- 核心 App 或核心业务流量多线对比。
- 高度使用 `min-h-[350px]`，避免多线图拥挤。
- 每个关键节点配有 `.ui-tooltip`。

## `data-section="quadrant-analysis"`

- 波士顿业务矩阵。
- 适合表达市场份额、增长率、业务阶段。
- 填充时必须同步更新散点位置、颜色类名和 `.ui-tooltip` 文案。

## `data-section="activity-heatmap"`

- 高频活跃热力图。
- 每个关键热力方块悬浮可查看日期与活跃度。
- 填充时必须同步更新方块颜色类名和 `.ui-tooltip` 文案。

## `data-section="revenue-donut"`

- 业务营收占比环形图。
- 适合展示不同业务线或渠道收入结构。

## `data-section="unit-economics"`

- UE 单元经济模型。
- 包含 CAC、LTV 和健康度判断。

## `data-section="attribution-waterfall"`

- 异动归因瀑布图。
- 适合展示利润、收入、成本或转化率变化来源。

## `data-section="ab-testing"`

- A/B 实验对比。
- 包含控制组、实验组和显著性提示。

## `data-section="radar-chart"`

- 能力雷达图。
- 适合表达产品、渠道、品牌、增长、商业化等多维评分。

## `data-section="realtime-alerts"`

- 实时监控池。
- 适合展示异常预警、指标阈值、处理状态。

## 全局插槽

- `[data-editable="true"]`：所有可编辑文字，已补齐 `data-slot` 和 `contenteditable="true"`。
- `.ui-tooltip`：所有悬浮数据面板，已补齐 `data-tooltip-slot`。
- LLM 填充图表数据时，不能只改视觉位置，必须同步更新 tooltip 文案。
