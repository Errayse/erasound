export function statusTone(status){
  switch(status){
    case 'online':
      return { dot: 'bg-emerald-400', text: 'text-emerald-200', border: 'border-emerald-400/40' }
    case 'degraded':
      return { dot: 'bg-amber-400', text: 'text-amber-200', border: 'border-amber-400/40' }
    case 'offline':
      return { dot: 'bg-rose-500', text: 'text-rose-200', border: 'border-rose-400/40' }
    default:
      return { dot: 'bg-sky-400', text: 'text-sky-200', border: 'border-sky-400/40' }
  }
}

export function lighten(color, alpha){
  if (!color) return `rgba(255,255,255,${alpha ?? 0.3})`
  const match = color.match(/^#([0-9a-f]{6})$/i)
  if (!match) return color
  const hex = match[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const a = alpha ?? 0.18
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function toneColor(status){
  switch(status){
    case 'online':
      return '#34d399'
    case 'degraded':
      return '#fbbf24'
    case 'offline':
      return '#f87171'
    default:
      return '#38bdf8'
  }
}
