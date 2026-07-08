import { buildProductWebsiteHtml } from './generate'
import type { GenerateProductWebsiteOptions, PublisherResult } from './types'

export async function generateProductWebsiteHtml(
  options: GenerateProductWebsiteOptions
): Promise<PublisherResult> {
  if (!options.sourceText || !options.sourceText.trim()) {
    throw new Error('缺少文本材料')
  }

  if (options.pageType && options.pageType !== 'product-website') {
    throw new Error('第一版只支持生成产品官网')
  }

  return buildProductWebsiteHtml({
    sourceText: options.sourceText,
    templateId: options.templateId || 'website-01-fui',
  })
}
