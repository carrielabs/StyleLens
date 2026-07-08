# StyleLens 提取增强与报告增强设计方案

**目标**

在不推翻现有链路的前提下，同时提升两件事：

1. 风格识别更准
2. 报告展示更有价值

核心原则：

- 先复用现有 `screenshot -> pageAnalysis -> aiExtract -> report` 主链路
- 先做最小高收益改动，不大改协议，不重构首页总装配
- 先把“可稳定支撑展示”的基础提取增强做到位，再快速放大报告价值

## 现状判断

当前项目已经具备较强基础：

- `lib/api/screenshotter.ts`
  负责 Playwright 打开页面、截图、同页调用 DOM 分析
- `lib/api/pageAnalyzer.ts`
  已能产出颜色、字体、圆角、阴影、间距、边框、交互态、组件快照、页面分区等结构化结果
- `lib/api/aiExtract.ts`
  会把 `pageAnalysis` 与截图一起喂给 AI，并把测量信号作为约束
- `components/report/DesignInspector.tsx`
  已能消费部分结构化结果，但大量已有数据还没真正转成高价值展示

当前最大问题不是“完全识别不到”，而是：

- 采样覆盖不够广：当前主要是单次桌面视口采样
- 交互态和多断点信息还不够稳定
- 报告层对现有数据的消费不足
- 缺少统一的可信度、覆盖度、设计一致性、可访问性视图

## 方案方向

### 方案 A：只做提取增强

优点：

- 底层更扎实
- 后续展示空间更大

缺点：

- 用户短期感知不强
- 需要等提取链路完成后才能看到价值

### 方案 B：只做展示增强

优点：

- 用户立刻能感知产品变强
- 改动主要集中在报告层，风险较低

缺点：

- 如果底层采样覆盖不够，部分展示会建立在不稳定数据上

### 方案 C：基础提取增强 + 报告增强并行推进

优点：

- 最符合当前项目状态
- 能复用已有结构化能力
- 用户可以在短期内看到明显价值提升
- 工程风险可控

缺点：

- 需要先冻结共享类型与输出契约
- 多条线并行时必须严格控制文件边界

**推荐：方案 C**

原因：

- 现有提取链路已经有足够基础，不需要先重写底层
- 报告层现在有明显“数据已存在但没展示出来”的空间
- 同时推进，收益最大，且能拆成独立任务给多个 subagent

## 目标架构

保持现有四段式主链路不变：

1. `app/api/screenshot/route.ts`
2. `lib/api/screenshotter.ts`
3. `lib/api/pageAnalyzer.ts` / `lib/api/heroVisualAnalyzer.ts`
4. `lib/api/aiExtract.ts`

在这条主链路上做增量增强：

- 在 `screenshotter` 层引入多断点采样聚合
- 在 `pageAnalyzer` 层稳定交互态 token
- 在 `aiExtract` 层强化“优先使用测量信号”的 prompt 约束
- 在 `DesignInspector` / `StyleReport` 层放大已有结构化结果
- 后续新增独立 audit 数据层，承接 `css-analyzer`、`axe-core/playwright`、`Lighthouse`

## 范围定义

### 第一阶段必须做

#### 提取更准

- 多断点采样：先做 `desktop + mobile`
- 稳定 `hover / focus / active` 交互态 token
- 保持输出仍为单个聚合后的 `pageAnalysis`
- 继续保留 desktop 主截图，避免前端协议大改

#### 展示更有价值

- 新增证据可信度摘要
- 新增分析覆盖度说明
- 新增交互与动效总结
- 新增页面结构总览
- 导出同步补充部分已有结构化数据

### 第二阶段再做

- 候选池详情视图
- `css-analyzer`
- `axe-core/playwright`
- `Lighthouse`
- 图片场景结构增强适配层

### 第三阶段再做

- tablet 断点
- 多页面模板采样
- 图片场景接入 OmniParser 或 deki

## 详细设计

### 一、提取增强设计

#### 1. 多断点采样

入口：

- `lib/api/screenshotter.ts`

设计：

- 在同一个浏览器会话中切换两个 viewport
- 每个 viewport 都调用 `analyzePageStylesFromPage`
- 最终返回一个聚合后的 `pageAnalysis`

约束：

- 第一阶段不改 `app/api/extract/route.ts` 入参结构
- 第一阶段不在前端展示多张截图
- 聚合重点放在：
  - `typographyTokens`
  - `radiusTokens`
  - `shadowTokens`
  - `spacingTokens`
  - `layoutEvidence`
  - `stateTokens`
  - `pageSections`
  - `viewportSlices`

