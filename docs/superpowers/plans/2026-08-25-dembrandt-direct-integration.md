# Dembrandt Direct Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Dembrandt 的官方成熟实现直接接进 StyleLens，用于 findings、DTCG、DESIGN.md、Tailwind v4 @theme 和 drift，并用硬测试锁死不能回退到本地重写。

**Architecture:** 新增一个很薄的 Dembrandt 适配层，把 `StyleReport` 转成 Dembrandt 需要的 `BrandingResult` 形状；产品端直接调用 Dembrandt 的导出和诊断函数，不再走本地重写的导出逻辑。导出面板继续留在现有报告页里，但 Markdown / Tokens / Tailwind 三个出口改为 Dembrandt 原生输出；findings 进入报告的 audit summary，drift 通过一个很薄的 API 入口暴露出来。

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, npm package `dembrandt`.

---

### Task 1: 写死“必须调用 Dembrandt 官方函数”的测试

**Files:**
- Create: `lib/integrations/dembrandt.test.ts`
- Modify: `components/report/StyleReport.tsx`
- Modify: `components/report/ExportPanel.tsx`
- Modify: `lib/api/aiExtract.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it, vi } from 'vitest'
import { buildDembrandtDesignMd, buildDembrandtDtcg, buildDembrandtTailwindTheme, buildDembrandtFindings, buildDembrandtDrift } from '@/lib/integrations/dembrandt'
import { createFixtureReport } from '@/test/fixtures/dembrandt-report-fixture'

vi.mock('dembrandt/markdown', () => ({ generateDesignMd: vi.fn(() => 'mock-design-md') }))
vi.mock('dembrandt/dtcg-export', () => ({ toDtcgTokens: vi.fn(() => ({ mocked: true })) }))
vi.mock('dembrandt/findings', () => ({ computeFindings: vi.fn(() => ({ findings: [{ category: 'contrast', severity: 'warn' }], consistency: 99, contrast: 100, coverage: { present: 6, total: 6 } })) }))
vi.mock('dembrandt/drift', () => ({ computeDrift: vi.fn(() => ({ score: 0, status: 'stable' })) }))
vi.mock('dembrandt/dist/lib/formatters/tailwind.js', () => ({ generateTailwindTheme: vi.fn(() => 'mock-tailwind') }))

describe('dembrandt bridge', () => {
  it('delegates DESIGN.md generation to Dembrandt', () => {
    expect(buildDembrandtDesignMd(createFixtureReport())).toBe('mock-design-md')
  })

  it('delegates DTCG generation to Dembrandt', () => {
    expect(buildDembrandtDtcg(createFixtureReport())).toEqual({ mocked: true })
  })

  it('delegates Tailwind theme generation to Dembrandt', () => {
    expect(buildDembrandtTailwindTheme(createFixtureReport())).toBe('mock-tailwind')
  })

  it('delegates findings generation to Dembrandt', () => {
    expect(buildDembrandtFindings(createFixtureReport()).findings[0].category).toBe('contrast')
  })

  it('delegates drift computation to Dembrandt', () => {
    expect(buildDembrandtDrift(createFixtureReport(), createFixtureReport()).status).toBe('stable')
  })
})
```

- [ ] **Step 2: 跑测试看它失败**

Run:

```bash
npm test lib/integrations/dembrandt.test.ts
```

Expected:

```text
Cannot find module '@/lib/integrations/dembrandt'
```

- [ ] **Step 3: 只补测试需要的 fixture**

Create `test/fixtures/dembrandt-report-fixture.ts` with one minimal `StyleReport` fixture that has colors, typography, spacing, radius, shadows, and one button snapshot.

- [ ] **Step 4: 再跑一次测试**

Run:

```bash
npm test lib/integrations/dembrandt.test.ts
```

Expected:

```text
Tests still fail until the bridge exists and is wired to Dembrandt.
```

