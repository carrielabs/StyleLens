# Template Slots

## `data-section="header"`

- 报告主标题、副标题、日期和数据源时间。

## `data-section="key-takeaways"`

- 三栏核心发现卡片。
- 每张卡片包含序号、结论标题、核心数值和说明文字。

## `data-section="chart-split-bar"`

- 左侧黑底核心结论，右侧横向柱状分布。
- 适合展示选项占比、分类汇总和投资意愿分布。

## `data-section="chart-split-donut"`

- 左侧洞察文案，右侧 CSS 半环形图。
- 适合强调单一核心百分比指标。

## `data-section="archetypes"`

- 横向人群/阶段分层。
- 当前用于展示跟随者、务实派、先锋派三类画像。

## `data-section="data-table"`

- 数据明细表格。
- 包含部门、预算、阶段、ROI 和评级。

## `data-section="trend-chart"`

- CSS 柱状趋势图。
- 当前用于展示 2025-2026 核心业务线月度营收趋势。

## `data-section="funnel-analysis"`

- B2B 销售管线转化漏斗。
- 包含 MQL、SQL、商务谈判、最终成单和各层转化率。

## `data-section="progress-trackers"`

- 战略目标进度条。
- 适合展示 OKR、预算消耗、风险阈值等进度类指标。

## `data-section="vs-comparison"`

- 左右对比模块。
- 当前用于对比传统业务线和创新智能体业务。

## `data-section="quadrant-matrix"`

- 产品组合战略矩阵。
- 当前为 BCG Matrix 四象限：明星、问题、现金牛、瘦狗业务。

## `data-section="leaderboard"`

- 排行榜模块。
- 当前展示领先区域和落后预警区域。

## `data-section="insight-quote"`

- 核心观点引用。
- 适合放置报告结论、专家观点或管理层判断。

## 数据注入说明

- 文本替换：优先查找 `data-slot`，所有可编辑节点均有 `data-editable="true"` 和 `contenteditable="true"`。
- 图形替换：当前图表为原生 HTML/CSS 结构，修改数值时需要同步调整相邻 `style` 中的宽度、高度或渐变角度。
- 原始 Gemini 槽位说明只覆盖 `header`、`key-takeaways`、`chart-split-bar`、`chart-split-donut`、`archetypes`、`data-table`，未覆盖后续 7 个实际模块。
