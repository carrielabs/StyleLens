export type SemanticColorSlot =
  | 'heroBackground'
  | 'pageBackground'
  | 'surface'
  | 'textPrimary'
  | 'primaryAction'

export type PageStyleBaseline = {
  id: string
  url: string
  expected: Partial<Record<SemanticColorSlot, string[]>>
  forbidden?: Partial<Record<SemanticColorSlot, string[]>>
}

export const PAGE_STYLE_BASELINES: PageStyleBaseline[] = [
  {
    id: 'linear',
    url: 'https://linear.app',
    expected: {
      heroBackground: ['#08090A'],
      textPrimary: ['#F7F8F8'],
    },
    forbidden: {
      textPrimary: ['#62666D'],
    },
  },
  {
    id: 'stripe',
    url: 'https://stripe.com',
    expected: {
      pageBackground: ['#F6F9FC', '#E5EDF5'],
      textPrimary: ['#425466'],
      primaryAction: ['#635BFF', '#0A2540'],
    },
    forbidden: {
      textPrimary: ['#000EFF', '#635BFF'],
    },
  },
  {
    id: 'apple',
    url: 'https://www.apple.com',
    expected: {
      heroBackground: ['#F5F5F7'],
      textPrimary: ['#1D1D1F', '#000000'],
      primaryAction: ['#0071E3', '#0076DF', '#0066CC'],
    },
  },
  {
    id: 'notion',
    url: 'https://www.notion.com/',
    expected: {
      pageBackground: ['#FFFFFF', '#DFDCD9', '#F6F5F4'],
      textPrimary: ['#000000'],
    },
    forbidden: {
      pageBackground: ['#FF3B30'],
    },
  },
  {
    id: 'vercel',
    url: 'https://vercel.com',
    expected: {
      heroBackground: ['#FAFAFA'],
      textPrimary: ['#171717'],
    },
  },
  {
    id: 'nodejs',
    url: 'https://nodejs.org/en',
    expected: {
      pageBackground: ['#2C682C'],
      textPrimary: ['#B1BCC2', '#000000'],
      primaryAction: ['#417E38'],
    },
  },
  {
    id: 'ruby',
    url: 'https://www.ruby-lang.org/en/',
    expected: {
      pageBackground: ['#0F5323'],
      textPrimary: ['#FAFAF9'],
      primaryAction: ['#D8C28E'],
    },
  },
  {
    id: 'postgresql',
    url: 'https://www.postgresql.org',
    expected: {
      pageBackground: ['#9FCDFF'],
      textPrimary: ['#000000'],
      primaryAction: ['#007BFF'],
    },
  },
  {
    id: 'cloudflare',
    url: 'https://www.cloudflare.com',
    expected: {
      pageBackground: ['#FDFDFC'],
      textPrimary: ['#262626'],
      primaryAction: ['#FF5E1F'],
    },
  },
  {
    id: 'mozilla',
    url: 'https://www.mozilla.org/en-US/',
    expected: {
      pageBackground: ['#FFFFFF'],
      textPrimary: ['#000000'],
    },
  },
]
