# StyleLens Extraction & Report Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持现有主链路稳定的前提下，先完成基础提取增强与高价值报告增强，并为后续外部审计能力预留结构化扩展位。

**Architecture:** 先冻结共享类型与 feature flag，再并行推进四条独立工作线：后端提取增强、AI 汇总增强、提取流程 UI、报告展示与导出。最后由单一集成任务收口首页总装配，避免冲突集中到 `app/page.tsx`。

**Tech Stack:** Next.js 15、React 19、TypeScript、Playwright、Vitest、现有 Gemini/截图分析链路

---

## 文件结构与所有权

### 共享契约

- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/types/index.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/flags.ts`

### 后端提取链路

- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/screenshot/route.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/screenshotter.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/heroVisualAnalyzer.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.semanticColorSystem.test.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/heroVisualAnalyzer.test.ts`

### AI 汇总链路

- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/extract/route.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.test.ts`

### 提取流程 UI

- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/hooks/useExtraction.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/ImageUploader.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeWorkspace.tsx`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.test.tsx`

### 报告与导出

- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleReport.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/DesignInspector.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleInspector.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/Typography.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/markdownExporter.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/jsonExporter.ts`

### 最终集成收口

- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/page.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeOverlays.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeSidebar.tsx`

## 任务拆分

### Task 1: 冻结共享契约与开关

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/types/index.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/flags.ts`

- [ ] **Step 1: 盘点现有类型与新增字段边界**

检查以下对象的新增空间，只允许增量扩展，不重命名现有核心字段：

- `PageStyleAnalysis`
- `StyleReport`
- 审计结果新增对象
- 可信度/覆盖度摘要对象

运行：

```bash
sed -n '1,420p' /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/types/index.ts
```

Expected: 能清楚看到 `PageStyleAnalysis`、`StyleReport`、`DesignDetails` 定义。

- [ ] **Step 2: 定义第一阶段新增结构**

新增目标：

- `AnalysisCoverageSummary`
- `EvidenceSummary`
- `InteractionSummary`
- `PageAuditSummary` 占位结构

要求：

- 不把新字段塞进 `designDetails` 文本字段
- 统一挂到 `PageStyleAnalysis` 或 `StyleReport`

- [ ] **Step 3: 新增 feature flag**

在 `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/flags.ts` 中增加面向报告增强与 audit 占位的开关，至少包含：

- `ENABLE_REPORT_EVIDENCE_SUMMARY`
- `ENABLE_REPORT_COVERAGE_SUMMARY`
- `ENABLE_REPORT_INTERACTION_SUMMARY`
- `ENABLE_PAGE_AUDITS`

- [ ] **Step 4: 类型检查**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/types/index.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/flags.ts
git commit -m "feat: add report and audit contract types"
```

### Task 2: 多断点采样聚合

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/screenshotter.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/screenshot/route.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts`

- [ ] **Step 1: 写失败测试或测试用例清单**

为“聚合后的 `pageAnalysis` 仍返回单对象”补测试，重点验证：

- 有 `pageSections`
- 有 `stateTokens`
- 有 `viewportSlices`
- 仍只返回一张主截图

Run:

```bash
sed -n '1,220p' /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts
```

Expected: 能定位现有集成测试结构。

- [ ] **Step 2: 在 screenshotter 引入 viewport 计划**

在 `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/screenshotter.ts` 内定义第一阶段断点集：

```ts
const ANALYSIS_VIEWPORTS = [
  { id: 'desktop', width: 1280, height: 960 },
  { id: 'mobile', width: 390, height: 844 },
]
```

要求：

- desktop 仍负责主截图
- mobile 只参与 `pageAnalysis`

- [ ] **Step 3: 聚合多次 analyzePageStylesFromPage 结果**

实现方式：

- 在同一个浏览器会话中依次设置 viewport
- 每次调用 `analyzePageStylesFromPage`
- 聚合结果时优先保留结构化 token，而不是改动 API 形态

重点字段：

- `typographyTokens`
- `radiusTokens`
- `shadowTokens`
- `spacingTokens`
- `layoutEvidence`
- `stateTokens`
- `pageSections`
- `viewportSlices`

- [ ] **Step 4: 回归测试**

Run:

