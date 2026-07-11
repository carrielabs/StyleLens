# StayInn 数据大盘 Excel 字段映射契约

## `data-section="kpi-grid"`

| 槽位别名 | 物理指标意义 | 默认初始值 | 同/环比槽位别名 |
| :--- | :--- | :--- | :--- |
| `kpi-revenue` | 期间总营收 | `¥1,842,900` | `kpi-revenue-trend` |
| `kpi-adr` | 平均每日房价 ADR | `¥480.00` | `kpi-adr-trend` |
| `kpi-occupancy` | 平均入住率 | `88.4%` | `kpi-occupancy-trend` |
| `kpi-revpar` | 每间可售客房收入 RevPAR | `¥424.30` | `kpi-revpar-trend` |

## `data-section="trends-and-channels"`：营收趋势图

趋势数据绑定在 `.trend-point` 节点上：

- `data-date`：悬浮日期，例如 `12月28日`
- `data-revenue`：每日实收数值，例如 `¥89,400`
- `data-occupancy`：当日实入占比，例如 `95.2%`

## `data-section="trends-and-channels"`：同心圆环

圆环段绑定在 `.ring-segment` 节点上：

- `data-segment-name`：渠道名称，例如 `餐饮与零售增值`
- `data-segment-value`：结算绝对金额，例如 `¥276,435`
- `data-segment-ratio`：占比百分比，例如 `15%`

## `data-section="occupancy-heatgrid"`

31 个微型网格单元绑定在 `.group/cell` 节点上：

- `data-day`：天数数字，范围 `1 - 31`
- `data-occ`：当日入住占比，例如 `99.4%`
- `data-tag`：当日微型诊断事件标签，例如 `圣诞平安夜超级爆满`

## `data-section="trends-and-channels"`：价格弹性散点气泡

散点元素绑定在 `.scatter-point` 节点上：

- `data-room`：房间实体名称，例如 `行政大床套房 202`
- `data-price`：结算价格，对应 X 轴比例位置
- `data-occ`：期间占有率，对应 Y 轴比例位置
- `data-rev`：该空间产生的总营收金额

## `data-section="trends-and-channels"`：空间五维运营健康雷达

5 个顶点元素绑定在 `.radar-vertex` 节点上：

- `data-name`：评估维度名称，例如 `资金流速 (Cash Velocity)`
- `data-score`：健康分数，例如 `88.5 分`
- `data-desc`：该维度的自动化诊断分析文本

## `data-section="ai-insights"`

- `insight-alert-badge`：核心警报数量标签
- `insight-title-1`：洞察 1 标题
- `insight-desc-1`：洞察 1 内容
- `insight-title-2`：洞察 2 标题
- `insight-desc-2`：洞察 2 内容
