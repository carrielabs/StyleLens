export type PublisherPageType = 'product-website' | 'dashboard'

export interface GenerateProductWebsiteOptions {
  sourceText: string
  templateId: string
  pageType?: PublisherPageType
  backgroundColor?: string
}

export interface PublisherResult {
  html: string
  title: string
  templateId: string
  backgroundColor?: string
}

export interface PublisherTemplate {
  id: string
  name: string
  kind: 'website' | 'dashboard' | 'ppt' | 'other'
  html: string
  config: Record<string, unknown>
}
