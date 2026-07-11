import { describe, expect, it, vi } from 'vitest'

const generateMock = vi.hoisted(() => vi.fn(async (options: { fileName: string; templateId: string }) => ({
  html: '<!DOCTYPE html><html><body>真实数据看板</body></html>',
  title: '真实数据看板',
  templateId: options.templateId,
  sourceFileName: options.fileName,
})))

vi.mock('@/lib/publisher/dataDashboard', () => ({
  generateDashboardHtmlFromDataFile: generateMock,
}))

import { POST } from './route'

async function postForm(formData: FormData) {
  return POST({ formData: async () => formData } as Request)
}

describe('/api/generate-dashboard-data', () => {
  it('rejects missing file', async () => {
    const formData = new FormData()

    const res = await postForm(formData)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('returns generated dashboard for one csv file', async () => {
    const formData = new FormData()
    formData.set('templateId', 'dashboard-15-consulting-data-report')
    const file = new File(['date,revenue\n2026-01-01,100'], 'sales.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new TextEncoder().encode('date,revenue\n2026-01-01,100').buffer,
    })
    formData.set('file', file)

    const res = await postForm(formData)
    const data = await res.json()

    expect(res.status, JSON.stringify(data)).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result.sourceFileName).toBe('sales.csv')
    expect(generateMock).toHaveBeenCalledWith({
      fileName: 'sales.csv',
      contentType: 'text/csv',
      bytes: expect.any(Uint8Array),
      templateId: 'dashboard-15-consulting-data-report',
    })
  })
})
