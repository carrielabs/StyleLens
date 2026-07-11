# Template Slots

## `data-section="page-title"`

- 页面主标题。
- 报告周期与核心论点总结。

## `data-section="key-takeaways"`

- 高管摘要洞察。
- 支持替换标题和三条结论性 bullet。

## `data-section="kpi-overview"`

- 4 个核心指标卡片。
- 当前包含 ARR、NDR、CAC Payback、Churn。

## `data-section="ndr-trend"`

- NDR 净收入留存趋势图。
- 右侧包含 Upsell 和 Cross-sell 洞察说明。

## `data-section="product-penetration"`

- 产品渗透率矩阵。
- 包含核心壁垒和资产清理两组洞察。

## `data-section="customer-health"`

- CS 客户成功健康度。
- 包含 QBR 覆盖率、NPS 趋势和客户服务模型表格。

## `data-section="ai-empowerment"`

- AI 赋能人效分析。
- 使用 HTML/CSS 进度条展示 Before / After 对比。

## `data-section="system-stability"`

- 系统稳定性与 SLA。
- 包含 SLA 折线图、MTTR 和峰值 QPS 指标。

## `data-section="private-domain-growth"`

- 私域增长与客单价。
- 包含用户规模、转化率、ARPU、复购率和 LTV。

## `data-section="viral-k-factor"`

- 裂变效应与 K-factor。
- 用于展示裂变阈值、获客成本和质量判断。

## `data-section="content-marketing"`

- 内容营销资产库。
- 用于展示新增流量、长尾存量和线索成本洞察。

## `data-section="customer-stratification"`

- 客户分层分析。
- 当前为 KA vs SMB 双侧对比图和策略卡片。

## `data-section="channel-roi"`

- 渠道 ROI / 投资效能矩阵。
- 横轴价值区，纵轴 ROI 回报率，气泡大小代表投入金额。

## 数据注入说明

- 文本替换：查找 `data-editable="true"` 或 `data-slot`。
- 图表替换：修改底部 `initCharts()` 内对应 ECharts option。
- 原始说明提到但当前 HTML 未实际提供的模块：`churn-analysis`、`sales-funnel`、`unit-economics`、`cost-breakdown`。
