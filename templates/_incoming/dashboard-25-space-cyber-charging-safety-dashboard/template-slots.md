# Template Slots Guide

本模板面向数据自动填装，文本通过 `data-slot` / `data-key` 精确定位，图表通过 `window.CHART_DATA` 注入。

## 1. Key Takeaway

顶部全局汇总区域，展示平台名称、联网规模和今日综合结论。

| 字段 | data-slot | 建议 |
| --- | --- | --- |
| 平台名称 | `text.platformTitle` | 24 字以内 |
| 当前站点数 | `text.totalStations` | 必填，无数据用 `-` |
| 可用端口数 | `text.totalPorts` | 必填，无数据用 `-` |
| 累计车辆数 | `text.totalVehicles` | 必填，无数据用 `-` |
| 总充电量 | `text.totalUsage` | 必填，无数据用 `-` |
| 今日综述 | `text.takeawaySummary` | 50-100 字 |

## 2. Core Finding 1

设备运营与流量分析。

| 字段 | data-slot | 对应内容 |
| --- | --- | --- |
| 板块标题 | `text.finding1Title` | 充电端口分布标题 |

图表：

- `chart-port-status-ring`：智能充电端口使用率分布。
- `chart-daily-power-bar`：每日充电量趋势柱状图。
- `chart-vehicle-trend-area`：累计新增注册车辆趋势。

## 3. Core Finding 2

实时事故报警与视频流网格治理。

| 字段 | data-slot | 对应内容 |
| --- | --- | --- |
| 板块标题 | `text.finding2Title` | 火灾安全预警标题 |
| 告警电站 | `text.alarmStation` | 当前告警站点 |
| 告警时间 | `text.alarmTime` | 时间戳 |
| 详细告警地址 | `text.alarmLocation` | 第一现场位置 |

说明：视频流为静态模拟监控卡片。原始槽位说明提到 `video-stream-0` 到 `video-stream-3`，但实际 HTML 未提供对应 `data-slot`。

## 4. Core Finding 3

设备运维与多维效能分析。

图表：

- `chart-fault-funnel`：安全隐患治理流转漏斗。
- `chart-station-radar`：充电站综合效能雷达图。
- `chart-peak-heatmap`：充电时段热力分布图。
- `chart-duration-scatter`：单次充电时长与充电量分布。
- `chart-energy-waterfall`：月度能耗损耗分摊瀑布图。

## Excel / CSV 映射

| Excel 字段/列名 | HTML data-slot |
| --- | --- |
| 平台名称 | `text.platformTitle` |
| 当前站点数 | `text.totalStations` |
| 可用端口数 | `text.totalPorts` |
| 累计车辆数 | `text.totalVehicles` |
| 总充电量 (kWh) | `text.totalUsage` |
| 告警电站 | `text.alarmStation` |
| 告警时间 | `text.alarmTime` |
| 详细告警地址 | `text.alarmLocation` |

## 图表数据注入

替换 HTML 尾部 `window.CHART_DATA` 中的字段：

- `portStatus`
- `dailyPower.dates`
- `dailyPower.values`
- `vehicleTrend.dates`
- `vehicleTrend.values`

底部 5 个高级图表目前数据写在各自 ECharts 配置中，批量注入时应只替换 `series.data`、`xAxis.data`、`yAxis.data`、`radar.indicator` 等数据字段，不修改样式。
