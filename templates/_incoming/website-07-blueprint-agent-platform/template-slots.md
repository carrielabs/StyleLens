# Blueprint Agent Platform 官网模板槽位说明

模板 ID：`website-07-blueprint-agent-platform`

用途：企业级 AI 基础设施、智能体平台、大模型网关、开发者工具、硬核底层技术产品官网。

## 核心模块

1. `nav`
   - `nav.logo`
   - `nav.link1` 到 `nav.link4`

2. `hero`
   - `text.hero.bg_letters`
   - `text.hero.badge`
   - `text.hero.title`
   - `text.hero.subtitle`
   - `text.hero.btn_primary`
   - `text.hero.btn_secondary`

3. `metrics`
   - `text.metrics.m1_val` 到 `text.metrics.m4_val`
   - `text.metrics.m1_desc` 到 `text.metrics.m4_desc`

4. `target_users`
   - `text.target.subtitle`
   - `text.target.section_title`
   - `text.target.role1_name` 到 `text.target.role3_name`
   - `text.target.role1_desc` 到 `text.target.role3_desc`

5. `problem`
   - `text.problem.subtitle`
   - `text.problem.section_title`
   - `text.problem.item1_title` 到 `text.problem.item3_title`
   - `text.problem.item1_desc` 到 `text.problem.item3_desc`

6. `solution`
   - `text.solution.subtitle`
   - `text.solution.section_title`
   - `text.solution.section_desc`
   - `text.solution.item1_title` 到 `text.solution.item3_title`
   - `text.solution.item1_desc` 到 `text.solution.item3_desc`

7. `highlights`
   - `text.highlights.section_title`
   - `text.highlights.item1_title` 到 `text.highlights.item4_title`
   - `text.highlights.item1_desc` 到 `text.highlights.item4_desc`

8. `workflow`
   - `text.workflow.subtitle`
   - `text.workflow.section_title`
   - `text.workflow.step1_title` 到 `text.workflow.step3_title`
   - `text.workflow.step1_desc` 到 `text.workflow.step3_desc`

9. `business_flow`
   - `text.flow.section_title`
   - `text.flow.step1_name` 到 `text.flow.step4_name`
   - `text.flow.step1_desc` 到 `text.flow.step4_desc`

10. `features_visuals`
    - `text.features.subtitle`
    - `text.features.section_title`
    - `text.features.desc`
    - `text.features.point1` 到 `text.features.point3`
    - `text.visual.ui_title`

11. `use_cases`
    - `text.cases.section_title`
    - `text.cases.case1_title` 到 `text.cases.case3_title`
    - `text.cases.case1_desc` 到 `text.cases.case3_desc`
    - `text.cases.case1_tags` 到 `text.cases.case3_tags`

12. `roadmap`
    - `text.roadmap.section_title`
    - `text.roadmap.q1_time` 到 `text.roadmap.q3_time`
    - `text.roadmap.q1_task1`、`text.roadmap.q1_task2`
    - `text.roadmap.q2_task1`、`text.roadmap.q2_task2`
    - `text.roadmap.q3_task1`、`text.roadmap.q3_task2`

13. `social`
    - `text.social.section_title`
    - `text.social.stat1_val` 到 `text.social.stat3_val`
    - `text.social.stat1_desc` 到 `text.social.stat3_desc`
    - `text.social.quote_text`
    - `text.social.quote_author`

14. `pricing`
    - `text.pricing.section_title`
    - `text.pricing.tier1_name` 到 `text.pricing.tier3_name`
    - `text.pricing.tier1_price` 到 `text.pricing.tier3_price`
    - `text.pricing.tier1_f1` 到 `text.pricing.tier3_f3`

15. `cta` 和 `footer`
    - `text.cta.title`
    - `text.cta.btn`
    - `text.footer.copyright`
    - `text.footer.link1` 到 `text.footer.link4`

## 注入规则

1. 自动生成页优先替换 `nav`、`hero`、`problem`、`solution`、`highlights`、`workflow`、`business_flow`、`cta` 和 `footer`。
2. 没有真实数据时，不编造企业级 QPS、SLA、客户数、社区数、价格和路线图。
3. 数据、社区、价格、路线图等强事实模块可在生成页中隐藏或保留默认模板文案，由人工后续编辑。
4. 生成页存在 AHP 运行时时，页面内编辑由统一编辑器接管。
