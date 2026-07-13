# HTML 模板模块与插槽注入指南

## 1. 结构概述

- `data-section="key-takeaway"`：核心结论摘要区。
- `data-section="core-finding-1"`：宏观趋势与核心指标。
- `data-section="core-finding-2"`：维度分解。
- `data-section="core-finding-3"`：深度洞察与分布。

## 2. 文本插槽

- `text.dashboard.title`：全局标题。
- `text.dashboard.subtitle`：更新时间。
- `text.takeaway.title`：Key Takeaway 标题。
- `text.takeaway.content`：Key Takeaway 核心洞察内容。
- `text.finding1.title`：Finding 1 区块标题。
- `text.finding2.title`：Finding 2 区块标题。
- `text.finding3.title`：Finding 3 区块标题。

## 3. 图表模块说明

- `chart-kpi-1`：`kpi-sparkline`
- `chart-kpi-2`：`kpi-sparkline`
- `chart-kpi-3`：`kpi-sparkline`
- `chart-main-trend`：`area`
- `chart-bar-account`：`bar-horizontal`
- `chart-bar-region`：`bar-horizontal`
- `chart-bar-product`：`bar-stacked-horizontal`
- `chart-donut-distribution`：`donut`
- `chart-radar-performance`：`radar`
- `chart-scatter-correlation`：`scatter`

## 4. Excel/CSV 注入注意事项

- 将 CSV 解析为 JSON Array 后替换 ECharts option 中的 `series.data` 和 `xAxis/yAxis.data`。
- 缺失数据使用 `null`，不补 `0`，除非真实业务含义为 0。
