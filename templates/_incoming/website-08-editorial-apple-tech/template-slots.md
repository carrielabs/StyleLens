# Editorial Apple-Tech 官网模板槽位说明

模板 ID：`website-08-editorial-apple-tech`

用途：高端 SaaS、开发者工具、AI 工作流、企业级协作平台、技术基础设施产品官网。

## 核心模块

1. `header`
   - `text.header.logo`
   - `text.header.nav.1` 到 `text.header.nav.7`

2. `hero`
   - `text.hero.title`
   - `text.hero.subtitle`
   - `text.hero.cta`
   - `text.hero.github`

3. `problem`
   - `text.problem.quote`
   - `text.problem.desc`

4. `solution`
   - `text.solution.tag`
   - `text.solution.title`
   - `text.solution.desc`
   - `text.highlight.1.title` / `text.highlight.1.desc`
   - `text.highlight.2.title` / `text.highlight.2.desc`
   - `text.highlight.3.title` / `text.highlight.3.desc`

5. `business-flow`
   - `text.flow.title`
   - `text.flow.desc`

6. `features`
   - `text.feature.1.title` / `text.feature.1.desc`
   - `text.feature.2.title` / `text.feature.2.desc`

7. `product-visuals`
   - `text.visuals.title`
   - `text.visuals.placeholder`

8. `target-users`
   - `text.users.title`
   - `text.users.1.role` / `text.users.1.desc`
   - `text.users.2.role` / `text.users.2.desc`
   - `text.users.3.role` / `text.users.3.desc`

9. `use-cases`
   - `text.cases.tag`
   - `text.cases.title`
   - `text.cases.desc`
   - `text.cases.tab.1` 到 `text.cases.tab.4`

10. `workflow`
    - `text.workflow.tag`
    - `text.workflow.title`
    - `text.workflow.1.title` / `text.workflow.1.desc`
    - `text.workflow.2.title` / `text.workflow.2.desc`
    - `text.workflow.3.title` / `text.workflow.3.desc`

11. `metrics`
    - `text.metric.1.value` / `text.metric.1.label`
    - `text.metric.2.value` / `text.metric.2.label`
    - `text.metric.3.value` / `text.metric.3.label`
    - `text.metric.4.value` / `text.metric.4.label`

12. `pricing`
    - `text.pricing.title`
    - `text.pricing.1.name` / `text.pricing.1.desc` / `text.pricing.1.price`
    - `text.pricing.1.f1` 到 `text.pricing.1.f3`
    - `text.pricing.2.name` / `text.pricing.2.desc` / `text.pricing.2.price`
    - `text.pricing.2.f1` 到 `text.pricing.2.f3`

13. `footer`
    - `text.footer.slogan`
    - `text.footer.social.email`
    - `text.footer.social.wechat`
    - `text.footer.social.xhs`
    - `text.footer.social.twitter`
    - `text.footer.copyright`

## 入库校验

- 实际 HTML 共 80 个 `data-slot`。
- 80 个可编辑节点均同时具备 `data-editable="true"`、`contenteditable="true"` 和 `data-slot`。
- `chart-business-flow` 为业务拓扑画布容器，由模板内 JS 绘制。
- 入库版已移除 GitHub、Twitter、示例邮箱等假外链，链接可在生成后人工编辑。
