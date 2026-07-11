# Template Slots

## `data-section="hero"`

- `text.hero.confidential`：机密类型声明。
- `text.hero.title`：报告主标题。
- `text.hero.subtitle`：报告副标题。
- `text.hero.date`：日期。
- `text.hero.source`：数据源说明。

## `data-section="key-takeaways"`

- `text.keyaways.title`：模块标题。
- `text.keyaways.item1` 到 `text.keyaways.item3`：核心观点段落。

## `data-section="kpi-metrics"`

- `text.kpi.card1.title` / `value` / `sublabel` / `subvalue`
- `text.kpi.card2.title` / `value` / `sublabel` / `subvalue`
- `text.kpi.card3.title` / `value` / `sublabel` / `subvalue`
- `text.kpi.card4.title` / `value` / `sublabel` / `subvalue`

## 图表模块

- `data-section="trend-analysis"`：`chart-trend`，槽位 `text.trend.title`。
- `data-section="composition-analysis"`：`chart-composition`，槽位 `text.composition.title`、`text.composition.innerLabel`、`text.composition.innerValue`、`text.composition.legend1.label` 到 `text.composition.legend3.value`。
- `data-section="geo-distribution"`：`chart-geo`，槽位 `text.geo.title`、`text.geo.note`。
- `data-section="user-persona"`：`chart-persona-radar`，槽位 `text.persona.title`、`text.persona.subtitle`。
- `data-section="unit-economics"`：`chart-unit-econ`，槽位 `text.unit.title`、`text.unit.legend.cac`、`text.unit.legend.ltv`。
- `data-section="growth-matrix"`：`chart-growth-matrix`，槽位 `text.matrix.title`、`text.matrix.subtitle`。
- `data-section="market-position"`：`chart-market-share`，槽位 `text.market.title`。

## 数据与进度模块

- `data-section="funnel-conversion"`：`text.funnel.title`，以及 `text.funnel.step1.label` 到 `text.funnel.step3.note`。
- `data-section="leaderboard-table"`：`text.leaderboard.title`，以及 `text.leaderboard.row1.name` 到 `text.leaderboard.row5.growth`。
- `data-section="target-achievement"`：`text.target.title`，以及 `text.target.goal1.label` 到 `text.target.goal3.note`。

## 图文混合模块

- `data-section="resource-allocation"`：`text.resource.title`、`text.resource.subtitle`、`text.resource.value`、`text.resource.content`。
- `data-section="risk-metrics"`：`text.risk.title`，以及 `text.risk.item1.label` 到 `text.risk.item3.value`。
- `data-section="strategic-insight"`：`text.insight.quote`、`text.insight.content`。

## 额外实际模块

原始槽位表未列出以下实际存在的模块，入库版按 HTML 保留：

- `data-section="insight-1"`：`text.insight1.tag`、`text.insight1.title`、`text.insight1.desc`。
- `data-section="insight-2"`：`text.insight2.tag`、`text.insight2.title`、`text.insight2.desc`。
- `data-section="final-conclusion"`：`text.conclusion.title`，以及 `text.conclusion.step1.title` 到 `text.conclusion.step3.desc`。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- 图表替换：修改底部 Chart.js 配置。
- 排序容器：`#report-canvas`。
- 拖拽手柄：`.drag-handle`。
