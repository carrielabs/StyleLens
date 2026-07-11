# 数据报告 HTML 模板 - 模块与槽位定义表

## 1. 报告头部 `data-section="hero"`

- `text.hero.confidential`
- `text.hero.title`
- `text.hero.subtitle`
- `text.hero.date`
- `text.hero.source`

## 2. 核心洞察 `data-section="key-takeaways"`

- `text.keyaways.title`
- `text.keyaways.item1` 到 `text.keyaways.item3`

## 3. 核心指标看板 `data-section="kpi-metrics"`

- `text.kpi.card[N].title`
- `text.kpi.card[N].value`
- `text.kpi.card[N].sublabel`
- `text.kpi.card[N].subvalue`

## 4. 图表类分析模块

- 趋势分析：`chart-trend`，`text.trend.title`
- 结构占比：`chart-composition`，`text.composition.title`、`text.composition.innerLabel`、`text.composition.innerValue`、`text.composition.legend[1-3].label`、`text.composition.legend[1-3].value`
- 地域分布：`chart-geo`，`text.geo.title`、`text.geo.note`
- 用户画像：`chart-persona-radar`，`text.persona.title`、`text.persona.subtitle`
- 单位经济模型：`chart-unit-econ`，`text.unit.title`、`text.unit.legend.cac`、`text.unit.legend.ltv`
- 业务健康度矩阵：`chart-growth-matrix`，`text.matrix.title`、`text.matrix.subtitle`
- 市场份额：`chart-market-share`，`text.market.title`

## 5. 数据与进度类模块

- 漏斗转化：`text.funnel.title`，`text.funnel.step[1-3].label`、`.value`、`.note`
- 排行榜单：`text.leaderboard.title`，`text.leaderboard.row[1-5].name`、`.rev`、`.growth`
- 目标达成：`text.target.goal[1-3].label`、`.value`，以及第三个的 `.note`

## 6. 图文混合模块

- 资源投入：`text.resource.title`、`.subtitle`、`.value`、`.content`
- 风控指标：`text.risk.title`，`text.risk.item[1-3].label`、`.status`、`.value`
- 战略寄语：`text.insight.quote`、`text.insight.content`
