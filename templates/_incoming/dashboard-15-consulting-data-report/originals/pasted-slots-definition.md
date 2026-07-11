# 数据报告 HTML 模板槽位说明

本模板采用连续页面的滚动形式，每个区块代表数据分析的一个维度。适合用脚本直接向特定的 `data-section` 注入数据。

## 可用模块

### `data-section="report-header"`

报告封面 / 抬头，包含报告宏观标题、生成时间、汇报对象。

### `data-section="executive-summary"`

执行摘要 / 北极星指标。结构：核心指标大字报 + 摘要文字总结。适用场景：大盘数据概览、GMV、DAU 等核心数据汇报。

### `data-section="market-dynamics"`

市场 / 趋势大盘分析。结构：顶部结论标题 + 细实线 + 左侧柱状图 / 折线图 + 垂直虚线 + 右侧核心洞察 Comments。

### `data-section="segmentation-analysis"`

细分市场 / 结构分析。结构：顶部结论标题 + 左侧百分比堆叠柱状图 / 饼图 + 右侧具体特征描述。

### `data-section="competitive-landscape"`

竞争格局 / 四象限散点矩阵。结构：顶部结论标题 + 左侧 2x2 散点图矩阵 + 右侧竞争对手短评。

### `data-section="funnel-conversion"`

业务漏斗 / 转化路径。结构：水平漏斗图 / 阶梯瀑布图 + 对应阶段的流失原因分析表。

### `data-section="strategic-solutions"`

行动方案 / 策略推演矩阵。结构：多维表格，问题分类 -> 假设 -> 策略 -> 优先级。

## 注入规范

- 修改文字：寻找带有 `data-editable="true"` 的标签直接替换其 `innerHTML`。
- 修改图表：模板底部预留 Chart.js 的配置对象，注入程序只需修改 `const chartData = {...}` 中的数据数组，无需触碰 UI 代码。
