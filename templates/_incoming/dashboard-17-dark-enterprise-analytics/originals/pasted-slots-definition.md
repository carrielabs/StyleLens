# 模板插槽与数据注入说明 (Template Slots Guide)

## 1. 内容模块 (Sections)

页面严格遵循 Key Takeaway + 3 个 Core Finding 的结构。

- `[data-section="key-takeaway"]`: 核心总结区（全局 KPI）。
- `[data-section="finding-1"]`: 核心洞察一（趋势与结构）。
- `[data-section="finding-2"]`: 核心洞察二（对比与排名）。
- `[data-section="finding-3"]`: 核心洞察三（多维特征与下钻）。

## 2. 文本插槽映射 (Text Slots)

每个可编辑文本必须包含四大属性：

- `data-editable="true"`
- `contenteditable="true"`
- `data-slot="xxx"`
- `data-key="xxx"`

字数建议:

- 主标题 (`text.report_title`): 4 - 15 个中文字符。
- 副标题/短说明 (`text.report_subtitle`, `text.finding_*_desc`): 10 - 40 个中文字符。
- 指标名称 (`text.kpi_*_label`): 2 - 6 个中文字符。

数据注入注意: 若后端注入的字符串包含 HTML 实体，请转义后再注入，避免破坏 DOM 结构。

## 3. 图表模块对接 (Chart Modules)

图表通过 id 进行实例化，通过 `data-chart-type` 识别所需数据结构。

支持注入的数据源格式:

- 单维趋势：适合两列 CSV，第一列日期/类别，第二列数值。
- 占比结构：适合两列 CSV，第一列分类名称，第二列数值。
- 多维对比：适合透视表格式。
- 散点分布：适合三列以上，包含 X 轴数值、Y 轴数值、分类标识和可选气泡大小。

缺失处理:

如果后端检测到图表数据源为空，则向前端传递 `null`。前端 JS 初始化时，检测到数据为空的图表容器，应渲染极简“暂无数据”文字或隐藏该节点。
