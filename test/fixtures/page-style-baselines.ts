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
      pageBackground: ['#FFFFFF'],
      textPrimary: ['#000000'],
    },
    forbidden: {
      pageBackground: ['#FF3B30'],
    },
  },
]
