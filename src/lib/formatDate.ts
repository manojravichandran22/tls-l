export function formatDate(d: string | null | undefined): string {
  if (!d || d === '—') return '—'
  const part = String(d).slice(0, 10)
  const parts = part.split('-')
  if (parts.length !== 3) return String(d)
  const [p1, p2, p3] = parts
  if (p1.length === 4) return `${p3}-${p2}-${p1}`
  if (p3.length === 4) return part
  return String(d)
}

