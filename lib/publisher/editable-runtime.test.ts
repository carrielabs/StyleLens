import { afterEach, describe, expect, it, vi } from 'vitest'
import { runtimeScript } from './editable-runtime.mjs'

describe('editable runtime export', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    delete (window as typeof window & { AHP_DASHBOARD_DATA?: unknown }).AHP_DASHBOARD_DATA
    vi.restoreAllMocks()
  })

  it('keeps the editing runtime in exported html', () => {
    const script = runtimeScript([], 'ahp-runtime-export-test', 'website-07-blueprint-agent-platform', '#2563EB')
    const scriptElement = document.createElement('script')
    const exportedMessages: unknown[] = []

    ;(window as typeof window & { AHP_DASHBOARD_DATA?: unknown }).AHP_DASHBOARD_DATA = { title: 'Revenue dashboard' }
    document.head.innerHTML = '<style data-ahp-runtime="true">[data-editable="true"]{outline:0}</style>'
    document.body.innerHTML = '<main><h1 data-editable="true" data-edit-id="hero.title">Original title</h1></main>'
    const dashboardDataElement = document.createElement('script')
    dashboardDataElement.setAttribute('data-ahp-dashboard-data', 'true')
    dashboardDataElement.textContent = 'window.AHP_DASHBOARD_DATA = {"title":"Revenue dashboard"};'
    document.body.appendChild(dashboardDataElement)
    scriptElement.setAttribute('data-ahp-runtime', 'true')
    scriptElement.textContent = script
    document.body.appendChild(scriptElement)

    vi.spyOn(window, 'postMessage').mockImplementation((message: unknown) => {
      exportedMessages.push(message)
    })
    new Function(script)()

    document.querySelector('[data-edit-id="hero.title"]')!.innerHTML = 'Edited title'
    window.dispatchEvent(new MessageEvent('message', {
      data: { type: 'AHP_REQUEST_EXPORT_HTML' },
      source: window,
    }))

    const response = exportedMessages.find((message): message is { type: string; html: string } => (
      Boolean(message)
      && typeof message === 'object'
      && message !== null
      && 'type' in message
      && (message as { type: string }).type === 'AHP_EXPORT_HTML'
    ))
    expect(response?.html).toContain('Edited title')
    expect(response?.html).toContain('data-ahp-dashboard-data')
    expect(response?.html).toContain('data-ahp-runtime')
    expect(response?.html).toContain('AHP_REQUEST_EXPORT_HTML')
  })

  it('renders dashboard structure controls and toggles dashboard modules', () => {
    const script = runtimeScript([], 'ahp-runtime-structure-test', 'dashboard-15-consulting-data-report', '#2563EB')
    document.body.innerHTML = [
      '<main>',
      '<section data-section="summary" data-ahp-dashboard-module-id="module-kpi"><h2 data-editable="true" data-edit-id="edit-1">KPI</h2></section>',
      '<section data-section="trend" data-ahp-dashboard-module-id="module-trend"><h2 data-editable="true" data-edit-id="edit-2">趋势</h2></section>',
      '</main>',
    ].join('')
    ;(window as typeof window & { AHP_DASHBOARD_DATA?: unknown }).AHP_DASHBOARD_DATA = {
      title: 'Revenue dashboard',
      modules: [
        { id: 'module-kpi', kind: 'kpi', title: 'KPI 指标卡', visible: true },
        { id: 'module-trend', kind: 'trend', title: '趋势图', visible: true },
      ],
      sections: [
        { id: 'section-key-takeaways', title: 'Key Takeaways', moduleIds: ['module-kpi'] },
        { id: 'section-revenue', title: 'revenue 分析', moduleIds: ['module-trend'] },
      ],
    }

    new Function(script)()
    document.querySelector<HTMLButtonElement>('[data-action="openToolbar"]')!.click()

    expect(document.querySelector('[data-ahp-dashboard-structure]')?.textContent).toContain('结构')
    expect(document.querySelector('[data-ahp-dashboard-structure]')?.textContent).toContain('趋势图')

    document.querySelector<HTMLButtonElement>('[data-dashboard-module-toggle="module-trend"]')!.click()

    expect(document.querySelector('[data-ahp-dashboard-module-id="module-trend"]')?.getAttribute('data-ahp-hidden')).toBe('true')
    expect((window as typeof window & { AHP_DASHBOARD_DATA?: { modules: Array<{ id: string; visible: boolean }> } }).AHP_DASHBOARD_DATA?.modules[1].visible).toBe(false)
  })

  it('undoes and redoes inline text edits', () => {
    const script = runtimeScript([], 'ahp-runtime-history-test', 'website-01-fui', '#2563EB')
    document.body.innerHTML = '<main><h1 data-editable="true" data-edit-id="edit-1">Original</h1></main>'

    new Function(script)()
    document.querySelector<HTMLButtonElement>('[data-action="openToolbar"]')!.click()

    const title = document.querySelector<HTMLElement>('[data-edit-id="edit-1"]')!
    title.innerHTML = 'First edit'
    title.dispatchEvent(new Event('blur'))
    title.innerHTML = 'Second edit'
    title.dispatchEvent(new Event('blur'))

    document.querySelector<HTMLButtonElement>('[data-action="undo"]')!.click()
    expect(document.querySelector('[data-edit-id="edit-1"]')?.textContent).toBe('First edit')

    document.querySelector<HTMLButtonElement>('[data-action="redo"]')!.click()
    expect(document.querySelector('[data-edit-id="edit-1"]')?.textContent).toBe('Second edit')
  })

  it('undoes advanced module visibility edits', () => {
    const script = runtimeScript([], 'ahp-runtime-module-history-test', 'website-01-fui', '#2563EB')
    document.body.innerHTML = [
      '<main>',
      '<section data-section="hero"><h1 data-editable="true" data-edit-id="edit-1">Hero</h1></section>',
      '<section data-section="features"><h2 data-editable="true" data-edit-id="edit-2">Features</h2></section>',
      '</main>',
    ].join('')

    new Function(script)()
    document.querySelector<HTMLButtonElement>('[data-action="openToolbar"]')!.click()
    document.querySelector<HTMLElement>('[data-edit-id="edit-2"]')!.click()
    document.querySelector<HTMLButtonElement>('[data-style="moduleToggle"]')!.click()

    expect(document.querySelector('[data-section="features"]')?.getAttribute('data-ahp-hidden')).toBe('true')

    document.querySelector<HTMLButtonElement>('[data-action="undo"]')!.click()
    expect(document.querySelector('[data-section="features"]')?.getAttribute('data-ahp-hidden')).not.toBe('true')
  })
})
