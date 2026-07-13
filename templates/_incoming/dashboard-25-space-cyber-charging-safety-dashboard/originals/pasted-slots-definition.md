# 模板数据插槽与注入映射规范

页面总体结构分为 Key Takeaway、Core Finding 1、Core Finding 2 和 Core Finding 3。

## Key Takeaway

- `text.platformTitle`：平台主标题。
- `text.totalStations`：当前站点数。
- `text.totalPorts`：可用端口数。
- `text.totalVehicles`：累计车辆数。
- `text.totalUsage`：总充电量。
- `text.takeawaySummary`：今日安全及设备运行综合结论。

## Core Finding 1

- `text.finding1Title`：设备运营板块标题。
- `text.portUsageRate`：当前端口实时利用率。
- `chart-port-status-ring`：设备使用率环形图。
- `chart-daily-power-bar`：每日充电电量柱状图。
- `chart-vehicle-trend-area`：新增车辆趋势面积图。

## Core Finding 2

- `text.finding2Title`：安全排查板块标题。
- `text.alarmStation`：当前火灾告警第一现场站点。
- `text.alarmLocation`：当前火灾告警第一现场位置。
- `video-stream-0` 到 `video-stream-3`：监控摄像窗口。

## Core Finding 3

包含雷达图、故障流转漏斗、充电时段热力图、能耗 waterfall 等高级分析图表。

## Excel / CSV / JSON 映射

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
