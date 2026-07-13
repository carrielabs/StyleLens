# 数据插槽规范与注入指南

## 内容模块

1. `data-section="key-takeaway"`：页面顶部的核心管理发现与建议。
2. `data-section="workforce-demographics"`：员工性别比例、族裔、国家和年龄分布。
3. `data-section="hiring-and-skills"`：招聘漏斗、核心能力雷达和部门人数环比。
4. `data-section="salary-distribution"`：职级薪酬区间分布散点分析。
5. `data-section="retention-kpis"`：留存率、流失率和离职人数 KPI 及 Sparkline。
6. `data-section="retention-correlation"`：留存率与薪酬相关性，支持 Chart/Table 切换。
7. `data-section="retention-trends"`：历史留存趋势，支持 Chart/Table 切换。
8. `data-section="retention-deep-dive"`：离职原因、编制变动和流失风险热力图。

说明：用户提供的槽位说明写“5 个主要内容区”，但实际列出并交付 8 个模块。入库版按 HTML 实际模块登记。

## 文字插槽

入库 HTML 实际使用以下 key：

1. `text.report_title`
2. `text.filter_info`
3. `text.summary_content`
4. `text.f1_title`
5. `text.new_sec_title`
6. `text.f2_title`
7. `text.f3_title`

## 图表模块

1. `chart-ethnicity-dist`：Bar / Waffle，族裔分布。
2. `chart-country-dist`：Bar / Waffle，国家区域分布。
3. `chart-age-dist`：Bar / Waffle，年龄层分布。
4. `chart-recruitment-funnel`：Funnel，招聘转化漏斗。
5. `chart-competency-radar`：Radar，核心能力雷达。
6. `chart-dept-doughnut`：Doughnut，部门人数占比。
7. `chart-salary-scatter`：Scatter，职级薪酬区间分布。
8. `sparkline-retention`：Sparkline，留存率趋势。
9. `sparkline-turnover`：Sparkline，流失率趋势。
10. `sparkline-left`：Sparkline，离职人数趋势。
11. `chart-retention-scatter`：Scatter，薪酬与留存相关性。
12. `chart-retention-trend`：Combo-Line-Bar，历史留存趋势。
13. `chart-turnover-causes`：HorizontalBar，离职原因排名。
14. `chart-headcount-waterfall`：Waterfall，年度编制变化。
15. `chart-risk-heatmap`：Heatmap，流失风险矩阵。

说明：`sparkline-*` 是图表容器，但不以 `chart-` 开头；配置中的 `chartCount` 按项目测试口径只统计 12 个 `chart-*` 容器。

## 兜底规则

1. 缺少文本数据时保留默认中文示例文案。
2. 缺少图表数据时隐藏对应图表容器或保留默认示例数据。
3. 页签切换和 Chart/Table 切换后调用 ECharts `resize()`。
4. 不改布局样式，只替换文本或图表数据字段。
