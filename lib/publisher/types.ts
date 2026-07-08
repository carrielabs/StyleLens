export type PublisherPageType = 'product-website'

export interface GenerateProductWebsiteOptions {
  sourceText: string
  templateId: string
  pageType?: PublisherPageType
}

export interface PublisherResult {
  html: string
  title: string
  templateId: string
}

export interface PublisherTemplate {
  id: string
  name: string
  kind: 'website' | 'dashboard' | 'ppt' | 'other'
  html: string
  config: Record<string, unknown>
}
