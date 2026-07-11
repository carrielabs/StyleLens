# Template Slots

说明：用户提供的槽位说明是 16 个理想模块；实际 HTML 源文件把这些分析内容合并成 8 个 `data-section`。入库版以实际 HTML 为准，不重写页面结构。

## `data-section="hero"`

- `text.hero.label`：报告标签。
- `text.hero.title`：报告主标题。
- `text.hero.subtitle`：报告副标题。
- `text.hero.date`：发布时间。
- `text.hero.department`：出品方。
- `text.hero.security`：密级。

## `data-section="executive-summary"`

- `text.summary.p1` 到 `text.summary.p3`：核心高管摘要段落。

## `data-section="insight-1"`

- `text.insight1.title`：洞察标题。
- `text.insight1.desc`：洞察说明。
- `text.kpi1.title` / `value` / `yoy`
- `text.kpi2.title` / `value` / `yoy`
- `text.kpi3.title` / `value` / `yoy`
- `text.kpi4.title` / `value` / `netadd`
- `text.chart1.title` / `desc`：`chart-revenue`
- `text.chart2.title` / `desc`：`chart-structure`

## `data-section="insight-2"`

- `text.insight2.title`：洞察标题。
- `text.insight2.desc`：洞察说明。
- `text.chart3.title` / `desc`：`chart-waterfall`
- `text.chart4.title` / `desc`：`chart-funnel`

## `data-section="insight-3"`

- `text.insight3.title`：洞察标题。
- `text.insight3.desc`：洞察说明。
- `text.chart5.title` / `desc`：`chart-retention`
- `text.chart6.title` / `desc`：`chart-user`

## `data-section="insight-4"`

- `text.insight4.title`：洞察标题。
- `text.insight4.desc`：洞察说明。
- `text.chart7.title` / `desc`：`chart-regional`
- `text.chart8.title` / `desc`：`chart-radar`
- `text.chart9.title` / `desc`：`chart-gauge`

## `data-section="insight-5"`

- `text.insight5.title`：洞察标题。
- `text.insight5.desc`：洞察说明。
- `text.chart10.title` / `desc`：`chart-scatter`
- `text.chart11.title` / `desc`：`chart-kline`

## `data-section="conclusion"`

- `text.conclusion.title`：总结标题。
- `text.conclusion.s1` 到 `text.conclusion.s3`：下一步战略建议。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- 图表替换：修改底部 ECharts 配置。
- 排序容器：`#sortable-insights`。
- 拖拽手柄：`.drag-handle`。
