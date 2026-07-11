# Template Slots

## `data-section="page-title"`

- 报告主标题。
- 报告周期与摘要说明。

## `data-section="key-takeaways"`

- 核心高管洞察。
- 支持替换标题和三条总结 bullet。

## `data-section="kpi-overview"`

- 4 个核心指标卡片。
- 当前包含 ARR、NDR、CAC Payback、Churn。

## `data-section="ndr-trend"`

- NDR 净收入留存趋势图。
- 包含 Upsell 和 Cross-sell 洞察。

## `data-section="product-penetration"`

- 产品渗透率矩阵。
- 包含核心壁垒和资产清理说明。

## `data-section="customer-health"`

- 客户成功健康度。
- 包含 QBR 覆盖率、NPS 和服务模型表格。

## `data-section="ai-empowerment"`

- AI 赋能人效分析。
- 用 HTML/CSS 进度条展示 Before / After。

## `data-section="system-stability"`

- 系统稳定性与 SLA。
- 包含 SLA 折线图、MTTR 和峰值 QPS。

## `data-section="private-domain-growth"`

- 私域增长与客单价。
- 包含私域人数、转化率、ARPU、复购率和 LTV。

## `data-section="viral-k-factor"`

- 裂变效应与 K-factor。

## `data-section="content-marketing"`

- 内容营销资产。
- 包含新增流量和长尾存量趋势。

## `data-section="customer-stratification"`

- KA 与 SMB 客户分层对比。

## `data-section="channel-roi"`

- ROI 投资效能矩阵。

## 数据注入说明

- 文本替换：查找 `data-slot` 或 `data-editable="true"`。
- 图表替换：修改底部 ECharts `setOption` 配置。
- 顶部菜单已删除，不再提供 `header-nav` 槽位。
