import { describe, expect, it } from 'vitest'
import { DASHBOARD_TEMPLATES } from './templates'

const EXISTING_DASHBOARD_TEMPLATE_IDS = [
  'dashboard-01-blue-business',
  'dashboard-02-premium-dark',
  'dashboard-03-lean-cyber-analytics',
  'dashboard-04-premium-midnight',
  'dashboard-05-premium-cyber-dark',
  'dashboard-06-warm-paper-analytics',
  'dashboard-07-dark-bento-analytics',
  'dashboard-08-saas-executive-analytics',
  'dashboard-09-editorial-corporate-analytics',
  'dashboard-10-executive-logic-report',
  'dashboard-11-saas-growth-health-report',
  'dashboard-12-atomic-bento-strategy-report',
  'dashboard-13-corporate-blue-analytics-report',
  'dashboard-14-financial-blue-analytics-report',
  'dashboard-15-consulting-data-report',
]

const NEW_DASHBOARD_TEMPLATE_IDS = [
  'dashboard-16-executive-muted-dashboard',
  'dashboard-17-dark-enterprise-analytics',
  'dashboard-18-enterprise-green-analytics-report',
  'dashboard-19-warm-soft-enterprise-dashboard',
  'dashboard-20-live-commerce-dark-analytics',
  'dashboard-21-corporate-operating-analysis-report',
  'dashboard-22-glassmorphism-analytics-dashboard',
  'dashboard-23-enterprise-teal-report',
  'dashboard-24-cream-macaron-medical-analytics',
  'dashboard-25-space-cyber-charging-safety-dashboard',
  'dashboard-26-emerald-b2b-analytics-dashboard',
  'dashboard-27-powerbi-hr-operations-report',
  'dashboard-28-macos-glass-transaction-dashboard',
]

describe('publisher dashboard templates', () => {
  it('keeps the existing 15 dashboard templates in the same order', () => {
    expect(DASHBOARD_TEMPLATES.slice(0, 15).map(template => template.id)).toEqual(EXISTING_DASHBOARD_TEMPLATE_IDS)
  })

  it('adds dashboard templates 16 through 28 after the existing templates', () => {
    expect(DASHBOARD_TEMPLATES.map(template => template.id)).toEqual([
      ...EXISTING_DASHBOARD_TEMPLATE_IDS,
      ...NEW_DASHBOARD_TEMPLATE_IDS,
    ])
  })
})
