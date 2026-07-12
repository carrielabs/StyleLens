# StyleLens Publisher V1 Implementation Plan

> 历史说明：这是一份 2026-07-08 的旧实施计划，保留用于追溯当时的开发路径。当前需求已经领先于这份计划：Publisher 必须支持 8 个官网模板和 15 个 Dashboard 模板，Dashboard 支持 `.csv` / `.json` / `.xlsx` 数据文件生成。当前开发口径以根目录 `AGENTS.md`、`README.md` 和 `docs/PRD_StyleLens_AI_HTML_Publisher.md` 为准。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add product website HTML generation to StyleLens while preserving the existing URL/image style extraction flow.

**Architecture:** StyleLens remains the main app. AI HTML Publisher is migrated into `lib/publisher/` as a server-side generation module, exposed through `app/api/generate/route.ts`, then consumed by the homepage unified input UI.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, existing StyleLens components, existing AI HTML Publisher generation logic, Cheerio, Tailwind CLI where needed.

---

## Scope

This plan implements only:

1. Text / `.md` / `.txt` to product website HTML.
2. 8 existing website templates.
3. Preview and download.

This plan does not implement:

1. dashboard generation.
2. PPT generation.
3. PDF / Word / Excel parsing.
4. GitHub Skill packaging.
5. automatic application of extracted style reports.

## Source Projects

StyleLens project:

```text
/Users/shaobaolu/Downloads/AI 工程/Vibe coding 项目/StyleLens
```

AI HTML Publisher project:

```text
/Users/shaobaolu/Desktop/AI HTML Publisher
```

## Task 1: Create Publisher Module Boundary

**Files:**

- Create: `lib/publisher/README.md`
- Create: `lib/publisher/types.ts`
- Create: `lib/publisher/index.ts`
- Modify: `package.json` in Task 2

- [ ] **Step 1: Create module README**

Create `lib/publisher/README.md`:

````markdown
# Publisher Module

This module contains the server-side HTML generation engine migrated from AI HTML Publisher.

V1 scope:

- input plain text / Markdown
- output product website HTML
- support website templates only
- no dashboard / PPT generation yet

Public API:

```ts
generateProductWebsiteHtml(options): Promise<PublisherResult>
```
````

- [ ] **Step 2: Create shared types**

Create `lib/publisher/types.ts`:

```ts
export type PublisherPageType = 'product-website'

export interface GenerateProductWebsiteOptions {
  sourceText: string
  templateId: string
  pageType?: PublisherPageType
}

export interface PublisherResult {
  html: string
  title: string
  templateId: string
}

export interface PublisherTemplate {
  id: string
  name: string
  kind: 'website' | 'dashboard' | 'ppt' | 'other'
  html: string
  config: Record<string, unknown>
}
```

- [ ] **Step 3: Create temporary module entry**

Create `lib/publisher/index.ts`:

```ts
import type { GenerateProductWebsiteOptions, PublisherResult } from './types'

export async function generateProductWebsiteHtml(
  _options: GenerateProductWebsiteOptions
): Promise<PublisherResult> {
  throw new Error('Publisher module is not wired yet')
}
```

