# BLUE SHIFT 官网模板槽位说明

模板 ID：`website-09-blue-shift-portfolio`

用途：建筑事务所、空间设计、展览装置、硬件设计、先锋创意工作室和高端数字作品集官网。

## 核心模块

1. `navbar`
   - `text.navbar.01`：品牌 Logo 文本

2. `hero`
   - `text.hero.01`：行业定位描述
   - `text.hero.02`：主标题
   - `text.hero.03`：概念性前言文本
   - `text.hero.04` 到 `text.hero.06`：首屏底部元数据与滚动提示

3. `philosophy`
   - `text.philosophy.01`：模块编号
   - `text.philosophy.02`：品牌哲学宣言
   - `text.philosophy.03` 到 `text.philosophy.08`：三组精密数据说明

4. `works`
   - `text.works.01`：模块编号
   - `text.works.02` 到 `text.works.21`：建筑、展览、产品分类标题、说明、项目标题和地理时间元数据

5. `methodology`
   - `text.methodology.01`：模块编号
   - `text.methodology.02`：工作流标题
   - `text.methodology.03`：工作流前言
   - `text.methodology.04` 到 `text.methodology.12`：三阶段参数化技术管线卡片

6. `metrics`
   - `text.metrics.01`：模块编号
   - `text.metrics.02`：动态数据标题
   - `text.metrics.03`：指标说明
   - `text.metrics.04` 到 `text.metrics.15`：四组 SVG 折线与仪表指标文案

7. `milestones`
   - `text.milestones.01`：模块编号
   - `text.milestones.02`：大事记标题
   - `text.milestones.03` 到 `text.milestones.14`：年份、荣誉文本、地理位置元数据

8. `contact`
   - `text.contact.01`：模块编号
   - `text.contact.02`：唤醒词
   - `text.contact.03`：联系说明
   - `text.contact.04` 到 `text.contact.08`：邮箱、电话、地址和版权信息标签

## 侧边元数据

- `text.sidebar-left-top.01`
- `text.sidebar-left-bottom.01`
- `text.sidebar-right-top.01`
- `text.sidebar-right-bottom.01`

## 注入规则

1. 模板共有 89 个可编辑节点，均包含 `data-editable="true"`、`contenteditable="true"`、`data-slot` 和 `data-key`。
2. 自动生成页优先替换 `navbar`、`hero`、`philosophy`、`works`、`methodology`、`metrics`、`milestones` 和 `contact` 的文本槽位。
3. 作品卡片和方法论卡片的 `onclick="openDetailModal(...)"` 保留为模板交互能力。
4. 预览、编辑、导出和持久化由平台运行时接管，模板只提供视觉结构和可编辑标记。
