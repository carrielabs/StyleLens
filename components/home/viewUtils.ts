const COLOR_ROLE_ORDER = ['background', 'primary', 'accent', 'secondary', 'text', 'other']

export function getTopColors(colors: any[]): any[] {
  if (!colors || !Array.isArray(colors)) return []

  const sorted = [...colors].sort((a, b) => {
    const ai = COLOR_ROLE_ORDER.indexOf((a.role || 'other').toLowerCase())
    const bi = COLOR_ROLE_ORDER.indexOf((b.role || 'other').toLowerCase())
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return sorted.slice(0, 3)
}
