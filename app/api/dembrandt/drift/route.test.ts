import { describe, expect, it, vi } from 'vitest'
import { createFixtureReport } from '@/test/fixtures/dembrandt-report-fixture'

vi.mock('@/lib/integrations/dembrandt', () => ({
  buildDembrandtDrift: vi.fn(() => ({
    score: 0,
    status: 'stable',
    threshold: 10,
    summary: { changed: 0, added: 0, removed: 0 },
    categories: [],
    changes: [],
  })),
}))

import { POST } from './route'

describe('POST /api/dembrandt/drift', () => {
  it('returns Dembrandt drift output for two reports', async () => {
    const response = await POST(new Request('http://localhost/api/dembrandt/drift', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        baseline: createFixtureReport(),
        candidate: createFixtureReport(),
      }),
    }))

    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.drift.status).toBe('stable')
    expect(payload.drift.score).toBe(0)
  })
})
