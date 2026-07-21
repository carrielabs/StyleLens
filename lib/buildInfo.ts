export const STYLELENS_BUILD_VERSION = (
  process.env.NEXT_PUBLIC_STYLELENS_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  'local'
).slice(0, 7)