#### 2. 交互态稳定化

入口：

- `lib/api/pageAnalyzer.ts`

设计：

- 不另起“交互态截图链路”
- 继续使用 `stateTokens`
- 优化目标元素筛选和去噪
- 保留 `default / hover / focus / active`

第一阶段不做：

- 大规模状态截图产物
- 新的复杂交互协议

#### 3. 图片增强适配位

入口：

- `lib/api/aiExtract.ts`

设计：

- 把现有 `mergeScreenshotColorSignals` 所在阶段抽象成“截图增强阶段”
- 后续 OmniParser / deki 作为这个阶段的新增信号来源
- URL 场景下作为 `pageAnalysis` 的补充
- 图片场景下作为 `pageAnalysis` 的替代上游

这样可以避免未来接模型时重写主链路。

### 二、报告增强设计

#### 1. 证据可信度摘要

入口：

- `components/report/DesignInspector.tsx`

展示内容：

- 各类 token 来自 DOM 实测、截图采样、AI 推断的比例
- 关键结论的可信度标签
- 当前报告哪些结论更可信，哪些是 fallback

价值：

- 解决“这条结果我能不能信”的问题

#### 2. 分析覆盖度说明

入口：

- `components/report/StyleReport.tsx`
- `components/report/DesignInspector.tsx`

展示内容：

- 是否 URL 实测
- 是否读取到 CSS
- 样式源数量
- 哪些结果来自 AI fallback

价值：

- 降低误解
- 帮用户判断为什么某些结果不完整

#### 3. 交互与动效总结

入口：

- `components/report/DesignInspector.tsx`

展示内容：

- `stateTokens`
- `transitionTokens`
- `interactionStyle`

价值：

- 从“静态视觉报告”升级成“界面行为报告”

#### 4. 页面结构总览

入口：

- `components/report/DesignInspector.tsx`

展示内容：

- 页面段落数量
- CTA 段数量
- 是否含图片
- 主列数
- 最大内容宽度

价值：

- 对落地设计和模仿复刻都更有用

#### 5. 导出增强

入口：

- `lib/exporters/markdownExporter.ts`
- `lib/exporters/jsonExporter.ts`

展示内容：

- 页面结构
- 交互 token
- 证据来源
- 覆盖度摘要

价值：

- 把报告价值同步到导出，不只停留在页面展示

### 三、外部能力接入设计

#### 1. css-analyzer

定位：

- 数据生产层

承载字段：

- 建议新增到 `PageStyleAnalysis` 的独立 audit 区块

用途：

- 颜色数量
- 字号数量
- 阴影数量
- 圆角数量
- 动效时长数量
- 一致性诊断

#### 2. axe-core/playwright

定位：

- 抓取/审计层

用途：

- 对比度问题
- 可访问性问题
- 语义结构问题

#### 3. Lighthouse

定位：

- 页面级诊断层

用途：

- 总体质量评分
- 机会项摘要

### 四、共享契约设计

第一阶段必须先冻结共享契约。

核心文件：

- `lib/types/index.ts`
- `lib/flags.ts`

原则：

- 所有新增数据都走结构化字段
- 不把审计结果硬塞进 `designDetails` 文本字段
- 报告层只消费结构化结果，不在组件里写分析逻辑

## 并行实施边界

### 串行阶段

1. 共享契约冻结
2. 最终集成收口

### 可并行阶段

- 后端提取链路
- AI 汇总链路
- 提取交互 UI
- 报告展示层

## 风险

### 风险 1

`app/page.tsx` 是总装配点，不能让多个 worker 同时改。

### 风险 2

`lib/types/index.ts` 是共享边界，必须先冻结。

### 风险 3

`lib/api/aiExtract.ts` 同时依赖 AI、截图、页面分析结果，联调阶段容易卡。

### 风险 4

如果第一阶段就引入太多外部库，容易把简单问题复杂化。

## 不做的事

第一阶段明确不做：

- 大范围重构首页
- 改造为多截图前端协议
- 接入重型图片理解模型
- 把所有外部审计库一次性接完

## 成功标准

### 提取侧

- 同一页面在桌面与移动场景下的结构 token 更稳定
- 交互态 token 可稳定产出
- AI 总结对测量信号依赖更强，少靠猜

### 展示侧

- 用户能知道哪些结论可信
- 用户能看出页面结构和交互动效
- 导出内容比现在更完整

### 工程侧

- 不引入大范围重构
- 任务可拆给多个 subagent 并行执行
- 最终只需一个收口任务整合首页
