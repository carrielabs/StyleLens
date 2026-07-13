import { buildProductWebsiteHtml } from './generate'
import type { GenerateProductWebsiteOptions, PublisherResult } from './types'

export async function generateProductWebsiteHtml(
  options: GenerateProductWebsiteOptions
): Promise<PublisherResult> {
  if (!options.sourceText || !options.sourceText.trim()) {
    throw new Error('缺少文本材料')
  }

  if (options.pageType && !['product-website', 'dashboard'].includes(options.pageType)) {
    throw new Error(`暂不支持的页面类型：${options.pageType}`)
  }

  return buildProductWebsiteHtml({
    sourceText: options.sourceText,
    templateId: options.templateId || (options.pageType === 'dashboard' ? 'dashboard-01-blue-business' : 'website-01-fui'),
    pageType: options.pageType || 'product-website',
    backgroundColor: options.backgroundColor,
  })
}