```bash
npx vitest run /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/screenshotter.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/screenshot/route.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts
git commit -m "feat: aggregate page analysis across viewports"
```

### Task 3: 交互态 token 稳定化

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts`

- [ ] **Step 1: 锁定交互态采样入口**

Run:

```bash
rg -n "collectInteractiveStateSignals|stateTokens|hover|focus|active" /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.ts
```

Expected: 能定位交互态采样与合并位置。

- [ ] **Step 2: 优化采样筛选与去噪**

修改原则：

- 优先主按钮、主要链接、输入框
- 降低隐藏元素、装饰元素噪音
- `focus-visible` 可单独保留到 `focus`
- 微调 `active` 前后等待，不新增截图产物

- [ ] **Step 3: 验证结构未变**

Run:

```bash
npx vitest run /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/pageAnalyzer.integration.test.ts
git commit -m "fix: stabilize interactive state token extraction"
```

### Task 4: AI 汇总优先吃测量信号

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/extract/route.ts`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.test.ts`

- [ ] **Step 1: 先补测试约束**

测试目标：

- `pageAnalysis` 存在时，prompt 中必须包含：
  - `stateTokens`
  - `pageSections`
  - `viewportSlices`
  - 测量信号优先使用规则

Run:

```bash
sed -n '1,260p' /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.test.ts
```

Expected: 能看到现有测试结构和可扩展点。

- [ ] **Step 2: 强化 prompt**

改动点：

- 明确要求优先使用 `pageAnalysis`
- 强化对交互态和页面结构的利用
- 明确截图只做补充，不做主判断

- [ ] **Step 3: 抽象截图增强阶段接口**

要求：

- 不立即接 OmniParser / deki
- 先把 `mergeScreenshotColorSignals` 所在阶段抽象成可扩展函数边界

- [ ] **Step 4: 测试**

Run:

```bash
npx vitest run /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/extract/route.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.test.ts
git commit -m "feat: prioritize measured page signals in ai extraction"
```

### Task 5: 报告页新增可信度与覆盖度

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleReport.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/DesignInspector.tsx`

- [ ] **Step 1: 读取共享契约**

Run:

```bash
sed -n '1,220p' /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleReport.tsx
sed -n '1,260p' /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/DesignInspector.tsx
```

Expected: 能定位主报告入口和 inspector 内容区。

- [ ] **Step 2: 新增可信度摘要模块**

展示至少包含：

- DOM 实测占比
- 截图采样占比
- AI 推断占比
- 关键结论可信度标签

- [ ] **Step 3: 新增覆盖度说明模块**

展示至少包含：

- 是否 URL 实测
- 是否有 CSS 文本
- 样式源数量
- 是否存在 fallback

- [ ] **Step 4: 手动检查样式与布局**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleReport.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/DesignInspector.tsx
git commit -m "feat: add report evidence and coverage summary"
```

### Task 6: 报告页新增交互与页面结构总览

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/DesignInspector.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleInspector.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/Typography.tsx`

- [ ] **Step 1: 复用现有字段，不新增分析逻辑**

使用字段：

- `stateTokens`
- `transitionTokens`
- `interactionStyle`
- `pageSections`
- `gridColumns`
- `pageMaxWidth`

- [ ] **Step 2: 新增交互与动效版块**

展示至少包含：

- 常见交互态
- 主要动效时长
- 过渡风格
- 动效气质总结

- [ ] **Step 3: 新增页面结构总览版块**

展示至少包含：

- 页面段数
- CTA 段数
- 含图段数
- 主列信息
- 最大内容宽度

- [ ] **Step 4: 类型检查**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/DesignInspector.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleInspector.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/Typography.tsx
git commit -m "feat: add report interaction and structure summary"
```

### Task 7: 导出补齐结构化结果

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/markdownExporter.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/jsonExporter.ts`

- [ ] **Step 1: 盘点现有 exporter 漏掉的数据**

重点检查：

- `stateTokens`
- `transitionTokens`
- `pageSections`
- 可信度摘要
- 覆盖度摘要

Run:

```bash
sed -n '1,260p' /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/markdownExporter.ts
sed -n '1,260p' /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/jsonExporter.ts
```

Expected: 能定位现有输出结构。

- [ ] **Step 2: Markdown 导出补齐**

