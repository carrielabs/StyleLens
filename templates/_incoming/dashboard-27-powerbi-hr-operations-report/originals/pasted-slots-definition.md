# 数据报告 HTML 模板插槽与注入协议

## 1. 结构化模块 (data-section) 划分

本模板共包含 5 个主要内容区，供 AI 分析与 Excel 数据绑定：

- key-takeaway: 页面顶部的核心复盘总结，通常用来放置大模型分析生成的定性结论。
- workforce-demographics: 员工性别比例（带自定义 SVG 卡片）及 Ethnicity (种族)、Country (国别)、Age (年龄) 的分布图表区（支持 Headcount 与 Proportion 华夫网格无缝切换）。
- hiring-and-skills: 包含招聘转化漏斗（Funnel）、核心能力雷达（Radar）及部门人数环比（Doughnut）的新兴多维分析区。
- salary-distribution: 职级薪酬区间分布散点区，用于分析薪酬公平性与层级关系。
- retention-kpis: 留存、流失及离职人数的核心 KPI 伴随 Sparkline 折线图。
- retention-correlation / retention-trends: 留存率深度复盘图表（均支持一键切为 Table 视图）。
- retention-deep-dive: 包含离职原因排名（HorizontalBar）、编制变动（Waterfall）及离职风险热力图（Heatmap Grid）的高级组织诊断区。

## 2. 文本插槽列表 (Text Slots)

| Slot Key (data-slot) | 类型 | 建议中文长度 | 描述与业务含义 |
| --- | --- | --- | --- |
| text.report_title | 单行文本 | 10-25 字 | 顶栏主标题，如“人力资源年度经营复盘看板” |
| text.filter_info | 单行文本 | 15-35 字 | 数据报告的上下文，如“发布单位：集团人力资源部” |
| text.summary_content | 多行文本 | 80-250 字 | 针对该 Dashboard 数据由 AI 提炼出的高管定性报告总结 |
| text.f1_title | 单行文本 | 12-24 字 | 核心观察 1 的标题（侧重员工结构多样性分布） |
| text.new_sec_title | 单行文本 | 12-24 字 | 核心观察 2 的标题（侧重招聘与岗位技能模型） |
| text.f2_title | 单行文本 | 12-24 字 | 核心观察 3 的标题（侧重薪资分布与职级管理） |
| text.f3_title | 单行文本 | 12-24 字 | 核心观察 4 的标题（侧重流失留存历史趋势） |

## 3. 图表插槽与注入契约 (Charts Mapping)

每一个图表容器必须满足 ECharts 的数据加载规范。注入 Excel 提取 of JSON 数据时，格式需保持高匹配：

Waffle 占比网格/普通柱状图联动:

通过 Headcount 和 Proportion 按钮切换。

Headcount 时，注入各分类的绝对数值，ECharts 渲染为柱状图 (Bar)；

Proportion 时，注入各分类的百分比，ECharts 渲染为 10x10 网格象限图 (Waffle/Heatmap 模拟)。

Sparkline 极简面积图:

只需提供一个一维数值数组（如 [88, 89, 87.5, 89.2, 89.79]），ECharts 将自动隐藏网格线和轴线，渲染为平滑趋势线。

Scatter 关联度图表:

X 轴为薪资数值（数额），Y 轴为留存率或职级代码，支持自动绘制一阶回归趋势线。
