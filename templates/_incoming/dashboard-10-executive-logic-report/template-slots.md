# Template Slots

## `data-section="report-header"`

- 报告抬头，包含报告名称、行业标签、汇报周期、汇报对象或版本号。

## `data-section="key-takeaways"`

- 核心观点摘要，建议填充 3 条高管可直接阅读的业务结论。

## `data-section="kpi-summary"`

- 核心指标看板，默认包含 4 个 KPI 卡片。

## `data-section="trend-analysis"`

- 关键趋势与结构分布，包含 `chart-trend` 和 `chart-pie`。

## `data-section="target-ranking"`

- 目标达成和排行榜，包含 `chart-gauge` 和 `chart-bar-horizontal`。

## `data-section="conversion-growth"`

- 转化与增长拆解，包含 `chart-funnel` 和 `chart-waterfall`。

## `data-section="multi-dim"`

- 多维画像与结构演变，包含 `chart-radar` 和 `chart-stacked`。

## `data-section="process-flow"`

- 业务执行路径，默认包含 3 个箭头步骤。

## `data-section="data-table"`

- 明细数据下钻，适合承接 Excel 二维表格。

## 全局约定

- 所有可编辑文本均使用 `[data-editable="true"]`。
- 入库版已补齐 `contenteditable="true"` 和 `data-slot="text.xxx"`。
- 图表容器均使用 `id="chart-[name]"`，方便后续注入 ECharts 配置。