新增区块：

- 页面结构
- 交互与动效
- 证据与覆盖度摘要

- [ ] **Step 3: JSON 导出补齐**

要求：

- 让已有的 state 相关结构真正挂到最终输出
- 输出必须保持结构化，不拼大段说明文

- [ ] **Step 4: 类型检查**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/markdownExporter.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters/jsonExporter.ts
git commit -m "feat: export interaction, structure, and evidence data"
```

### Task 8: 预留外部 audit 数据层

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/types/index.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleReport.tsx`

- [ ] **Step 1: 定义 audit 占位结构**

至少包含：

- CSS 一致性审计
- 可访问性审计
- 页面质量摘要

- [ ] **Step 2: 页面入口预留渲染位**

要求：

- 受 feature flag 控制
- 没有数据时不显示

- [ ] **Step 3: 类型检查**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/lib/types/index.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/components/report/StyleReport.tsx
git commit -m "feat: add audit result placeholders"
```

### Task 9: 首页提取流程 UI 对齐

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/hooks/useExtraction.ts`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/ImageUploader.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeWorkspace.tsx`
- Test: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.test.tsx`

- [ ] **Step 1: 检查提取流程现状**

Run:

```bash
sed -n '1,260p' /Users/shaobaolu/Desktop/网球网站/StyleLens/hooks/useExtraction.ts
sed -n '1,240p' /Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.tsx
```

Expected: 能定位 URL 提取和图片提取入口。

- [ ] **Step 2: 补齐用户可感知说明**

目标：

- 明确提示“本次分析已含结构化测量”
- 当覆盖度较低时给出更友好的提示

- [ ] **Step 3: 回归测试**

Run:

```bash
npx vitest run /Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/hooks/useExtraction.ts /Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/ImageUploader.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeWorkspace.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor/UrlInput.test.tsx
git commit -m "feat: align extraction ui with enhanced analysis states"
```

### Task 10: 最终集成收口

**Files:**
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/page.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeOverlays.tsx`
- Modify: `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeSidebar.tsx`

- [ ] **Step 1: 审阅所有上游任务输出**

确认：

- 类型已冻结
- 报告入口已可消费新增结构
- 首页不用承接复杂分析逻辑

- [ ] **Step 2: 只做挂载与状态编排**

要求：

- 不在 `app/page.tsx` 引入新的业务分析逻辑
- 只负责把增强后的 report 和 extraction UI 正确接入

- [ ] **Step 3: 全量检查**

Run:

```bash
npx tsc --noEmit
npx vitest run
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add /Users/shaobaolu/Desktop/网球网站/StyleLens/app/page.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeOverlays.tsx /Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeSidebar.tsx
git commit -m "feat: integrate enhanced extraction and report flows"
```

## 推荐 subagent 派工

### Explorer-1

- 负责 Task 1
- 负责 Task 10
- 负责所有跨模块联调裁决

### Worker-1

- 负责 Task 2
- 负责 Task 3

所有权：

- `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api`
- `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/screenshot/route.ts`

### Worker-2

- 负责 Task 4

所有权：

- `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/api/aiExtract.ts`
- `/Users/shaobaolu/Desktop/网球网站/StyleLens/app/api/extract/route.ts`

### Worker-3

- 负责 Task 5
- 负责 Task 6
- 负责 Task 7
- 负责 Task 8

所有权：

- `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/report`
- `/Users/shaobaolu/Desktop/网球网站/StyleLens/lib/exporters`

### Worker-4

- 负责 Task 9

所有权：

- `/Users/shaobaolu/Desktop/网球网站/StyleLens/hooks/useExtraction.ts`
- `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/extractor`
- `/Users/shaobaolu/Desktop/网球网站/StyleLens/components/home/HomeWorkspace.tsx`

## 执行顺序

1. Task 1 串行先做
2. Task 2 / 3、Task 5 / 6 / 7 / 8、Task 9 并行
3. Task 4 在 Task 1 完成后启动，并与 Task 2 保持接口同步
4. Task 10 最后收口

## 自检

- 已覆盖设计方案中的第一阶段目标
- 任务已按共享边界和冲突风险拆开
- 没有把重型外部接入硬塞进第一阶段
- 每条任务线都有明确文件归属