- [ ] **Step 4: Run type check**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors from the new publisher files.
```

## Task 2: Migrate Publisher Dependencies

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install required dependencies**

Run in StyleLens:

```bash
npm install cheerio tailwindcss@^3.4.17
```

Expected:

```text
package.json includes cheerio and tailwindcss.
package-lock.json is updated.
```

- [ ] **Step 2: Run existing checks**

Run:

```bash
npm test
npx tsc --noEmit
```

Expected:

```text
Existing tests still pass.
Type check passes.
```

## Task 3: Copy Website Templates

**Files:**

- Create: `templates/_incoming/website-01-fui/**`
- Create: `templates/_incoming/website-02-soft-surrealism/**`
- Create: `templates/_incoming/website-03-red-clay/**`
- Create: `templates/_incoming/website-04-premium-midnight/**`
- Create: `templates/_incoming/website-05-voltflow-cyber-saas/**`
- Create: `templates/_incoming/website-07-blueprint-agent-platform/**`
- Create: `templates/_incoming/website-08-editorial-apple-tech/**`
- Create: `templates/_incoming/website-09-blue-shift-portfolio/**`

- [ ] **Step 1: Copy only website templates**

Copy from:

```text
/Users/shaobaolu/Desktop/AI HTML Publisher/templates/_incoming/website-*
```

To:

```text
/Users/shaobaolu/Downloads/AI 工程/Vibe coding 项目/StyleLens/templates/_incoming/
```

Do not copy dashboard templates in V1.

- [ ] **Step 2: Verify copied template count**

Run:

```bash
find templates/_incoming -maxdepth 1 -type d -name 'website-*' | wc -l
```

Expected:

```text
8
```

- [ ] **Step 3: Verify required files**

Run:

```bash
for d in templates/_incoming/website-*; do test -f "$d/template.html" && test -f "$d/template.json" && echo "ok $d"; done
```

Expected:

```text
8 ok lines.
```

## Task 4: Port Core Publisher Code

**Files:**

- Create: `lib/publisher/content.ts`
- Create: `lib/publisher/templates.ts`
- Create: `lib/publisher/editable-runtime.ts`
- Create: `lib/publisher/generate.ts`
- Modify: `lib/publisher/index.ts`

- [ ] **Step 1: Port content parser**

Copy logic from:

```text
/Users/shaobaolu/Desktop/AI HTML Publisher/src/content.mjs
```

Into:

```text
lib/publisher/content.ts
```

Keep behavior equivalent. Convert ESM JavaScript to TypeScript.

- [ ] **Step 2: Port template loader**

Copy logic from:

```text
/Users/shaobaolu/Desktop/AI HTML Publisher/src/templates.mjs
```

Into:

```text
lib/publisher/templates.ts
```

Change project root resolution to work inside StyleLens:

```ts
const ROOT = process.cwd()
```

Only register the 8 website templates in V1.

- [ ] **Step 3: Port editable runtime**

Copy logic from:

```text
/Users/shaobaolu/Desktop/AI HTML Publisher/src/editable-runtime.mjs
```

Into:

```text
lib/publisher/editable-runtime.ts
```

Keep the public functions:

```ts
export function runtimeStyle(): string
export function runtimeScript(...): string
```

- [ ] **Step 4: Port generate function**

Copy logic from:

```text
/Users/shaobaolu/Desktop/AI HTML Publisher/src/generate.mjs
```

Into:

```text
lib/publisher/generate.ts
```

Change the public function from file-output behavior to string-output behavior:

```ts
export async function buildProductWebsiteHtml(options: {
  sourceText: string
  templateId: string
}): Promise<{ html: string; title: string; templateId: string }>
```

The function must not write to `dist/`.

- [ ] **Step 5: Wire public API**

Replace `lib/publisher/index.ts` with:

```ts
import { buildProductWebsiteHtml } from './generate'
import type { GenerateProductWebsiteOptions, PublisherResult } from './types'

export async function generateProductWebsiteHtml(
  options: GenerateProductWebsiteOptions
): Promise<PublisherResult> {
  if (!options.sourceText || !options.sourceText.trim()) {
    throw new Error('缺少文本材料')
  }

  return buildProductWebsiteHtml({
    sourceText: options.sourceText,
    templateId: options.templateId || 'website-01-fui',
  })
}
```

- [ ] **Step 6: Run type check**

Run:

```bash
npx tsc --noEmit
```

Expected:

```text
No TypeScript errors.
```

## Task 5: Add Publisher Unit Tests

**Files:**

- Create: `lib/publisher/generate.test.ts`

- [ ] **Step 1: Add tests for website generation**

Create `lib/publisher/generate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateProductWebsiteHtml } from './index'

const WEBSITE_TEMPLATES = [
  'website-01-fui',
  'website-02-soft-surrealism',
  'website-03-red-clay',
  'website-04-premium-midnight',
  'website-05-voltflow-cyber-saas',
  'website-07-blueprint-agent-platform',
  'website-08-editorial-apple-tech',
  'website-09-blue-shift-portfolio',
]

const sourceText = [
  '# AI HTML Publisher',
  '',
  '把已有产品材料稳定转换成高质量、可编辑、可导出的 HTML 页面。',
  '',
  '## 用户痛点',
  '- AI 自由设计页面不稳定',
  '- 反复修改容易重画整页',
  '',
  '## 核心能力',
  '- 只使用已验收模板',
  '- 页面内直接编辑文字',
  '- 导出完整 HTML 文件',
  '',
  '## 使用流程',
  '- 输入材料',
  '- 选择模板',
  '- 生成页面',
  '- 编辑导出',
].join('\n')

describe('generateProductWebsiteHtml', () => {
  it.each(WEBSITE_TEMPLATES)('generates clean HTML for %s', async templateId => {
    const result = await generateProductWebsiteHtml({ sourceText, templateId })

    expect(result.html).toContain('AI HTML Publisher')
    expect(result.html).toContain('data-ahp-runtime')
    expect(result.html).not.toMatch(/<script[^>]+src="https?:\/\//i)
    expect(result.html).not.toMatch(/<link[^>]+href="https?:\/\//i)
    expect(result.html).not.toMatch(/cdn\.tailwindcss|fonts\.googleapis|localhost|127\.0\.0\.1|onclick=|document\.write|href="#"/i)
  })
})
```

- [ ] **Step 2: Run targeted test**

Run:

```bash
npm test -- lib/publisher/generate.test.ts
```

Expected:

```text
8 template cases pass.
```

## Task 6: Add Generate API Route

**Files:**

- Create: `app/api/generate/route.ts`
- Create: `app/api/generate/route.test.ts`

- [ ] **Step 1: Create API route**

Create `app/api/generate/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { generateProductWebsiteHtml } from '@/lib/publisher'

export const maxDuration = 60

const MAX_TEXT_BYTES = 200 * 1024

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sourceText = String(body.sourceText || '')
    const templateId = String(body.templateId || 'website-01-fui')
    const pageType = String(body.pageType || 'product-website')

    if (pageType !== 'product-website') {
      return NextResponse.json(
        { success: false, error: '第一版只支持生成产品官网' },
        { status: 400 }
      )
    }

    if (!sourceText.trim()) {
      return NextResponse.json(
        { success: false, error: '请先输入文本材料' },
        { status: 400 }
      )
    }

    if (Buffer.byteLength(sourceText, 'utf8') > MAX_TEXT_BYTES) {
      return NextResponse.json(
        { success: false, error: '文本过长，请控制在 200KB 以内' },
        { status: 413 }
      )
    }

    const result = await generateProductWebsiteHtml({
      sourceText,
      templateId,
      pageType: 'product-website',
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : '生成失败，请重试'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Add API tests**

Create `app/api/generate/route.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/publisher', () => ({
  generateProductWebsiteHtml: vi.fn(async () => ({
    html: '<!DOCTYPE html><html><body>AI HTML Publisher</body></html>',
    title: 'AI HTML Publisher',
    templateId: 'website-01-fui',
  })),
}))

import { POST } from './route'

async function postJson(body: unknown) {
  return POST(new Request('http://localhost/api/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  }))
}

describe('/api/generate', () => {
  it('rejects empty text', async () => {
    const res = await postJson({ sourceText: '' })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('rejects unsupported page type', async () => {
    const res = await postJson({
      sourceText: '# Demo',
      pageType: 'dashboard',
    })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns generated HTML for valid text', async () => {
    const res = await postJson({
      sourceText: '# AI HTML Publisher',
      templateId: 'website-01-fui',
      pageType: 'product-website',
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result.html).toContain('AI HTML Publisher')
  })
})
```


- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- app/api/generate/route.test.ts
```

Expected:

```text
Generate API tests pass.
```

## Task 7: Add Smart Input Model

**Files:**

- Create: `lib/publisher/inputIntent.ts`
- Create: `lib/publisher/inputIntent.test.ts`

- [ ] **Step 1: Create intent detector**

Create `lib/publisher/inputIntent.ts`:

```ts
export type InputIntent = 'extract-style' | 'generate-page'

export function detectInputIntent(value: string): InputIntent {
  const text = value.trim()
  if (/^https?:\/\/\S+$/i.test(text)) return 'extract-style'
  return 'generate-page'
}

export function isTextUpload(file: File): boolean {
  return file.type === 'text/plain'
    || file.name.toLowerCase().endsWith('.md')
    || file.name.toLowerCase().endsWith('.txt')
}
```

- [ ] **Step 2: Add tests**

Create `lib/publisher/inputIntent.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { detectInputIntent } from './inputIntent'

describe('detectInputIntent', () => {
  it('detects http urls as style extraction', () => {
    expect(detectInputIntent('https://linear.app')).toBe('extract-style')
  })

  it('detects plain text as page generation', () => {
    expect(detectInputIntent('这是一个产品介绍')).toBe('generate-page')
  })
})
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- lib/publisher/inputIntent.test.ts
```

Expected:

```text
Intent tests pass.
```

## Task 8: Add Publisher Hook

**Files:**

- Create: `hooks/usePublisher.ts`
- Create: `hooks/usePublisher.test.tsx`

- [ ] **Step 1: Create hook**

Create `hooks/usePublisher.ts`:

```ts
'use client'

import { useState } from 'react'

export interface GeneratedPageResult {
  html: string
  title: string
  templateId: string
}

export function usePublisher() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPage, setGeneratedPage] = useState<GeneratedPageResult | null>(null)

  async function generatePage(sourceText: string, templateId: string) {
    setIsGenerating(true)
    setGeneratedPage(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          templateId,
          pageType: 'product-website',
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || '生成失败，请重试')
      setGeneratedPage(data.result)
      return data.result as GeneratedPageResult
    } finally {
      setIsGenerating(false)
    }
  }

  function clearGeneratedPage() {
    setGeneratedPage(null)
  }

  return {
    isGenerating,
    generatedPage,
    generatePage,
    clearGeneratedPage,
  }
}
```

- [ ] **Step 2: Add hook tests**

Create `hooks/usePublisher.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePublisher } from './usePublisher'

describe('usePublisher', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates and stores page result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({
        success: true,
        result: {
          html: '<!DOCTYPE html><html><body>Demo</body></html>',
          title: 'Demo',
          templateId: 'website-01-fui',
        },
      }),
    })))

    const { result } = renderHook(() => usePublisher())

    await act(async () => {
      await result.current.generatePage('# Demo', 'website-01-fui')
    })

    expect(result.current.generatedPage?.title).toBe('Demo')
    expect(result.current.isGenerating).toBe(false)
  })
})
```

- [ ] **Step 3: Run hook tests**

Run:

```bash
npm test -- hooks/usePublisher.test.tsx
```

Expected:

```text
Publisher hook tests pass.
```

## Task 9: Add Generated Page Preview Component

**Files:**

- Create: `components/publisher/GeneratedPagePreview.tsx`
- Create: `components/publisher/GeneratedPagePreview.test.tsx`

- [ ] **Step 1: Create preview component**

Create `components/publisher/GeneratedPagePreview.tsx`:

```tsx
'use client'

interface GeneratedPagePreviewProps {
  html: string
  title: string
  templateId: string
  onBack: () => void
}

export default function GeneratedPagePreview({
  html,
  title,
  templateId,
  onBack,
}: GeneratedPagePreviewProps) {
  function downloadHtml() {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'index.html'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', background: '#f5f5f4' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #e7e5e4' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#78716c' }}>{templateId}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onBack}>返回</button>
          <button type="button" onClick={downloadHtml}>下载 HTML</button>
        </div>
      </div>
      <iframe
        title="生成页面预览"
        sandbox="allow-scripts allow-same-origin allow-downloads"
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Add render test**

Create `components/publisher/GeneratedPagePreview.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GeneratedPagePreview from './GeneratedPagePreview'

describe('GeneratedPagePreview', () => {
  it('renders generated page metadata and preview frame', () => {
    render(
      <GeneratedPagePreview
        html="<!DOCTYPE html><html><body>Demo</body></html>"
        title="Demo Page"
        templateId="website-01-fui"
        onBack={vi.fn()}
      />
    )

    expect(screen.getByText('Demo Page')).toBeInTheDocument()
    expect(screen.getByText('website-01-fui')).toBeInTheDocument()
    expect(screen.getByTitle('生成页面预览')).toBeInTheDocument()
    expect(screen.getByText('下载 HTML')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run component test**

Run:

```bash
npm test -- components/publisher/GeneratedPagePreview.test.tsx
```

Expected:

```text
Preview component test passes.
```

## Task 10: Wire Homepage Unified Input

**Files:**

- Modify: `app/page.tsx`
- Modify: `components/home/HomeWorkspace.tsx`
- Modify as needed: `hooks/useExtraction.ts`
- Use: `hooks/usePublisher.ts`
- Use: `lib/publisher/inputIntent.ts`
- Use: `components/publisher/GeneratedPagePreview.tsx`

- [ ] **Step 1: Add publisher state to homepage**

In `app/page.tsx`, import:

```ts
import GeneratedPagePreview from '@/components/publisher/GeneratedPagePreview'
import { usePublisher } from '@/hooks/usePublisher'
```

Inside `Home`, initialize:

```ts
const {
  isGenerating,
  generatedPage,
  generatePage,
  clearGeneratedPage,
} = usePublisher()
```

- [ ] **Step 2: Show preview when generated**

In the main render area, if `generatedPage` exists, render:

```tsx
<GeneratedPagePreview
  html={generatedPage.html}
  title={generatedPage.title}
  templateId={generatedPage.templateId}
  onBack={clearGeneratedPage}
/>
```

- [ ] **Step 3: Extend workspace props**

Pass `generatePage` and `isGenerating` into `HomeWorkspace`.

Keep existing extraction props unchanged.

- [ ] **Step 4: Update HomeWorkspace input behavior**

In `HomeWorkspace`, change the central URL-only input into a text-capable input.

Behavior:

1. If input is URL, call existing `handleUrlSubmit`.
2. If input is text, call `generatePage(inputValue, selectedTemplateId)`.
3. If uploaded file is image, keep existing image extraction.
4. If uploaded file is `.md` or `.txt`, read file text and call `generatePage(fileText, selectedTemplateId)`.

- [ ] **Step 5: Add template selector**

Add a compact selector with the 8 website templates.

Default:

```text
website-01-fui
```

- [ ] **Step 6: Run homepage tests**

Run:

```bash
npm test -- hooks/useExtraction.test.tsx hooks/usePublisher.test.tsx
npx tsc --noEmit
```

Expected:

```text
Existing extraction behavior still passes.
Publisher hook passes.
Type check passes.
```

## Task 11: Hard Test Generated Outputs

**Files:**

- Create: `scripts/audit-generated-html.mjs`

- [ ] **Step 1: Create audit script**

Create script that calls the publisher for all 8 templates and fails if generated HTML contains:

```text
<script src="http
<link href="http
cdn.tailwindcss
fonts.googleapis
fonts.gstatic
localhost
127.0.0.1
onclick=
document.write
href="#"
```

- [ ] **Step 2: Add package script**

In `package.json`, add:

```json
"audit:publisher": "node scripts/audit-generated-html.mjs"
```

- [ ] **Step 3: Run hard tests**

Run:

```bash
npm test
npm run audit:publisher
npx tsc --noEmit
npm run build
```

Expected:

```text
All checks pass.
Build succeeds.
```

## Task 12: Manual Browser Acceptance

**Manual checks required before deployment:**

- [ ] Open the homepage.
- [ ] Paste a public URL and confirm style extraction still works.
- [ ] Upload a screenshot and confirm style extraction still works.
- [ ] Paste product text and generate website.
- [ ] Upload `.md` and generate website.
- [ ] Upload `.txt` and generate website.
- [ ] Preview generated website in iframe.
- [ ] Download `index.html`.
- [ ] Open downloaded HTML locally.
- [ ] Click page text and confirm inline editing works.
- [ ] Save, refresh, and confirm local restore works.
- [ ] Export from generated HTML and confirm exported file is clean.

## Task 13: Deployment

**Files:**

- Modify: `docs/README.md`
- Modify: `.env.example` only if new environment variables are added.

- [ ] **Step 1: Update docs**

Add a section to `docs/README.md`:

```markdown
## StyleLens Publisher V1

StyleLens now supports text / Markdown / TXT to product website HTML.

V1 supports only product websites and website templates.
Dashboard, PPT, PDF, Word, Excel, and Skill packaging are future phases.
```

- [ ] **Step 2: Verify no secrets are added**

Run:

```bash
rg -n "API_KEY|TOKEN|SECRET|PASSWORD|sk-" app components hooks lib docs package.json
```

Expected:

```text
Only documented environment variable names appear. No real secrets.
```

- [ ] **Step 3: Deploy through existing Vercel flow**

Use the existing StyleLens deployment process.

After deployment, verify:

1. URL extraction works.
2. image extraction works.
3. text website generation works.
4. download works.

## Completion Definition

The implementation is complete only when:

1. `npm test` passes.
2. `npx tsc --noEmit` passes.
3. `npm run build` passes.
4. `npm run audit:publisher` passes.
5. Browser manual acceptance passes.
6. Existing StyleLens extraction is not broken.
7. Product website generation works from pasted text, `.md`, and `.txt`.
