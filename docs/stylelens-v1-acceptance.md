# StyleLens v1 验收冻结

## 1. 冻结目标

StyleLens v1 的目标是把视觉提取从“风格总结”收口为“可验证的设计系统提取结果”。

本阶段冻结后，不再继续围绕单个网站发散修改。后续新增能力进入 v2。

## 2. 固定验收网站

v1 真实网站验收固定为 7 个：

1. https://rig.ai/
2. https://mindmarket.com/
3. https://topanga.io/
4. https://aneshk.design/
5. https://www.notion.com/
6. https://stripe.com/
7. https://linear.app/

## 3. 固定通过线

通过线固定为 `80/100`。

一个网站必须同时满足：

1. 风格提取质量门禁通过，且分数 `>= 80`。
2. 生成导出质量门禁通过，且分数 `>= 80`。
3. 第三方噪音不能进入核心颜色 token。
4. 按钮、导航、CTA 必须有可靠组件证据。
5. Markdown / Prompt / CSS / Tailwind / JSON 必须可用，不能有非法 token 或自相矛盾内容。

## 4. 固定检查项

v1 验收固定检查：

1. `semantic-color-evidence`：颜色必须有语义和证据。
2. `third-party-noise`：Cookie、聊天插件、广告等第三方样式不能污染核心 token。
3. `component-evidence`：按钮、导航、CTA 必须有证据。
4. `measured-coverage`：颜色、字体、圆角、间距、布局、组件覆盖度必须足够。
5. `evidence-confidence`：证据数量和置信度必须达标。
6. `export-readiness`：提取结果必须能支撑导出。
7. `generated-export-quality`：最终生成文件必须通过强校验。

## 5. 失败原因输出

低于 80 分或任一门禁失败时，必须输出失败原因。

失败原因至少包含：

1. `checkId`
2. `label`
3. `severity`
4. `message`

其中 `severity` 只能是：

1. `blocking`：阻断 v1 验收。
2. `warning`：需要提示用户但不一定阻断普通分析。

## 6. 已冻结能力

v1 已冻结以下能力：

1. 第三方噪音过滤。
2. 颜色语义归因。
3. 组件证据识别。
4. CTA 主次语义归因。
5. 字体语义归因。
6. 布局语义归因。
7. 端到端导出质量门禁。
8. 真实 7 站验收基线。

## 7. v1 边界

v1 冻结后不再继续无限改。

后续提升应作为 v2，重点包括：

1. 增加更多网站类型样本。
2. 增加视觉截图聚类与 DOM 证据交叉验证。
3. 增加更细的组件类型，例如表单、价格卡、产品截图、标签。
4. 增加用户界面的失败原因可视化。
