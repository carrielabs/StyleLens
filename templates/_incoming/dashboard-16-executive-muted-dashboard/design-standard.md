# Design Standard

## 核心理念

- 信息密度优先：采用紧凑网格布局，适合同屏展示多维数据。
- 克制视觉表达：使用暖灰、羊皮纸质感和莫兰迪数据色，避免流光渐变和强科技蓝。
- 数据为主：弱化容器边界，仅通过 1px 细线、轻微底色和极弱阴影区分模块。

## 适用场景

- 适合：月度经营复盘、季度管理层汇报、财务与运营分析、B2B 业务指标监控。
- 不适合：C 端趣味数据盘点、实时指挥中心大屏、单指标极简汇报。

## 色彩系统

- Page BG：`#efeae1`
- Card BG：`#fbf7f1`
- Border：`#e2dcd0`
- Primary Text：`#3c4043`
- Secondary Text：`#8b939c`
- Data Blue：`#7a9fb1`
- Data Orange：`#d8a47f`
- Data Rose：`#b07f7f`
- Data Green：`#8ba892`
- Trend Up：`#c26d6d`
- Trend Down：`#7ba884`

## 排版

- 字体：`PingFang SC`、`Microsoft YaHei`、`-apple-system`、系统无衬线体。
- 指标数值：使用较粗字重，并启用等宽数字对齐。
- 标题：小字号、加粗、微宽字距，适合严谨型商业报告。
- 字号层级：控制在少量层级内，避免视觉噪音。

## 模块规范

- Key Takeaway 位于顶部，使用总结性陈述。
- 模块内间距保持 12px 到 24px。
- 模块之间保持 24px 到 32px。
- 卡片圆角使用 8px，不使用夸张圆角。
- 图表必须带 tooltip；轴类图表应提供 hover 指示。

## 中文内容规范

- 中英文、中文与数字之间保留自然间隔。
- 不使用 `Lorem ipsum`、`测试数据`、`null` 等生硬占位。
- 数据缺失时显示短线 `-` 或隐藏对应维度。

## 入库说明

实际 HTML 使用 Tailwind CSS CDN、ECharts CDN 和 Vanilla JavaScript。入库版未改写视觉与图表逻辑，仅完成标准文件整理和模板注册。
