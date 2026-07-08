# Premium Midnight 模板槽位说明

模板 ID：`website-04-premium-midnight`

用途：高端 SaaS、空间资产管理、硬科技官网、政企汇报型产品页。

## 核心模块

1. `navbar`
   - `logo-name`
   - `nav-link-1` 到 `nav-link-4`
   - `nav-cta-text`

2. `hero`
   - `hero-badge`
   - `hero-title`
   - `hero-subtitle`
   - `hero-primary-cta`
   - `hero-secondary-cta`

3. `product-showcase`
   - `showcase-title`
   - `showcase-desc`
   - `showcase-tab-1` 到 `showcase-tab-3`
   - `dash-rate`
   - `dash-room-1`
   - `dash-room-2`
   - `dispatch-count`
   - `dispatch-item-1`
   - `dispatch-item-2`
   - `rev-total`
   - `rev-detail-1`
   - `rev-detail-2`

4. `value-prop`
   - `val-badge`
   - `val-title`
   - `val-desc`
   - `circle-outer-val`
   - `circle-outer-label`
   - `circle-mid-val`
   - `circle-mid-label`
   - `circle-inner-val`
   - `circle-inner-label`

5. `metrics`
   - `metrics-title`
   - `metrics-desc`
   - `bar-label-1` 到 `bar-label-5`
   - `bar-value-1` 到 `bar-value-5`
   - `bubble-main-val`
   - `bubble-main-label`
   - `bubble-sub1-val`
   - `bubble-sub1-label`
   - `bubble-sub2-val`
   - `bubble-sub2-label`

6. `architecture`
   - `arch-title`
   - `arch-desc`
   - `node-title-1`
   - `node-desc-1`
   - `node-title-2`
   - `node-desc-2`
   - `node-title-3`
   - `node-desc-3`

7. `problems-solutions`
   - `problem-title`
   - `problem-subtitle`
   - `problem-desc`
   - `card-title-1` 到 `card-title-4`
   - `card-desc-1` 到 `card-desc-4`

8. `cta`
   - `cta-title`
   - `cta-subtitle`
   - `cta-btn`

## 注入规则

1. 优先改写带 `data-slot` 且 `data-editable="true"` 的节点。
2. 不新增日间模式、主题切换、额外导航入口。
3. 如果缺少内容，保留模板默认文案，不写“未配置”。
4. 不新增内联颜色和新的样式体系。
