# 数据插槽规范与注入指南

## 内容模块

1. `data-section="key-takeaway"`：核心业务洞察与高管摘要。
2. `data-section="core-finding-1"`：客户增长大盘、KPI、趋势和购买频次。
3. `data-section="core-finding-2"`：年龄结构和品类偏好。
4. `data-section="core-finding-3"`：转化漏斗、CLV、客群属性和排行。

## 文字插槽

入库 HTML 实际使用下划线槽位，注入时应按以下 key 匹配：

1. `text.header_title`
2. `text.header_subtitle`
3. `text.takeaway_title`
4. `text.takeaway_item_1`
5. `text.takeaway_item_2`
6. `text.takeaway_item_3`
7. `text.finding_1_title`
8. `text.finding_1_desc`
9. `text.finding_2_title`
10. `text.finding_2_desc`
11. `text.finding_3_title`
12. `text.finding_3_desc`

说明：用户提供的槽位规范写法为 `text.header.title`，但 Gemini HTML 和 JS 实际写法为 `text.header_title`。为避免破坏现有渲染逻辑，入库版保留 HTML 实际写法。

## 图表模块

1. `chart-kpi-total-customer`：KPI，总客户数。
2. `chart-kpi-new-customer`：KPI，新增客户数。
3. `chart-kpi-avg-rating`：KPI，平均评分。
4. `chart-kpi-repeat-rate`：KPI，复购率。
5. `chart-customer-growth`：面积折线图，客户增长趋势。
6. `chart-purchase-frequency`：柱状图，购买频次。
7. `chart-age-distribution`：环形图，年龄结构。
8. `chart-category-preference`：横向条形/进度图，品类偏好。
9. `chart-conversion-funnel`：漏斗图，转化路径。
10. `chart-clv-scatter`：散点图，CLV 客群分析。
11. `chart-segment-radar`：雷达图，客群属性。
12. `chart-top-ranking`：排行表，Top 单品与商户。

## 兜底规则

1. 缺少文本数据时保留默认示例文案。
2. 缺少图表数据时隐藏对应 `data-chart-type` 容器。
3. 非数值 KPI 不计算趋势，趋势徽章可隐藏或置灰。
4. 超长文本自动换行，禁止撑破卡片。
