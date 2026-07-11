# Template Slots

## `data-section="header"`

- `logo`：机构或项目标识
- `title`：报告主标题
- `subtitle`：报告副标题、技术栈或分析区间
- `meta-info`：采集时间、覆盖范围、归档编号等

## `data-section="kpi"`

四组 KPI 卡片，可按数据增减：

- `kpi-title`：指标名称
- `kpi-value`：指标数值
- `kpi-trend`：环比或同比变化
- `kpi-icon`：指标图标

## `data-section="ai-insights"`

管理层可直接阅读的分析结论：

- `insight-tag`：洞察类型
- `insight-title`：关键结论
- `insight-desc`：定量解释和建议

## `data-section="visual-grid-left"`

- `geographic-distribution`：地理/空间热力分布，使用 `canvas#worldMapCanvas`
- `trend-analysis`：时间序列走势，使用 `canvas#trendChart`

## `data-section="visual-grid-right"`

- `top-ranking-primary`：主要分类排行榜，使用 `canvas#rankingChartPrimary`
- `top-ranking-secondary`：次要分类排行榜，使用 `canvas#rankingChartSecondary`

## `data-section="data-table"`

- `table-header`：表头定义
- `table-body`：明细数据行
- `table-bar-visual`：行内比例条

## `data-section="footer"`

- `archive-info`：报告归档编号与数据源
- `legal-links`：免责声明、数据规范、联系入口
