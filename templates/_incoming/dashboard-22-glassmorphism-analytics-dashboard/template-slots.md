# Template Slots

## `data-section="key-takeaway"`

- `header.title`：报告主标题。
- `header.meta`：报告副标题或数据范围说明。
- `kpi1.title`、`kpi1.value`、`kpi1.trend`：第 1 个 KPI，默认总存储。
- `kpi2.title`、`kpi2.value`、`kpi2.trend`：第 2 个 KPI，默认总浏览量。
- `kpi3.title`、`kpi3.value`、`kpi3.trend`：第 3 个 KPI，默认下载量。
- `kpi4.title`、`kpi4.value`、`kpi4.trend`：第 4 个 KPI，默认分享量。
- 图表：`chart-kpi-1` 到 `chart-kpi-4`，`gauge-ring`，240 度 KPI 仪表盘。

## `data-section="core-finding-1"`

- `trend1.title`、`trend1.d_value`、`trend1.u_value`、`trend1.compare`：第 1 个周期趋势。
- `trend2.title`、`trend2.d_value`、`trend2.u_value`、`trend2.compare`：第 2 个周期趋势。
- `trend3.title`、`trend3.d_value`、`trend3.u_value`、`trend3.compare`：第 3 个周期趋势。
- 图表：`chart-trend-1` 到 `chart-trend-3`，`gauge-half`，180 度趋势仪表盘。

## `data-section="core-finding-2"`

- `usage.title`：存储使用类型面板标题。
- 图表：`segmented-bar`，`custom-segmented`，DOM 渲染的分段条形码图。
- `files.title`：热门文件列表标题。
- `file1.name`、`file1.dl`、`file1.view`：第 1 个文件。
- `file2.name`、`file2.dl`、`file2.view`：第 2 个文件。
- `file3.name`、`file3.dl`、`file3.view`：第 3 个文件。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- KPI 图表替换：查找 `chart-kpi-1` 到 `chart-kpi-4`，替换 `initKpiGauge` 调用中的百分比。
- 趋势图表替换：查找 `chart-trend-1` 到 `chart-trend-3`，替换 `initTrendGauge` 调用中的百分比、标签和副标签。
- 分段条形图替换：查找 `renderSegmentedBar()` 内的 `segments` 数组，替换每组 `color`、`count` 和 `height`。
- 模块隐藏：无数据时可隐藏对应 `[data-section]`。
