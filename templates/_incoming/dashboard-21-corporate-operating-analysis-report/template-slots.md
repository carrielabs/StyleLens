# Template Slots

## `data-section="section-takeaway"`

- `text.header.title`：报告主标题。
- `text.header.subtitle`：报告副标题或时间范围。
- `text.takeaway.title`：核心结论板块标题。
- `text.takeaway.desc`：核心结论摘要。
- `chart-kpi-revenue`：总收入 KPI 卡片。
- `chart-kpi-profit`：利润或项目 KPI 卡片。
- `chart-kpi-users`：用户或时间投入 KPI 卡片。
- `chart-kpi-growth`：增长或资源 KPI 卡片。
- `chart-main-trend`：收入与时间趋势面积图。
- `chart-overall-progress`：整体进度仪表盘。

## `data-section="section-finding-1"`

- `text.finding1.title`：发现 1 标题。
- `text.finding1.desc`：发现 1 说明。
- `chart-workload`：项目工作负载图。
- `chart-resource-pie`：资源分配环形图。

## `data-section="section-finding-2"`

- `text.finding2.title`：发现 2 标题。
- `text.finding2.desc`：发现 2 说明。
- `chart-cost-bar`：成本结构堆叠柱状图。
- `chart-efficiency-radar`：效率雷达图。

## 数据注入说明

- 文本替换：通过 `data-key` 精确匹配并替换纯文本。
- 图表替换：修改底部 ECharts `setOption` 中的 `data`、`categories`、`series` 等字段。
- 缺失数据：隐藏对应图表容器，或显示“暂无相关数据”。
- 注意：原始交付说明包含 `finding3` 和更多图表模块，但当前 HTML 未实现这些槽位。
