# Gemini Slots Definition

## 页面头部

- `header.title`：报告主标题，如 Analytics & Report，建议小于 20 字。
- `header.meta`：报告副标题或说明，建议小于 40 字。

## KPI 总览

`kpi1` 到 `kpi4` 结构相同：

- `kpi1.title`：指标名称。
- `kpi1.value`：核心数值及单位。
- `kpi1.trend`：趋势及比较。
- `chart-kpi-1`：对应颜色仪表盘，传入单一百分比数据。

## 趋势分析

`trend1` 到 `trend3` 结构相同：

- `trend1.title`：周期标题。
- `trend1.d_value`：主指标数值。
- `trend1.u_value`：副指标数值。
- `trend1.compare`：底部同比或环比说明。
- `chart-trend-1`：传入百分比、中心文字和副文字。

## 综合面板

- `usage.title`：存储使用类型面板标题。
- `segmented-bar`：自定义 DOM 分段条形图，提供 4 组分类的条线数量。
- `files.title`：热门文件列表标题。
- `file1.name`：文件名。
- `file1.dl`：下载次数说明。
- `file1.view`：查看次数说明。
