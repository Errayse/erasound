import { DAY_GROUPS, DAY_ORDER } from './constants'
import { scheduleFallbackDevices } from './seeds'
import { createDefaultWindow, createDefaultAnnouncement } from './seeds'
import { normalizePlayer } from './player'
import { uid } from './utils'

export function normalizeScheduleDevices(list){
  if (!Array.isArray(list) || list.length === 0) return scheduleFallbackDevices
  return list.map((device, index) => {
    const fallback = scheduleFallbackDevices[index % scheduleFallbackDevices.length]
    const base = {
      ...fallback,
      ...device,
    }
    const status = device?.status || (device?.online === false ? 'offline' : undefined)
      || (device?.health && typeof device.health === 'string' ? device.health : undefined)
      || (device?.latency && device.latency > 150 ? 'degraded' : undefined)
    base.status = status || (device?.online === false ? 'offline' : 'online')
    base.name = device?.name || device?.label || fallback.name
    base.ip = device?.ip || fallback.ip
    return base
  })
}

export function normalizeWindow(entry = {}){
  const rawDays = Array.isArray(entry.days) ? entry.days.filter(Boolean) : []
  const days = rawDays.length ? Array.from(new Set(rawDays)) : DAY_GROUPS.all
  const sortedDays = days.slice().sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
  return {
    id: entry.id || uid(),
    label: entry.label || 'Расписание',
    start: entry.start || '08:00',
    end: entry.end || '20:00',
    days: sortedDays,
    enabled: entry.enabled !== false,
  }
}

export function normalizeTrack(track){
  if (!track) return { type: 'custom', name: 'Announcement.mp3' }
  if (track.type === 'library' && track.listId && track.trackId) {
    return { type: 'library', listId: track.listId, trackId: track.trackId }
  }
  if (track.type === 'custom' && track.name) {
    return { type: 'custom', name: track.name }
  }
  if (typeof track === 'string') {
    return { type: 'custom', name: track }
  }
  return { type: 'custom', name: 'Announcement.mp3' }
}

export function normalizeAnnouncement(entry = {}){
  const base = {
    id: entry.id || uid(),
    title: entry.title || 'Новое объявление',
    repeat: entry.repeat || 'daily',
    time: entry.time || '12:00',
    days: Array.isArray(entry.days) ? Array.from(new Set(entry.days.filter(Boolean))) : [],
    track: normalizeTrack(entry.track),
    offsetMinutes: typeof entry.offsetMinutes === 'number' ? entry.offsetMinutes : 0,
    enabled: entry.enabled !== false,
  }
  if (base.repeat === 'weekly' && base.days.length === 0) {
    base.days = ['mon']
  }
  if (base.repeat === 'daily') {
    base.days = DAY_GROUPS.all
  }
  return base
}

export function cloneWindowData(entry){
  const normalized = normalizeWindow(entry || createDefaultWindow())
  return {
    ...normalized,
    days: normalized.days.slice(),
  }
}

export function cloneAnnouncementData(entry){
  const normalized = normalizeAnnouncement(entry || createDefaultAnnouncement())
  return {
    ...normalized,
    days: normalized.days ? normalized.days.slice() : [],
    track: { ...normalized.track },
  }
}

export function normalizeZone(entry, fallback, index){
  const fallbackWindow = fallback?.playbackWindows || [createDefaultWindow()]
  const fallbackAnnouncements = fallback?.announcements || [createDefaultAnnouncement()]
  return {
    id: entry.id || fallback?.id || `z${index + 1}`,
    name: entry.name || fallback?.name || `Зона ${index + 1}`,
    playlistIds: Array.isArray(entry.playlistIds) ? entry.playlistIds : [],
    deviceIps: Array.isArray(entry.deviceIps)
      ? Array.from(new Set(entry.deviceIps.filter(Boolean)))
      : entry.deviceIp
        ? [entry.deviceIp]
        : Array.isArray(fallback?.deviceIps)
          ? fallback.deviceIps
          : [],
    playbackWindows: (Array.isArray(entry.playbackWindows) && entry.playbackWindows.length
      ? entry.playbackWindows
      : fallbackWindow).map(normalizeWindow),
    announcements: (Array.isArray(entry.announcements) && entry.announcements.length
      ? entry.announcements
      : fallbackAnnouncements).map(normalizeAnnouncement),
    player: normalizePlayer(entry.player, fallback?.player, index),
  }
}