### Task 2: 加 Dembrandt 依赖并写最薄适配层

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/integrations/dembrandt.ts`

- [ ] **Step 1: 安装官方包**

Run:

```bash
npm install dembrandt@0.28.0
```

Expected:

```text
package.json and package-lock.json both include dembrandt.
```

- [ ] **Step 2: 写适配层**

Create `lib/integrations/dembrandt.ts`:

```ts
import type { StyleReport } from '@/lib/types'
import { computeFindings } from 'dembrandt/findings'
import { computeDrift } from 'dembrandt/drift'
import { generateDesignMd } from 'dembrandt/markdown'
import { toDtcgTokens } from 'dembrandt/dtcg-export'
import { generateTailwindTheme } from 'dembrandt/dist/lib/formatters/tailwind.js'

export function buildDembrandtBrandingResult(report: StyleReport) {
  return { /* thin StyleReport → BrandingResult adapter */ }
}

export function buildDembrandtFindings(report: StyleReport) {
  return computeFindings(buildDembrandtBrandingResult(report))
}

export function buildDembrandtDesignMd(report: StyleReport) {
  return generateDesignMd(buildDembrandtBrandingResult(report))
}

export function buildDembrandtDtcg(report: StyleReport) {
  return toDtcgTokens(buildDembrandtBrandingResult(report))
}

export function buildDembrandtTailwindTheme(report: StyleReport) {
  return generateTailwindTheme(buildDembrandtBrandingResult(report))
}

export function buildDembrandtDrift(baseline: StyleReport, candidate: StyleReport) {
  return computeDrift(buildDembrandtBrandingResult(baseline), buildDembrandtBrandingResult(candidate))
}
```

- [ ] **Step 3: 跑类型检查**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
适配层类型通过。
```

### Task 3: 把产品出口切到 Dembrandt

**Files:**
- Modify: `components/report/ExportPanel.tsx`
- Modify: `components/report/StyleReport.tsx`
- Modify: `lib/api/aiExtract.ts`
- Modify: `lib/types/index.ts`

- [ ] **Step 1: 把 Markdown / Tokens / Tailwind 的内容源切到适配层**

把 `generateMarkdown`、`generateJsonToken`、`generateTailwindConfig` 的调用替换为 `buildDembrandtDesignMd`、`buildDembrandtDtcg`、`buildDembrandtTailwindTheme`。

- [ ] **Step 2: 把 findings 写入报告 audit summary**

在 `lib/api/aiExtract.ts` 生成 `StyleReport` 时，附加一个新的 `pageAnalysis.auditSummary.designSystem`，内容来自 `buildDembrandtFindings(report)`。

- [ ] **Step 3: 给 auditLabel 补中文/英文标签**

在 `components/report/StyleReport.tsx` 里把 `designSystem` 映射成“设计系统诊断 / Design System Findings”。

- [ ] **Step 4: 跑回归测试**

Run:

```bash
npm test lib/exporters/exporters.quality.test.ts lib/api/pageAnalyzer.realWorldTargets.test.ts
```

Expected:

```text
新的导出内容稳定，报告页能显示 Dembrandt findings。
```

### Task 4: 接入 drift API

**Files:**
- Create: `app/api/dembrandt/drift/route.ts`
- Create: `app/api/dembrandt/drift/route.test.ts`
- Modify: `docs/reference/api-routes.md`

- [ ] **Step 1: 写失败测试**

```ts
// POST /api/dembrandt/drift
// body: { baseline: StyleReport, candidate: StyleReport }
// response: { success: true, drift: {...} }
```

- [ ] **Step 2: 实现薄路由**

路由只做参数校验，然后直接调用 `buildDembrandtDrift()`。

- [ ] **Step 3: 跑路由测试**

Run:

```bash
npm test app/api/dembrandt/drift/route.test.ts
```

Expected:

```text
返回 Dembrandt 的 drift 结果，不走本地重写算法。
```

- [ ] **Step 4: 更新 API 文档**

把新路由补到 `docs/reference/api-routes.md`，说明它直接返回 Dembrandt 的 drift 结果。
