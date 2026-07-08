# VoltFlow 精益赛博 SaaS 官网模板槽位说明

模板 ID：`website-05-voltflow-cyber-saas`

用途：内容自动化、数据监控、开发者工具、增长型 SaaS 官网。

## 核心模块

1. `header`
   - `logo-tag`
   - `version-tag`
   - `nav-link-1` 到 `nav-link-4`
   - `header-roi-link`
   - `header-cta-text`

2. `hero`
   - `hero-badge`
   - `hero-title`
   - `hero-desc`
   - `hero-primary-cta`
   - `hero-secondary-cta`
   - `hero-stats-value-1` 到 `hero-stats-value-3`
   - `hero-stats-label-1` 到 `hero-stats-label-3`

3. `live-preview`
   - `live-preview-title`
   - `demo-tab-text-1` 到 `demo-tab-text-3`
   - `demo-side-title`
   - `demo-ring-pct`
   - `demo-metric-like-rate`
   - `demo-metric-follow-rate`

4. `problem`
   - `problem-title`
   - `problem-card-title-1` 到 `problem-card-title-3`
   - `problem-card-desc-1` 到 `problem-card-desc-3`

5. `features`
   - `features-title`
   - `features-desc`
   - `feature-title-1` 到 `feature-title-4`
   - `feature-card-desc-1` 到 `feature-card-desc-4`
   - `feature-tech-label-1` 到 `feature-tech-label-4`

6. `architecture`
   - `architecture-title`
   - `architecture-desc`
   - `step-num-1` 到 `step-num-4`
   - `step-title-1` 到 `step-title-4`
   - `step-desc-1` 到 `step-desc-4`

7. `calculator`
   - `calculator-title`
   - `calc-impressions`
   - `calc-ctr`
   - `calc-ltv`
   - `calc-res-views`
   - `calc-res-revenue`

8. `proof`
   - `proof-retention-title`
   - `proof-retention-data-1` 到 `proof-retention-data-2`
   - `proof-quote-text-1` 到 `proof-quote-text-2`
   - `proof-author-info-1` 到 `proof-author-info-2`

9. `pricing`
   - `pricing-title`
   - `price-tier-title-1` 到 `price-tier-title-3`
   - `price-pro-cost`
   - `price-pro-unit`
   - `price-enterprise-cost`
   - `price-enterprise-unit`
   - `price-feature-list-1` 起
   - `price-tier-cta-1` 到 `price-tier-cta-3`

10. `cta`
   - `cta-title`
   - `cta-desc`
   - `cta-button-text`

11. `footer`
   - `footer-logo-tag`
   - `footer-description`
   - `social-links-1` 到 `social-links-3`
   - `footer-link-1` 起
   - `copyright-text`

## 注入规则

1. 所有可编辑文本节点都必须带 `data-editable="true"` 和 `data-slot`。
2. 自动生成页优先替换 `hero`、`problem`、`features`、`architecture`、`cta` 和 `footer`。
3. 如果没有结构化定价、客户见证或 ROI 参数，不要编造数据；生成逻辑可以隐藏这些强数据模块。
4. 模板原生交互保留在 `template.html` 内，不依赖构建工具。
