import { DAY_GROUPS, DAY_ORDER, WEEK_DAYS } from './constants'

export const plannerStorage = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    }catch{
      return fallback
    }
  },
  set(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value))
    }catch{
      // ignore quota errors for demo mode
    }
  },
}

export const uid = () => Math.random().toString(36).slice(2, 9)

export const transferKey = (zoneId, listId, ip) => `${zoneId}::${listId}::${ip}`

export function clamp01(value){
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function timeToMinutes(value){
  if (typeof value !== 'string') return 0
  const [h = '0', m = '0'] = value.split(':')
  const hours = Number(h)
  const minutes = Number(m)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

export function isSameDaySet(source, target){
  if (!Array.isArray(source) || !Array.isArray(target)) return false
  if (source.length !== target.length) return false
  const sortedSource = source.slice().sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
  const sortedTarget = target.slice().sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
  return sortedSource.every((value, idx) => value === sortedTarget[idx])
}

export function formatDaysForDisplay(days = []){
  const unique = Array.from(new Set((days || []).filter(Boolean)))
  if (!unique.length) return 'Без дней'
  if (isSameDaySet(unique, DAY_GROUPS.all)) return 'Ежедневно'
  if (isSameDaySet(unique, DAY_GROUPS.weekdays)) return 'Будни'
  if (isSameDaySet(unique, DAY_GROUPS.weekend)) return 'Выходные'
  return unique
    .slice()
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
    .map(code => WEEK_DAYS.find(d => d.value === code)?.label || code)
    .join(' · ')
}

export function describeAnnouncement(entry){
  const repeat = entry?.repeat || 'daily'
  const time = entry?.time || '00:00'
  const offset = typeof entry?.offsetMinutes === 'number' ? entry.offsetMinutes : 0
  if (repeat === 'hourly'){
    return offset ? `Каждый час · ${String(offset).padStart(2, '0')} мин` : 'Каждый час · в начале'
  }
  if (repeat === 'weekly'){
    return `${formatDaysForDisplay(entry?.days || [])} · ${time}`
  }
  return `Ежедневно · ${time}`
}

export function resolveAnnouncementTrackLabel(entry, lists){
  const track = entry?.track || {}
  if (track.type === 'library'){
    const list = lists.find(l => l.id === track.listId)
    const item = list?.tracks?.find(t => t.id === track.trackId)
    if (item && list){
      return `${item.name} • ${list.name}`
    }
    return 'Трек из библиотеки'
  }
  if (track.name){
    return track.name
  }
  return 'Аудиофайл'
}

export function resolveDeviceStatus(device){
  const raw = (device?.status || '').toString().toLowerCase()
  if (raw.includes('off') || raw === 'red') return 'offline'
  if (raw.includes('warn') || raw.includes('degrad') || raw === 'yellow') return 'warning'
  if (device?.online === false) return 'offline'
  if (device?.online === true) return 'online'
  if (raw.includes('idle')) return 'warning'
  return 'online'
}

export function formatClockLabel(seconds){
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '--:--'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
