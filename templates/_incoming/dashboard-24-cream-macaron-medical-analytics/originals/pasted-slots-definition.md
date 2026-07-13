# 模板插槽与数据注入指南

## 1. 结构大纲

本模板由 4 个主要数据区组成：

- `key-takeaway`：执行摘要与核心概览，包含账单环形图、患者年龄柱状图、候诊延迟面积图。
- `core-finding-1`：患者详情与多系统健康度评估雷达图、诊疗流程转化漏斗。
- `core-finding-2`：时段患者流入热力图与年龄/治疗资费散点分布图。
- `core-finding-3`：优势科室业绩排行横向条形图与季度财务盈余变动瀑布图。

## 2. 交互式数据标签注入常量一览

| 容器 ID | data-chart-type | 数据源结构 | Hover 提示框推荐中文模板格式 |
| --- | --- | --- | --- |
| `chart-main-pie` | `doughnut` | `[ {value, name} ]` | `{b} 账单: {c}万 ({d}%)` |
| `chart-user-stats` | `bar` | `[ value1, value2... ]` | `门诊时段 {b}: 候诊患者 {c} 人` |
| `chart-wait-time` | `area` | `[ value1, value2... ]` | `测量时段 {b}: 平均等待延迟 {c} 分钟` |
| `chart-clinical-radar` | `radar` | `[ [val1, val2... ] ]` | `{b} 系统机能综合评定: {c} 分` |
| `chart-diagnostic-funnel` | `funnel` | `[ {value, name} ]` | `{b} 阶段留存转化率: {c}%` |
| `chart-temporal-heatmap` | `heatmap` | `[ [y, x, val] ]` | `周几+时段: 门诊流量活跃度为 {c}` |
| `chart-cost-scatter` | `scatter` | `[ [age, cost] ]` | `患者年龄 {c0} 岁, 产生诊疗资费 {c1} 千元` |
| `chart-dept-ranking` | `horizontal-bar` | `[ value1, value2... ]` | `{b} 科室季度创收: {c}k` |
| `chart-operational-waterfall` | `waterfall` | `[ val1, val2... ]` | 必须自定义 formatter 函数，隔离辅助占位柱，仅展示盈余增减的真实绝对与相对差值 |
