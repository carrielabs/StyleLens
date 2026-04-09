/**
 * Feature Flags Configuration
 * 
 * Controls first-phase report enhancement and page audit placeholder modules.
 * By default, these are disabled in production and only enabled via local environment variables.
 */

export const FLAGS = {
  // NEXT_PUBLIC_ prefixes are required for client-side access in Next.js
  ENABLE_DESIGN_AUDITS: process.env.NEXT_PUBLIC_ENABLE_DESIGN_AUDITS === 'true',
  ENABLE_REPORT_EVIDENCE_SUMMARY: process.env.NEXT_PUBLIC_ENABLE_REPORT_EVIDENCE_SUMMARY === 'true',
  ENABLE_REPORT_COVERAGE_SUMMARY: process.env.NEXT_PUBLIC_ENABLE_REPORT_COVERAGE_SUMMARY === 'true',
  ENABLE_REPORT_INTERACTION_SUMMARY: process.env.NEXT_PUBLIC_ENABLE_REPORT_INTERACTION_SUMMARY === 'true',
  ENABLE_PAGE_AUDITS: process.env.NEXT_PUBLIC_ENABLE_PAGE_AUDITS === 'true'
};
