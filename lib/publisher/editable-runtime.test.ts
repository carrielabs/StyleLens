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
})
