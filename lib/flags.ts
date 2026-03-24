/**
 * Feature Flags Configuration
 * 
 * Controls the visibility of experimental/sensitive design audit modules (V1-V3).
 * By default, these are disabled in production and only enabled via local environment variables.
 */

export const FLAGS = {
  // NEXT_PUBLIC_ prefixes are required for client-side access in Next.js
  ENABLE_DESIGN_AUDITS: process.env.NEXT_PUBLIC_ENABLE_DESIGN_AUDITS === 'true'
};
