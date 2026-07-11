export type InputIntent = 'extract-style' | 'generate-page'

export function detectInputIntent(value: string): InputIntent {
  const text = value.trim()
  if (/^https?:\/\/\S+$/i.test(text)) return 'extract-style'
  return 'generate-page'
}

export function isTextUpload(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type === 'text/plain'
    || file.type === 'text/markdown'
    || name.endsWith('.md')
    || name.endsWith('.txt')
}

export function isDataUpload(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type === 'text/csv'
    || file.type === 'application/json'
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || name.endsWith('.csv')
    || name.endsWith('.json')
    || name.endsWith('.xlsx')
}
