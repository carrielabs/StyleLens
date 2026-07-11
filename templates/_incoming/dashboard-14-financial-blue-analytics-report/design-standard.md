# Design Standard

## 核心原则

- 专业严谨：克制配色、清晰网格、弱阴影，突出财经数据本身。
- 层级分明：宏观 KPI、趋势图表、结构拆解、结论建议依次展开。
- 高信息密度：在有限页面空间内展示多维指标，同时保留必要留白。

## 色彩系统

- Primary Blue：`#0052D9`
- Dark Blue：`#0A1633`
- Up / Positive：`#F53F3F`
- Down / Negative：`#00B42A`
- Warning：`#FF7D00`
- Background Base：`#F2F5F8`
- Card Background：`#FFFFFF`
- Text Title：`#1D2129`
- Text Body：`#4E5969`
- Text Muted：`#86909C`
- Border：`#E5E6EB`

## 排版

- 字体：`system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
- Hero Title：48px / Bold
- Section Title：20px / Bold
- KPI Value：32px / Bold / DIN Alternate 或系统无衬线
- Body Text：14px / Regular
- Caption：12px / Regular

## 模块与卡片

- 圆角：2px 或 4px 为主，保持商业报告的硬朗感。
- 阴影：`0 2px 4px rgba(0,0,0,0.02)` 或 `1px solid #E5E6EB`。
- 模块间距：24px。
- 卡片内边距：20px 或 24px。

## 交互

- ECharts 图表必须配置 tooltip。
- 轴类图表 hover 时显示 crosshair。
- 数据卡片 hover 只允许轻微背景或边框变化，不做明显位移。

## 入库说明

实际 HTML 使用 Tailwind CSS、ECharts 和 SortableJS。入库版保留 Gemini 原始视觉方向，只做必要的变量修正和 tooltip 指针补齐。
