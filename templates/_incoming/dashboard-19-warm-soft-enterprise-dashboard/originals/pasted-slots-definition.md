# 模板槽位与数据注入说明

## 内容模块说明

保持 4 个核心模块结构：

- `key-takeaway`
- `core-finding-1`
- `core-finding-2`
- `core-finding-3`

## 图表槽位与 Excel/CSV 注入注意事项

注入图表数据时，ECharts 渲染器已更新为暖色调色板，无需后端更改数据结构，只需注入数值即可。

| 模块容器 ID | 图表类型 | 适合分析的数据维度 |
| --- | --- | --- |
| `chart-kpi-[1-4]` | `kpi` | 核心指标。KPI 卡片强调色条为暖黄/橙/红/青。 |
| `chart-trend-area` | `area` | 趋势分析。使用暖黄色渐变填充。 |
| `chart-mix-donut` | `donut` | 占比分析。使用暖色系多色组合。 |
| `chart-rank-bar` | `horizontal-bar` | 排名。使用暖橙色渐变条形。 |
| `chart-funnel` | `funnel` | 转化漏斗。使用暖色阶梯过渡。 |

视觉适配提醒：注入的数据文案应尽量保持简洁、积极的语调，以契合整体温暖的视觉氛围。
