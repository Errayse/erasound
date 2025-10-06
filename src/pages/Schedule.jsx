// src/pages/Schedule.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import Modal from '../components/Modal'

/**
 * Минималистичная страница “Зоны и Плейлисты”
 * - Две независимые секции: Зоны (с выбором устройства) и Плейлисты
 * - Прямоугольные карточки, логичное разделение, адаптив
 * - Drag&Drop: перетащи плейлист на зону, чтобы привязать
 * - Несколько плейлистов в зоне, отвязка одним кликом
 * - Сохранение состояния в localStorage
 */

const ls = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v?JSON.parse(v):d }catch{ return d } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)) }catch{} }
}
const uid = () => Math.random().toString(36).slice(2,9)
const transferKey = (zoneId, listId, ip) => `${zoneId}::${listId}::${ip}`

const WEEK_DAYS = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
]
const DAY_GROUPS = {
  all: WEEK_DAYS.map(d => d.value),
  weekdays: ['mon','tue','wed','thu','fri'],
  weekend: ['sat','sun'],
}

const scheduleFallbackDevices = [
  { ip: '192.168.0.21', name: 'Холл · Ресивер', status: 'online' },
  { ip: '192.168.0.37', name: 'Кафе · Колонки', status: 'degraded' },
  { ip: '192.168.0.52', name: 'Терраса · Усилитель', status: 'offline' },
]

function normalizeScheduleDevices(list){
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

function createDefaultWindow(){
  return {
    id: uid(),
    label: 'Ежедневный эфир',
    start: '08:00',
    end: '20:00',
    days: DAY_GROUPS.all,
    enabled: true,
  }
}

function createDefaultAnnouncement(){
  return {
    id: uid(),
    title: 'Анонс события',
    repeat: 'daily',
    time: '12:00',
    days: DAY_GROUPS.all,
    track: { type: 'custom', name: 'Announcement.mp3' },
    offsetMinutes: 0,
    enabled: true,
  }
}

const demoPlayerPresets = [
  {
    track: 'Morning Intro',
    playlist: 'Доброе утро',
    artist: 'EraSound Studio',
    progress: 0.28,
    length: 214,
    isPlaying: true,
  },
  {
    track: 'City Flow',
    playlist: 'Дневное настроение',
    artist: 'Loft Ensemble',
    progress: 0.61,
    length: 256,
    isPlaying: true,
  },
  {
    track: 'Sunset Layers',
    playlist: 'Вечерняя витрина',
    artist: 'Skyline Trio',
    progress: 0.17,
    length: 301,
    isPlaying: true,
  },
]

function clamp01(value){
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function createEmptyPlayer(){
  return {
    track: null,
    playlist: null,
    artist: null,
    progress: 0,
    length: 240,
    isPlaying: false,
    listId: null,
    trackId: null,
  }
}

function createDemoPlayer(index = 0){
  const preset = demoPlayerPresets[index % demoPlayerPresets.length]
  return { ...createEmptyPlayer(), ...preset }
}

function normalizePlayer(entry, fallback, index){
  const base = { ...createEmptyPlayer(), ...(fallback || createDemoPlayer(index)) }
  if (entry && typeof entry === 'object'){
    if (entry.track) base.track = entry.track
    if (entry.title && !base.track) base.track = entry.title
    if (entry.playlist) base.playlist = entry.playlist
    if (entry.playlistName && !base.playlist) base.playlist = entry.playlistName
    if (entry.artist) base.artist = entry.artist
    if (entry.length) base.length = entry.length
    if (entry.listId) base.listId = entry.listId
    if (entry.playlistId && !base.listId) base.listId = entry.playlistId
    if (entry.trackId) base.trackId = entry.trackId
    if (entry.isPlaying != null) base.isPlaying = !!entry.isPlaying
    if (typeof entry.state === 'string'){
      base.isPlaying = entry.state === 'playing'
    }
    if (entry.position != null){
      const position = Math.max(0, Math.min(entry.position, entry.length || base.length || 0))
      base.progress = base.length ? clamp01(position / base.length) : 0
    }else if (entry.elapsed != null){
      const elapsed = Math.max(0, entry.elapsed)
      base.progress = base.length ? clamp01(elapsed / base.length) : clamp01(entry.progress ?? base.progress)
    }else if (entry.progress != null){
      const raw = entry.progress > 1 ? entry.progress / 100 : entry.progress
      base.progress = clamp01(raw)
    }
  }
  if (!base.track){
    base.track = null
  }
  if (!base.playlist){
    base.playlist = null
  }
  if (typeof base.length !== 'number' || base.length <= 0){
    base.length = 240
  }
  base.progress = clamp01(base.progress)
  return base
}

function createDefaultZones(){
  return [
    {
      id: 'z1',
      name: 'Вход',
      deviceIps: ['192.168.0.21'],
      playlistIds: [],
      playbackWindows: [
        {
          id: uid(),
          label: 'Будни · Открытие',
          start: '07:30',
          end: '19:00',
          days: DAY_GROUPS.weekdays,
          enabled: true,
        },
      ],
      announcements: [
        {
          id: uid(),
          title: 'Приветствие гостей',
          repeat: 'daily',
          time: '09:00',
          days: DAY_GROUPS.all,
          track: { type: 'custom', name: 'Welcome chime.mp3' },
          offsetMinutes: 0,
          enabled: true,
        },
      ],
      player: createDemoPlayer(0),
    },
    {
      id: 'z2',
      name: 'Кафе',
      deviceIps: ['192.168.0.37'],
      playlistIds: [],
      playbackWindows: [
        {
          id: uid(),
          label: 'Основной поток',
          start: '08:00',
          end: '22:00',
          days: DAY_GROUPS.all,
          enabled: true,
        },
      ],
      announcements: [
        {
          id: uid(),
          title: 'Меню дня',
          repeat: 'daily',
          time: '12:00',
          days: DAY_GROUPS.all,
          track: { type: 'custom', name: 'Chef special.mp3' },
          offsetMinutes: 0,
          enabled: true,
        },
        {
          id: uid(),
          title: 'Счастливый час',
          repeat: 'hourly',
          time: '17:00',
          days: DAY_GROUPS.weekdays,
          track: { type: 'custom', name: 'Promo sweep.wav' },
          offsetMinutes: 15,
          enabled: true,
        },
      ],
      player: createDemoPlayer(1),
    },
    {
      id: 'z3',
      name: 'Терраса',
      deviceIps: ['192.168.0.52'],
      playlistIds: [],
      playbackWindows: [
        {
          id: uid(),
          label: 'Выходные вечера',
          start: '16:00',
          end: '23:30',
          days: DAY_GROUPS.weekend,
          enabled: true,
        },
      ],
      announcements: [
        {
          id: uid(),
          title: 'Анонс DJ-сета',
          repeat: 'weekly',
          time: '18:30',
          days: ['fri','sat'],
          track: { type: 'custom', name: 'DJ tonight.mp3' },
          offsetMinutes: 0,
          enabled: true,
        },
      ],
      player: createDemoPlayer(2),
    },
  ]
}

const defaultZones = createDefaultZones()

const DAY_ORDER = WEEK_DAYS.map(d => d.value)

function normalizeWindow(entry = {}){
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

function normalizeTrack(track){
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

function normalizeAnnouncement(entry = {}){
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

function cloneWindowData(entry){
  const normalized = normalizeWindow(entry)
  return {
    ...normalized,
    days: normalized.days.slice(),
  }
}

function cloneAnnouncementData(entry){
  const normalized = normalizeAnnouncement(entry)
  return {
    ...normalized,
    days: normalized.days ? normalized.days.slice() : [],
    track: { ...normalized.track },
  }
}

function timeToMinutes(value){
  if (typeof value !== 'string') return 0
  const [h = '0', m = '0'] = value.split(':')
  const hours = Number(h)
  const minutes = Number(m)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

function isSameDaySet(source, target){
  if (!Array.isArray(source) || !Array.isArray(target)) return false
  if (source.length !== target.length) return false
  const sortedSource = source.slice().sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
  const sortedTarget = target.slice().sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
  return sortedSource.every((value, idx) => value === sortedTarget[idx])
}

function formatDaysForDisplay(days = []){
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

function describeAnnouncement(entry){
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

function resolveAnnouncementTrackLabel(entry, lists){
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

function createDemoPlaylists(){
  return [
    {
      id: uid(),
      name: 'Утренний эфир',
      tracks: [
        { id: uid(), name: 'Opening Intro.mp3' },
        { id: uid(), name: 'Morning Jazz Loop.wav' },
        { id: uid(), name: 'Daily Announcements.mp3' },
      ],
    },
    {
      id: uid(),
      name: 'Дневное настроение',
      tracks: [
        { id: uid(), name: 'Chill Lounge 01.mp3' },
        { id: uid(), name: 'Citywalk Groove.mp3' },
        { id: uid(), name: 'Acoustic Breeze.flac' },
      ],
    },
    {
      id: uid(),
      name: 'Вечерняя витрина',
      tracks: [
        { id: uid(), name: 'Ambient Bloom.mp3' },
        { id: uid(), name: 'Night Lights.wav' },
      ],
    },
  ]
}

export default function Schedule(){
  // устройства из сети
  const [devices, setDevices] = useState(scheduleFallbackDevices)
  // зоны: [{id,name,deviceIp,playlistIds:[]}]
  const [zones, setZones] = useState(()=> {
    const stored = ls.get('sk_zones', defaultZones)
    const source = Array.isArray(stored) && stored.length ? stored : defaultZones
    return source.map((zone, idx) => {
      const fallback = defaultZones[idx] || {}
      const deviceIps = Array.isArray(zone.deviceIps)
        ? Array.from(new Set(zone.deviceIps.filter(Boolean)))
        : zone.deviceIp
          ? [zone.deviceIp]
          : Array.isArray(fallback.deviceIps)
            ? fallback.deviceIps
            : []
      const playlists = Array.isArray(zone.playlistIds) ? zone.playlistIds : []
      const windows = Array.isArray(zone.playbackWindows) && zone.playbackWindows.length
        ? zone.playbackWindows
        : fallback.playbackWindows || [createDefaultWindow()]
      const announcements = Array.isArray(zone.announcements) && zone.announcements.length
        ? zone.announcements
        : fallback.announcements || []
      return {
        id: zone.id || fallback.id || `z${idx+1}`,
        name: zone.name || fallback.name || `Зона ${idx+1}`,
        playlistIds: playlists,
        deviceIps,
        playbackWindows: windows.map(normalizeWindow),
        announcements: announcements.map(normalizeAnnouncement),
        player: normalizePlayer(zone.player, fallback.player, idx),
      }
    })
  })
  // плейлисты: [{id,name,tracks:[{id,name}]}]
  const [lists, setLists] = useState(()=> {
    const stored = ls.get('sk_playlists', [])
    if (Array.isArray(stored) && stored.length) return stored
    return createDemoPlaylists()
  })
  const [transfers, setTransfers] = useState(()=> ls.get('sk_transfers', {}))
  const transferTimers = useRef({})

  const [dialog, setDialog] = useState({ mode: null, id: null, zoneId: null, targetId: null })
  const [dialogValue, setDialogValue] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [dialogData, setDialogData] = useState(null)

  const activeZone = useMemo(() => {
    const zoneId = dialog.zoneId || dialog.id
    return zones.find(z => z.id === zoneId) || null
  }, [zones, dialog])
  const activeList = useMemo(() => lists.find(l => l.id === dialog.id), [lists, dialog])
  const activeWindow = useMemo(() => {
    if (!activeZone) return null
    return activeZone.playbackWindows.find(w => w.id === dialog.targetId) || null
  }, [activeZone, dialog.targetId])
  const activeAnnouncement = useMemo(() => {
    if (!activeZone) return null
    return activeZone.announcements.find(a => a.id === dialog.targetId) || null
  }, [activeZone, dialog.targetId])
  const allTracks = useMemo(() => (
    lists.flatMap(list =>
      (list.tracks || []).map(track => ({
        listId: list.id,
        trackId: track.id,
        label: `${track.name} • ${list.name}`,
      }))
    )
  ), [lists])

  const dialogTitle = useMemo(() => {
    switch(dialog.mode){
      case 'createZone': return 'Новая зона'
      case 'renameZone': return 'Переименовать зону'
      case 'deleteZone': return 'Удалить зону'
      case 'createList': return 'Новый плейлист'
      case 'renameList': return 'Переименовать плейлист'
      case 'deleteList': return 'Удалить плейлист'
      case 'addWindow': return 'Временное окно'
      case 'editWindow': return 'Настройки окна'
      case 'deleteWindow': return 'Удалить временное окно'
      case 'addAnnouncement': return 'Новое включение'
      case 'editAnnouncement': return 'Настройки включения'
      case 'deleteAnnouncement': return 'Удалить включение'
      default: return ''
    }
  }, [dialog.mode])

  function closeDialog(){
    setDialog({ mode: null, id: null, zoneId: null, targetId: null })
    setDialogValue('')
    setDialogError('')
    setDialogData(null)
  }

  async function scanDevices(){
    try{
      const res = await api.scan()
      const normalized = normalizeScheduleDevices(res)
      setDevices(Array.isArray(normalized) && normalized.length ? normalized : scheduleFallbackDevices)
    }catch{
      setDevices(scheduleFallbackDevices)
    }
  }

  useEffect(()=>{ scanDevices() },[])
  useEffect(()=> ls.set('sk_zones', zones), [zones])
  useEffect(()=> ls.set('sk_playlists', lists), [lists])
  useEffect(()=> ls.set('sk_transfers', transfers), [transfers])

  useEffect(() => {
    const validKeys = new Set()
    zones.forEach(zone => {
      zone.playlistIds.forEach(listId => {
        zone.deviceIps.forEach(ip => {
          if (!ip) return
          validKeys.add(transferKey(zone.id, listId, ip))
        })
      })
    })

    setTransfers(prev => {
      let changed = false
      const next = {}

      validKeys.forEach(key => {
        if (prev[key]) {
          next[key] = prev[key]
        } else {
          next[key] = { status: 'pending', progress: 0 }
          changed = true
        }
      })

      Object.keys(prev).forEach(key => {
        if (!validKeys.has(key)) {
          changed = true
        }
      })

      if (!changed && Object.keys(prev).length === validKeys.size) {
        return prev
      }

      return next
    })
  }, [zones])

  useEffect(() => {
    Object.entries(transfers).forEach(([key, entry]) => {
      if (entry.status === 'pending' && !transferTimers.current[key]) {
        transferTimers.current[key] = setInterval(() => {
          setTransfers(prev => {
            const current = prev[key]
            if (!current || current.status !== 'pending') return prev
            const increment = 10 + Math.random() * 18
            const nextProgress = Math.min(100, current.progress + increment)
            const done = nextProgress >= 100
            return {
              ...prev,
              [key]: {
                status: done ? 'success' : 'pending',
                progress: nextProgress,
              },
            }
          })
        }, 700 + Math.random() * 500)
      }
    })

    Object.keys(transferTimers.current).forEach(key => {
      if (!transfers[key] || transfers[key].status !== 'pending') {
        clearInterval(transferTimers.current[key])
        delete transferTimers.current[key]
      }
    })
  }, [transfers])

  useEffect(() => () => {
    Object.values(transferTimers.current || {}).forEach(timer => clearInterval(timer))
  }, [])

  function createZoneWithName(name){
    setZones(z => [...z, {
      id: uid(),
      name,
      deviceIps: [],
      playlistIds: [],
      playbackWindows: [createDefaultWindow()],
      announcements: [],
      player: createEmptyPlayer(),
    }])
  }
  function renameZoneWithName(id, name){
    setZones(z => z.map(x => x.id===id? {...x, name}:x))
  }
  function deleteZone(id){
    setZones(z => z.filter(x => x.id!==id))
  }
  function toggleZoneDevice(zoneId, ip){
    if (!ip) return
    setZones(z => z.map(x => {
      if (x.id !== zoneId) return x
      const exists = x.deviceIps.includes(ip)
      const next = exists ? x.deviceIps.filter(d => d !== ip) : [...x.deviceIps, ip]
      return { ...x, deviceIps: next }
    }))
  }
  function removeZoneDevice(zoneId, ip){
    setZones(z => z.map(x => x.id===zoneId? {...x, deviceIps:x.deviceIps.filter(d=>d!==ip)}:x))
  }

  function addPlaybackWindow(zoneId, data){
    if (!zoneId) return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      const entry = normalizeWindow({ ...data, id: uid() })
      return { ...zone, playbackWindows: [...zone.playbackWindows, entry] }
    }))
  }

  function updatePlaybackWindow(zoneId, windowId, updates){
    if (!zoneId || !windowId) return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      return {
        ...zone,
        playbackWindows: zone.playbackWindows.map(win => win.id === windowId
          ? normalizeWindow({ ...win, ...updates, id: windowId })
          : win
        ),
      }
    }))
  }

  function togglePlaybackWindow(zoneId, windowId){
    if (!zoneId || !windowId) return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      return {
        ...zone,
        playbackWindows: zone.playbackWindows.map(win => win.id === windowId
          ? { ...win, enabled: !win.enabled }
          : win
        ),
      }
    }))
  }

  function deletePlaybackWindow(zoneId, windowId){
    if (!zoneId || !windowId) return
    setZones(z => z.map(zone => zone.id === zoneId
      ? { ...zone, playbackWindows: zone.playbackWindows.filter(win => win.id !== windowId) }
      : zone
    ))
  }

  function addAnnouncement(zoneId, data){
    if (!zoneId) return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      const entry = normalizeAnnouncement({ ...data, id: uid() })
      return { ...zone, announcements: [...zone.announcements, entry] }
    }))
  }

  function updateAnnouncement(zoneId, announcementId, updates){
    if (!zoneId || !announcementId) return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      return {
        ...zone,
        announcements: zone.announcements.map(a => a.id === announcementId
          ? normalizeAnnouncement({ ...a, ...updates, id: announcementId })
          : a
        ),
      }
    }))
  }

  function toggleAnnouncement(zoneId, announcementId){
    if (!zoneId || !announcementId) return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      return {
        ...zone,
        announcements: zone.announcements.map(a => a.id === announcementId
          ? { ...a, enabled: !a.enabled }
          : a
        ),
      }
    }))
  }

  function handleZonePlayerAction(zoneId, action){
    if (!zoneId || !action) return
    setZones(prev => prev.map((zone, idx) => {
      if (zone.id !== zoneId) return zone

      const player = normalizePlayer(zone.player, defaultZones[idx]?.player, idx)
      const assignedLists = zone.playlistIds
        .map(listId => lists.find(l => l.id === listId))
        .filter(Boolean)
      const pool = assignedLists.flatMap(list =>
        (list.tracks || []).map(track => ({
          id: track.id,
          listId: list.id,
          listName: list.name,
          name: track.name,
        }))
      )
      const fallbackQueue = demoPlayerPresets.map((preset, presetIdx) => ({
        id: `demo-${presetIdx}`,
        listId: null,
        listName: preset.playlist,
        name: preset.track,
      }))
      const queue = pool.length ? pool : (fallbackQueue.length ? fallbackQueue : [{
        id: 'demo-fallback',
        listId: null,
        listName: player.playlist || 'Эфир EraSound',
        name: player.track || 'Демонстрация',
      }])

      const findIndex = () => {
        if (!queue.length) return -1
        const byId = queue.findIndex(item => item.id && player.trackId && item.id === player.trackId)
        if (byId !== -1) return byId
        if (!player.track) return -1
        return queue.findIndex(item => item.name === player.track)
      }

      const currentIndex = findIndex()

      if (action === 'stop'){
        return {
          ...zone,
          player: {
            ...player,
            isPlaying: false,
            progress: 0,
          },
        }
      }

      if (action === 'play'){
        const target = currentIndex >= 0 ? queue[currentIndex] : queue[0]
        return {
          ...zone,
          player: {
            ...player,
            isPlaying: true,
            track: target?.name || player.track,
            playlist: target?.listName || player.playlist,
            listId: target?.listId ?? player.listId,
            trackId: target?.id ?? player.trackId,
          },
        }
      }

      if (action === 'next' || action === 'prev'){
        if (!queue.length){
          return {
            ...zone,
            player: {
              ...player,
              isPlaying: true,
              progress: 0,
            },
          }
        }
        const delta = action === 'next' ? 1 : -1
        const baseIndex = currentIndex >= 0 ? currentIndex : 0
        const nextIndex = (baseIndex + delta + queue.length) % queue.length
        const target = queue[nextIndex]
        return {
          ...zone,
          player: {
            ...player,
            isPlaying: true,
            progress: 0,
            track: target?.name || player.track,
            playlist: target?.listName || player.playlist,
            listId: target?.listId ?? player.listId,
            trackId: target?.id ?? player.trackId,
          },
        }
      }

      return zone
    }))
  }

  function deleteAnnouncement(zoneId, announcementId){
    if (!zoneId || !announcementId) return
    setZones(z => z.map(zone => zone.id === zoneId
      ? { ...zone, announcements: zone.announcements.filter(a => a.id !== announcementId) }
      : zone
    ))
  }

  function createListWithName(name){
    setLists(l => [...l, { id:uid(), name, tracks:[] }])
  }
  function renameListWithName(id, name){
    setLists(l => l.map(x => x.id===id? {...x, name}:x))
  }
  function deleteList(id){
    setLists(l => l.filter(x => x.id!==id))
    setZones(z => z.map(x => ({...x, playlistIds:x.playlistIds.filter(p=>p!==id)})))
  }
  function addFilesToList(id, fileList){
    const fs = Array.from(fileList||[])
    if(!fs.length) return
    setLists(l => l.map(x => x.id===id? {...x, tracks:[...x.tracks, ...fs.map(f=>({id:uid(), name:f.name}))]}:x))
  }

  // DnD: playlist -> zone
  function onDragStartPlaylist(e, listId){
    e.dataTransfer.setData('application/x-sk', JSON.stringify({type:'playlist', id:listId}))
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDropToZone(e, zoneId){
    e.preventDefault()
    const data = e.dataTransfer.getData('application/x-sk')
    if(!data) return
    const payload = JSON.parse(data)
    if(payload.type!=='playlist') return
    setZones(z => z.map(x => {
      if (x.id!==zoneId) return x
      if (x.playlistIds.includes(payload.id)) return x
      return {...x, playlistIds:[...x.playlistIds, payload.id]}
    }))
  }
  function unassign(zoneId, listId){
    setZones(z => z.map(x => x.id===zoneId? {...x, playlistIds:x.playlistIds.filter(id=>id!==listId)}:x))
  }

  function openDialog(mode, options = {}){
    setDialog({
      mode,
      id: options.id ?? null,
      zoneId: options.zoneId ?? null,
      targetId: options.targetId ?? null,
    })
    setDialogValue(options.value ?? '')
    setDialogError('')

    if(['addWindow','editWindow'].includes(mode)){
      const seed = options.data ? cloneWindowData(options.data) : cloneWindowData(createDefaultWindow())
      setDialogData(seed)
    }else if(['addAnnouncement','editAnnouncement'].includes(mode)){
      const seed = options.data ? cloneAnnouncementData(options.data) : cloneAnnouncementData(createDefaultAnnouncement())
      setDialogData(seed)
    }else{
      setDialogData(null)
    }
  }

  function handleDialogSubmit(e){
    if(e?.preventDefault) e.preventDefault()
    const value = dialogValue.trim()

    if(['createZone','renameZone','createList','renameList'].includes(dialog.mode)){
      if(!value){
        setDialogError('Введите название, чтобы сохранить изменения.')
        return
      }
    }

    switch(dialog.mode){
      case 'createZone':
        createZoneWithName(value)
        break
      case 'renameZone':
        if(dialog.id) renameZoneWithName(dialog.id, value)
        break
      case 'createList':
        createListWithName(value)
        break
      case 'renameList':
        if(dialog.id) renameListWithName(dialog.id, value)
        break
      case 'deleteZone':
        if(dialog.id) deleteZone(dialog.id)
        break
      case 'deleteList':
        if(dialog.id) deleteList(dialog.id)
        break
      case 'deleteWindow':
        if(dialog.zoneId && dialog.targetId) deletePlaybackWindow(dialog.zoneId, dialog.targetId)
        break
      case 'deleteAnnouncement':
        if(dialog.zoneId && dialog.targetId) deleteAnnouncement(dialog.zoneId, dialog.targetId)
        break
      default:
        break
    }

    closeDialog()
  }

  function toggleDialogDay(day){
    setDialogData(data => {
      if (!data) return data
      const set = new Set(data.days || [])
      if (set.has(day)){
        set.delete(day)
      }else{
        set.add(day)
      }
      return { ...data, days: Array.from(set) }
    })
    setDialogError('')
  }

  function setDialogDays(days){
    setDialogData(data => data ? { ...data, days: days.slice() } : data)
    setDialogError('')
  }

  function handleWindowFormSubmit(e){
    if(e?.preventDefault) e.preventDefault()
    if(!dialogData) return
    const label = (dialogData.label || '').trim()
    const start = dialogData.start || '00:00'
    const end = dialogData.end || '00:00'
    const days = Array.isArray(dialogData.days) ? dialogData.days.filter(Boolean) : []

    if(!label){
      setDialogError('Введите название окна, чтобы сохранить изменения.')
      return
    }
    if(!days.length){
      setDialogError('Выберите хотя бы один день недели.')
      return
    }
    if(timeToMinutes(end) <= timeToMinutes(start)){
      setDialogError('Время окончания должно быть позже времени начала.')
      return
    }

    const payload = {
      ...dialogData,
      label,
      start,
      end,
      days,
    }

    if(dialog.mode === 'addWindow'){
      addPlaybackWindow(dialog.zoneId, payload)
    }else if(dialog.mode === 'editWindow'){
      updatePlaybackWindow(dialog.zoneId, dialog.targetId, payload)
    }

    closeDialog()
  }

  function handleAnnouncementFormSubmit(e){
    if(e?.preventDefault) e.preventDefault()
    if(!dialogData) return

    const title = (dialogData.title || '').trim()
    if(!title){
      setDialogError('Введите название включения.')
      return
    }

    const repeat = dialogData.repeat || 'daily'
    const base = { ...dialogData, title, repeat }

    if(repeat === 'weekly'){
      const days = Array.isArray(dialogData.days) ? dialogData.days.filter(Boolean) : []
      if(!days.length){
        setDialogError('Выберите дни недели для запуска.')
        return
      }
      base.days = days
    }else if(repeat === 'daily'){
      base.days = DAY_GROUPS.all
    }else{
      base.days = Array.isArray(dialogData.days) ? dialogData.days.filter(Boolean) : []
    }

    if(repeat === 'hourly'){
      const offset = Math.max(0, Math.min(59, Number(dialogData.offsetMinutes) || 0))
      base.offsetMinutes = offset
      base.time = dialogData.time || '00:00'
    }else{
      if(!dialogData.time){
        setDialogError('Укажите время запуска объявления.')
        return
      }
      base.time = dialogData.time
      base.offsetMinutes = dialogData.offsetMinutes ?? 0
    }

    if(dialogData.track?.type === 'library'){
      if(!dialogData.track.listId || !dialogData.track.trackId){
        setDialogError('Выберите трек из библиотеки или переключитесь на собственный файл.')
        return
      }
      base.track = {
        type: 'library',
        listId: dialogData.track.listId,
        trackId: dialogData.track.trackId,
      }
    }else{
      const name = (dialogData.track?.name || '').trim()
      if(!name){
        setDialogError('Введите название или файл объявления.')
        return
      }
      base.track = { type: 'custom', name }
    }

    if(dialog.mode === 'addAnnouncement'){
      addAnnouncement(dialog.zoneId, base)
    }else if(dialog.mode === 'editAnnouncement'){
      updateAnnouncement(dialog.zoneId, dialog.targetId, base)
    }

    closeDialog()
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* ======= ЗОНЫ ======= */}
      <SectionHeader
        title="Зоны"
        subtitle="Связывайте несколько устройств с зоной и отслеживайте прогресс загрузки плейлистов."
        actions={<>
          <button className="btn" onClick={()=>openDialog('createZone')}>+ Зона</button>
          <button className="btn" onClick={scanDevices}>Сканировать устройства</button>
        </>}
      />

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {zones.map(z => (
          <ZoneCard
            key={z.id}
            z={z}
            devices={devices}
            lists={lists}
            transfers={transfers}
            onToggleDevice={(ip)=>toggleZoneDevice(z.id, ip)}
            onRemoveDevice={(ip)=>removeZoneDevice(z.id, ip)}
            onRename={()=>openDialog('renameZone', { id: z.id, value: z.name })}
            onDelete={()=>openDialog('deleteZone', { id: z.id })}
            onUnassign={(listId)=>unassign(z.id, listId)}
            onDrop={(e)=>onDropToZone(e, z.id)}
            onAddWindow={()=>openDialog('addWindow', { zoneId: z.id, data: createDefaultWindow() })}
            onEditWindow={(window)=>openDialog('editWindow', { zoneId: z.id, targetId: window.id, data: window })}
            onDeleteWindow={(window)=>openDialog('deleteWindow', { zoneId: z.id, targetId: window.id })}
            onToggleWindow={(windowId)=>togglePlaybackWindow(z.id, windowId)}
            onAddAnnouncement={()=>openDialog('addAnnouncement', { zoneId: z.id, data: createDefaultAnnouncement() })}
            onEditAnnouncement={(entry)=>openDialog('editAnnouncement', { zoneId: z.id, targetId: entry.id, data: entry })}
            onDeleteAnnouncement={(entry)=>openDialog('deleteAnnouncement', { zoneId: z.id, targetId: entry.id })}
            onToggleAnnouncement={(announcementId)=>toggleAnnouncement(z.id, announcementId)}
            onPlayerAction={(action)=>handleZonePlayerAction(z.id, action)}
          />
        ))}
      </div>

      {/* ======= ПЛЕЙЛИСТЫ ======= */}
      <SectionHeader
        title="Плейлисты"
        subtitle="Готовые подборки для витрины — перетащите на нужную зону или загрузите новые треки."
        actions={<button className="btn" onClick={()=>openDialog('createList')}>+ Плейлист</button>}
      />

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {lists.map(pl=>(
            <PlaylistCard
              key={pl.id}
              pl={pl}
              onRename={()=>openDialog('renameList', { id: pl.id, value: pl.name })}
              onDelete={()=>openDialog('deleteList', { id: pl.id })}
              onDragStart={(e)=>onDragStartPlaylist(e, pl.id)}
              onAddFiles={(files)=>addFilesToList(pl.id, files)}
            />
          ))}
          {lists.length===0 && (
            <motion.div className="panel p-6 text-white/60" initial={{opacity:0}} animate={{opacity:1}}>
              Плейлистов нет. Создайте первый.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={!!dialog.mode} onClose={closeDialog} title={dialogTitle}>
        {dialog.mode && (
          <div className="space-y-4">
            {['createZone','renameZone','createList','renameList'].includes(dialog.mode) && (
              <form className="space-y-4" onSubmit={handleDialogSubmit}>
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">
                    {dialog.mode.includes('Zone') ? 'Название зоны' : 'Название плейлиста'}
                  </label>
                  <input
                    autoFocus
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    placeholder={dialog.mode.includes('Zone') ? 'Например, Лобби' : 'Например, Фоновая музыка'}
                    value={dialogValue}
                    onChange={(e)=>{ setDialogValue(e.target.value); setDialogError('') }}
                  />
                  {dialogError && <div className="text-xs text-rose-300">{dialogError}</div>}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" className="btn glass" onClick={closeDialog}>Отмена</button>
                  <button type="submit" className="btn">Сохранить</button>
                </div>
              </form>
            )}

            {['addWindow','editWindow'].includes(dialog.mode) && dialogData && (
              <form className="space-y-4" onSubmit={handleWindowFormSubmit}>
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Название окна</label>
                  <input
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.label || ''}
                    onChange={(e)=>{ setDialogData(data => data ? { ...data, label: e.target.value } : data); setDialogError('') }}
                    placeholder="Например, Утренний поток"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 block">Начало</label>
                    <input
                      type="time"
                      className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                      value={dialogData.start || ''}
                      onChange={(e)=>{ setDialogData(data => data ? { ...data, start: e.target.value } : data); setDialogError('') }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 block">Окончание</label>
                    <input
                      type="time"
                      className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                      value={dialogData.end || ''}
                      onChange={(e)=>{ setDialogData(data => data ? { ...data, end: e.target.value } : data); setDialogError('') }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-white/70">Дни недели</div>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map(day => {
                      const checked = dialogData.days?.includes(day.value)
                      return (
                        <button
                          type="button"
                          key={day.value}
                          onClick={()=>toggleDialogDay(day.value)}
                          className={`rounded-full px-3 py-1 text-xs transition-colors border
                            ${checked ? 'border-sky-400/70 bg-sky-400/10 text-sky-100' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-white/50">
                    <button type="button" className="underline-offset-2 hover:underline" onClick={()=>setDialogDays(DAY_GROUPS.all)}>Все</button>
                    <button type="button" className="underline-offset-2 hover:underline" onClick={()=>setDialogDays(DAY_GROUPS.weekdays)}>Будни</button>
                    <button type="button" className="underline-offset-2 hover:underline" onClick={()=>setDialogDays(DAY_GROUPS.weekend)}>Выходные</button>
                    <button type="button" className="underline-offset-2 hover:underline" onClick={()=>setDialogDays([])}>Очистить</button>
                  </div>
                </div>
                {dialogError && <div className="text-xs text-rose-300">{dialogError}</div>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" className="btn glass" onClick={closeDialog}>Отмена</button>
                  <button type="submit" className="btn">{dialog.mode === 'addWindow' ? 'Добавить' : 'Сохранить'}</button>
                </div>
              </form>
            )}

            {['addAnnouncement','editAnnouncement'].includes(dialog.mode) && dialogData && (
              <form className="space-y-4" onSubmit={handleAnnouncementFormSubmit}>
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Название включения</label>
                  <input
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.title || ''}
                    onChange={(e)=>{ setDialogData(data => data ? { ...data, title: e.target.value } : data); setDialogError('') }}
                    placeholder="Например, Анонс мероприятия"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Периодичность</label>
                  <select
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.repeat || 'daily'}
                    onChange={(e)=>{
                      const value = e.target.value
                      setDialogData(data => {
                        if(!data) return data
                        let nextDays = data.days || []
                        if(value === 'daily') nextDays = DAY_GROUPS.all
                        if(value === 'weekly' && (!nextDays || !nextDays.length)) nextDays = ['mon']
                        return { ...data, repeat: value, days: nextDays }
                      })
                      setDialogError('')
                    }}
                  >
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">По дням недели</option>
                    <option value="hourly">Каждый час</option>
                  </select>
                </div>

                {dialogData.repeat !== 'hourly' && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 block">Время запуска</label>
                    <input
                      type="time"
                      className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                      value={dialogData.time || ''}
                      onChange={(e)=>{ setDialogData(data => data ? { ...data, time: e.target.value } : data); setDialogError('') }}
                    />
                  </div>
                )}

                {dialogData.repeat === 'hourly' && (
                  <div className="space-y-2">
                    <label className="text-sm text-white/70 block">Минута внутри часа</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                      value={dialogData.offsetMinutes ?? 0}
                      onChange={(e)=>{ setDialogData(data => data ? { ...data, offsetMinutes: e.target.value } : data); setDialogError('') }}
                    />
                  </div>
                )}

                {dialogData.repeat === 'weekly' && (
                  <div className="space-y-2">
                    <div className="text-sm text-white/70">Дни недели</div>
                    <div className="flex flex-wrap gap-2">
                      {WEEK_DAYS.map(day => {
                        const checked = dialogData.days?.includes(day.value)
                        return (
                          <button
                            type="button"
                            key={day.value}
                            onClick={()=>toggleDialogDay(day.value)}
                            className={`rounded-full px-3 py-1 text-xs transition-colors border
                              ${checked ? 'border-sky-400/70 bg-sky-400/10 text-sky-100' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Источник трека</label>
                  {(() => {
                    const selection = dialogData.track?.type === 'library'
                      ? `library:${dialogData.track.listId}:${dialogData.track.trackId}`
                      : 'custom'
                    return (
                      <>
                        <select
                          className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                          value={selection}
                          onChange={(e)=>{
                            const value = e.target.value
                            if(value.startsWith('library:')){
                              const [, listId, trackId] = value.split(':')
                              setDialogData(data => data ? { ...data, track: { type: 'library', listId, trackId } } : data)
                            }else{
                              setDialogData(data => data ? {
                                ...data,
                                track: {
                                  type: 'custom',
                                  name: data.track?.type === 'custom' ? data.track.name : '',
                                },
                              } : data)
                            }
                            setDialogError('')
                          }}
                        >
                          <option value="custom">Произвольный файл / поток</option>
                          {allTracks.map(opt => (
                            <option key={`${opt.listId}:${opt.trackId}`} value={`library:${opt.listId}:${opt.trackId}`}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {selection === 'custom' && (
                          <input
                            className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                            value={dialogData.track?.name || ''}
                            onChange={(e)=>{ setDialogData(data => data ? { ...data, track: { type: 'custom', name: e.target.value } } : data); setDialogError('') }}
                            placeholder="Например, Announcement.mp3"
                          />
                        )}
                      </>
                    )
                  })()}
                </div>

                {dialogError && <div className="text-xs text-rose-300">{dialogError}</div>}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" className="btn glass" onClick={closeDialog}>Отмена</button>
                  <button type="submit" className="btn">{dialog.mode === 'addAnnouncement' ? 'Добавить' : 'Сохранить'}</button>
                </div>
              </form>
            )}

            {['deleteZone','deleteList','deleteWindow','deleteAnnouncement'].includes(dialog.mode) && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-white/80">
                    {dialog.mode==='deleteZone' && (
                      <>Вы уверены, что хотите удалить зону «{activeZone?.name}»?</>
                    )}
                    {dialog.mode==='deleteList' && (
                      <>Вы уверены, что хотите удалить плейлист «{activeList?.name}»?</>
                    )}
                    {dialog.mode==='deleteWindow' && (
                      <>Удалить временное окно «{activeWindow?.label}»?</>
                    )}
                    {dialog.mode==='deleteAnnouncement' && (
                      <>Удалить включение «{activeAnnouncement?.title}»?</>
                    )}
                  </div>
                  {dialog.mode==='deleteList' && (
                    <div className="text-xs text-white/60">Она будет отвязана от всех зон.</div>
                  )}
                  {dialog.mode==='deleteWindow' && (
                    <div className="text-xs text-white/60">Расписание зоны обновится сразу после удаления.</div>
                  )}
                  {dialog.mode==='deleteAnnouncement' && (
                    <div className="text-xs text-white/60">Запланированное объявление перестанет воспроизводиться.</div>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" className="btn glass" onClick={closeDialog}>Отмена</button>
                  <button type="button" className="btn bg-rose-500/40" onClick={handleDialogSubmit}>Удалить</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ======================= UI PRIMITIVES ======================= */

function SectionHeader({title, subtitle, actions}){
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-sm text-white/60">{subtitle}</div>
      </div>
      <div className="flex gap-2">{actions}</div>
      {/* минимализм: тонкая линия-разделитель */}
      <div className="w-full h-px bg-white/10 md:hidden" />
    </div>
  )
}

// Прямоугольная “панель”: минимум скругления, строгая сетка
const panelClass = 'panel bg-white/5 border border-white/10 rounded-lg shadow-glass'

/* ======================= ZONE CARD ======================= */


function ZoneCard({
  z,
  devices,
  lists,
  transfers,
  onToggleDevice,
  onRemoveDevice,
  onRename,
  onDelete,
  onUnassign,
  onDrop,
  onAddWindow,
  onEditWindow,
  onDeleteWindow,
  onToggleWindow,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onToggleAnnouncement,
  onPlayerAction,
}){
  const assigned = z.playlistIds.map(id => lists.find(l => l.id === id)).filter(Boolean)
  const selectedDevices = z.deviceIps.map(ip => devices.find(d => d.ip === ip) || { ip, name: ip })
  const availableDevices = devices.filter(d => !z.deviceIps.includes(d.ip))
  const playbackWindows = Array.isArray(z.playbackWindows) ? z.playbackWindows : []
  const announcements = Array.isArray(z.announcements) ? z.announcements : []
  const [over, setOver] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const deviceCount = selectedDevices.length
  const playlistCount = assigned.length
  const windowCount = playbackWindows.length
  const activeWindowCount = playbackWindows.filter(win => win.enabled).length
  const announcementCount = announcements.length
  const activeAnnouncements = announcements.filter(item => item.enabled).length

  const primaryAnnouncement = announcements.find(item => item.enabled) || announcements[0]
  const nextAnnouncementLabel = primaryAnnouncement
    ? describeAnnouncement(primaryAnnouncement)
    : 'Не запланировано'

  const player = z.player || createEmptyPlayer()
  const rawProgress = typeof player.progress === 'number'
    ? (player.progress > 1 ? player.progress / 100 : player.progress)
    : 0
  const normalizedProgress = clamp01(rawProgress)
  const progressPercent = Math.round(normalizedProgress * 100)
  const trackLength = typeof player.length === 'number' ? player.length : 0
  const elapsedSeconds = Math.round(normalizedProgress * trackLength)

  const tabs = [
    { id: 'overview', label: 'Основное', Icon: IconOverview },
    { id: 'devices', label: 'Устройства', Icon: IconDevice },
    { id: 'playlists', label: 'Плейлисты', Icon: IconPlaylist },
    { id: 'schedule', label: 'Расписание', Icon: IconSchedule },
  ]

  const highlight = activeTab === 'playlists' && over

  function handleDragOver(e){
    e.preventDefault()
    if (!over) setOver(true)
    if (activeTab !== 'playlists') setActiveTab('playlists')
  }

  function handleDragLeave(){
    setOver(false)
  }

  function handleDrop(e){
    e.preventDefault()
    setOver(false)
    onDrop(e)
  }

  return (
    <motion.div
      layout
      className={`${panelClass} p-4 flex flex-col gap-5`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Зона</div>
              <div className="text-lg font-semibold truncate">{z.name}</div>
            </div>
            <div className="flex gap-2">
              <StatBubble label="Устройства" value={deviceCount} Icon={IconDeviceSmall} />
              <StatBubble label="Плейлисты" value={playlistCount} Icon={IconPlaylistSmall} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDevices.slice(0, 3).map(dev => (
              <DeviceStatusChip key={dev.ip} name={dev.name || dev.ip} status={resolveDeviceStatus(dev)} />
            ))}
            {deviceCount > 3 && (
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                + ещё {deviceCount - 3}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Сейчас в эфире</span>
            {player.playlist && <span className="max-w-[60%] truncate text-right text-white/40">{player.playlist}</span>}
          </div>
          {player.track ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-white/80 truncate">{player.track}</div>
              {player.artist && <div className="text-xs text-white/50 truncate">{player.artist}</div>}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CircleIconButton icon={<IconPrev className="h-4 w-4" />} label="Предыдущий трек" onClick={()=>onPlayerAction?.('prev')} />
                  <CircleIconButton icon={<IconPlay className="h-4 w-4" />} label="Воспроизвести" onClick={()=>onPlayerAction?.('play')} />
                  <CircleIconButton icon={<IconStop className="h-4 w-4" />} label="Остановить" onClick={()=>onPlayerAction?.('stop')} />
                  <CircleIconButton icon={<IconNext className="h-4 w-4" />} label="Следующий трек" onClick={()=>onPlayerAction?.('next')} />
                </div>
                <div className="flex w-full items-center gap-2 text-xs text-white/50 sm:w-auto sm:flex-1">
                  <span className="font-mono text-white/60">{formatClock(elapsedSeconds)}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-emerald-400/80 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="font-mono text-white/40">{formatClock(trackLength)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
              Назначьте плейлист в этой зоне, чтобы запустить эфир.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.Icon
            return (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                onClick={()=>setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
              </TabButton>
            )
          })}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <OverviewTile
                icon={<IconClock className="h-4 w-4" />}
                title="Окна эфира"
                value={`${activeWindowCount}/${windowCount || 0}`}
                hint={windowCount ? 'активно' : 'нет окон'}
              />
              <OverviewTile
                icon={<IconBell className="h-4 w-4" />}
                title="Точечные включения"
                value={`${activeAnnouncements}/${announcementCount || 0}`}
                hint={nextAnnouncementLabel}
              />
            </div>
            <div className="flex items-center gap-2">
              <CircleIconButton icon={<IconEdit className="h-4 w-4" />} label="Переименовать зону" onClick={onRename} />
              <CircleIconButton icon={<IconTrash className="h-4 w-4" />} label="Удалить зону" onClick={onDelete} tone="danger" />
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {selectedDevices.map(dev => (
                <DeviceDetailChip
                  key={dev.ip}
                  name={dev.name || dev.ip}
                  ip={dev.ip}
                  status={resolveDeviceStatus(dev)}
                  onRemove={()=>onRemoveDevice(dev.ip)}
                />
              ))}
              {selectedDevices.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-sm text-white/60">
                  Нет подключённых устройств — выберите узлы ниже.
                </div>
              )}
            </div>
            <DevicePicker available={availableDevices} onSelect={(ip)=>onToggleDevice(ip)} />
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className={`rounded-xl border ${highlight ? 'border-emerald-300/60 bg-emerald-300/5' : 'border-white/10 bg-white/5'} p-4 transition-colors`}>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Плейлисты зоны</span>
              <span className="text-white/40">{playlistCount ? `${playlistCount} назначено` : 'перетащите карточку'}</span>
            </div>
            <div className="mt-3 space-y-2">
              {assigned.map(pl => {
                const totalTracks = pl.tracks.length
                const snapshot = summarizeTransfers({
                  zoneId: z.id,
                  playlistId: pl.id,
                  devices: selectedDevices,
                  transfers,
                })
                return (
                  <div key={pl.id} className="rounded-lg border border-white/10 bg-neutral-900/60 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{pl.name}</div>
                        <div className="text-xs text-white/50">{totalTracks} трек(ов)</div>
                      </div>
                      <CircleIconButton icon={<IconMinus className="h-4 w-4" />} label="Убрать плейлист" onClick={()=>onUnassign(pl.id)} />
                    </div>
                    <TransferSummary snapshot={snapshot} />
                  </div>
                )
              })}
              {assigned.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-sm text-white/60">
                  Перетащите плейлист справа, чтобы запланировать эфир.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <SubsectionHeader
              title="Временные окна"
              subtitle={windowCount ? `${activeWindowCount} активны из ${windowCount}` : 'пока не создано'}
              actionLabel="Добавить окно"
              onAction={onAddWindow}
            />
            <div className="space-y-2">
              {playbackWindows.map(window => (
                <div key={window.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{window.label}</div>
                      <div className="text-xs text-white/50">{window.start} — {window.end}</div>
                    </div>
                    <ToggleChip active={window.enabled} onClick={()=>onToggleWindow(window.id)} labelOn="On" labelOff="Off" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                    <ScheduleBadge>{formatDaysForDisplay(window.days)}</ScheduleBadge>
                    <div className="ml-auto flex gap-1">
                      <CircleIconButton icon={<IconEdit className="h-4 w-4" />} label="Редактировать окно" onClick={()=>onEditWindow(window)} size="sm" variant="ghost" />
                      <CircleIconButton icon={<IconTrash className="h-4 w-4" />} label="Удалить окно" onClick={()=>onDeleteWindow(window)} size="sm" variant="ghost" tone="danger" />
                    </div>
                  </div>
                </div>
              ))}
              {playbackWindows.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-sm text-white/60">
                  Добавьте временные окна, чтобы ограничить звучание по расписанию.
                </div>
              )}
            </div>

            <SubsectionHeader
              title="Точечные включения"
              subtitle={announcementCount ? nextAnnouncementLabel : 'пока не запланировано'}
              actionLabel="Добавить включение"
              onAction={onAddAnnouncement}
            />
            <div className="space-y-2">
              {announcements.map(entry => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{entry.title}</div>
                      <div className="text-xs text-white/50 truncate">{resolveAnnouncementTrackLabel(entry, lists)}</div>
                    </div>
                    <ToggleChip active={entry.enabled} onClick={()=>onToggleAnnouncement(entry.id)} labelOn="On" labelOff="Off" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                    <ScheduleBadge>{describeAnnouncement(entry)}</ScheduleBadge>
                    {entry.repeat === 'weekly' && entry.days?.length > 0 && (
                      <ScheduleBadge>{formatDaysForDisplay(entry.days)}</ScheduleBadge>
                    )}
                    <div className="ml-auto flex gap-1">
                      <CircleIconButton icon={<IconEdit className="h-4 w-4" />} label="Редактировать включение" onClick={()=>onEditAnnouncement(entry)} size="sm" variant="ghost" />
                      <CircleIconButton icon={<IconTrash className="h-4 w-4" />} label="Удалить включение" onClick={()=>onDeleteAnnouncement(entry)} size="sm" variant="ghost" tone="danger" />
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-sm text-white/60">
                  Настройте объявления и джинглы для событий и напоминаний.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function formatClock(seconds){
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '--:--'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function TabButton({ active, label, onClick, children }){
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${active ? 'bg-white/20 text-white shadow-glass' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
    >
      {children}
    </button>
  )
}

function CircleIconButton({ icon, label, onClick, tone = 'neutral', size = 'md', variant = 'solid' }){
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-sm' : size === 'xs' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-base'
  const palette = tone === 'danger'
    ? 'text-rose-200 hover:text-rose-100 focus-visible:ring-rose-400/40'
    : 'text-white/70 hover:text-white focus-visible:ring-white/30'
  const background = variant === 'ghost'
    ? 'bg-white/5 hover:bg-white/15'
    : 'bg-white/10 hover:bg-white/20'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${sizeClass} ${background} ${palette}`}
    >
      {icon}
    </button>
  )
}

function StatBubble({ Icon, label, value }){
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
      <Icon className="h-4 w-4 text-white/50" aria-hidden="true" />
      <span className="font-semibold text-white">{value}</span>
      <span className="text-white/40">{label}</span>
    </div>
  )
}

function DeviceStatusChip({ name, status }){
  const color = status === 'offline' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="truncate max-w-[8rem]">{name}</span>
    </div>
  )
}

function DeviceDetailChip({ name, ip, status, onRemove }){
  const color = status === 'offline' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <div className="min-w-0">
        <div className="truncate text-sm text-white/80">{name}</div>
        <div className="text-[11px] text-white/40">{ip}</div>
      </div>
      <CircleIconButton
        icon={<IconMinus className="h-3.5 w-3.5" />}
        label={`Убрать ${name}`}
        onClick={onRemove}
        size="xs"
        variant="ghost"
      />
    </div>
  )
}

function SubsectionHeader({ title, subtitle, onAction, actionLabel }){
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <div className="text-xs uppercase tracking-wide text-white/50">{title}</div>
        {subtitle && <div className="text-xs text-white/40">{subtitle}</div>}
      </div>
      {onAction && (
        <CircleIconButton icon={<IconPlus className="h-4 w-4" />} label={actionLabel} onClick={onAction} />
      )}
    </div>
  )
}

function OverviewTile({ icon, title, value, hint }){
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-white/60 text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {hint && <div className="text-xs text-white/40 truncate">{hint}</div>}
    </div>
  )
}

function resolveDeviceStatus(device){
  const raw = (device?.status || '').toString().toLowerCase()
  if (raw.includes('off') || raw === 'red') return 'offline'
  if (raw.includes('warn') || raw.includes('degrad') || raw === 'yellow') return 'warning'
  if (device?.online === false) return 'offline'
  if (device?.online === true) return 'online'
  if (raw.includes('idle')) return 'warning'
  return 'online'
}

const IconOverview = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 7h14" />
    <path d="M5 12h10" />
    <path d="M5 17h6" />
  </svg>
)

const IconDevice = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="5" width="17" height="12" rx="2" />
    <path d="M8 19h8" />
  </svg>
)

const IconPlaylist = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 8h10" />
    <path d="M5 12h8" />
    <path d="M5 16h6" />
    <path d="M17 8v8.5a2.5 2.5 0 1 0 2-2.45V8h-2z" />
  </svg>
)

const IconSchedule = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 8v4l2.5 2.5" />
  </svg>
)

const IconDeviceSmall = IconDevice
const IconPlaylistSmall = IconPlaylist

const IconClock = IconSchedule

const IconBell = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 17H9a3 3 0 0 1-3-3v-2a6 6 0 0 1 12 0v2a3 3 0 0 1-3 3Z" />
    <path d="M13 21a1 1 0 0 1-2 0" />
  </svg>
)

const IconPlay = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
  </svg>
)

const IconStop = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </svg>
)

const IconNext = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 7l8 5-8 5V7z" fill="currentColor" />
    <path d="M19 7v10" />
  </svg>
)

const IconPrev = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 7l-8 5 8 5V7z" fill="currentColor" />
    <path d="M5 7v10" />
  </svg>
)

const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-2.12-2.12L6 17.88V20Z" />
  </svg>
)

const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 7h12" />
    <path d="M10 7v-2h4v2" />
    <path d="M8 7v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" />
  </svg>
)

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

const IconMinus = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
  </svg>
)
function summarizeTransfers({ zoneId, playlistId, devices, transfers }){
  if (!devices.length) {
    return { state: 'idle', progress: 0, total: 0, completed: 0 }
  }
  let progress = 0
  let completed = 0
  devices.forEach(dev => {
    const key = transferKey(zoneId, playlistId, dev.ip)
    const entry = transfers[key]
    if (entry?.status === 'success') {
      completed += 1
      progress += 100
    } else {
      const val = entry?.progress ?? 0
      progress += Math.max(0, Math.min(100, val))
    }
  })
  const avg = progress / devices.length
  if (completed === devices.length) {
    return { state: 'success', progress: 100, total: devices.length, completed }
  }
  return { state: 'progress', progress: Math.round(avg), total: devices.length, completed }
}

function TransferSummary({ snapshot }){
  if (snapshot.total === 0) {
    return (
      <div className="text-xs text-white/50">
        Добавьте устройство выше, чтобы выгрузить плейлист.
      </div>
    )
  }

  const barClass = snapshot.state === 'success' ? 'bg-emerald-400/80' : 'bg-sky-400/80'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{snapshot.completed}/{snapshot.total} устройств</span>
        <span className="text-white/70">{snapshot.state === 'success' ? 'Готово' : `${snapshot.progress}%`}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${snapshot.progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  )
}


function DevicePicker({ available, onSelect }){
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hasOptions = available.length > 0

  useEffect(() => {
    if (!open) return
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!hasOptions) setOpen(false)
  }, [hasOptions])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${hasOptions ? 'hover:bg-white/20 hover:text-white' : 'cursor-not-allowed opacity-40'}`}
        onClick={() => hasOptions && setOpen(v => !v)}
        disabled={!hasOptions}
        aria-label="Добавить устройство"
        title={hasOptions ? 'Добавить устройство' : 'Нет доступных устройств'}
      >
        <IconPlus className="h-4 w-4" />
      </button>
      {open && hasOptions && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-white/10 bg-neutral-950/90 backdrop-blur px-2 py-2 shadow-xl">
          <div className="text-xs text-white/40 px-3 pb-2">Доступные устройства</div>
          <div className="space-y-1 max-h-56 overflow-auto pr-1">
            {available.map(dev => (
              <button
                key={dev.ip}
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                onClick={() => { onSelect(dev.ip); setOpen(false) }}
              >
                <div className="font-medium truncate">{dev.name || dev.ip}</div>
                <div className="text-xs text-white/50">{dev.ip}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleChip({ active, onClick, labelOn = 'Вкл', labelOff = 'Выкл' }){
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors
        ${active ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-300' : 'bg-white/30'}`} />
      {active ? labelOn : labelOff}
    </button>
  )
}

function ScheduleBadge({ children }){
  return (
    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
      {children}
    </span>
  )
}

/* ======================= PLAYLIST CARD ======================= */

function PlaylistCard({ pl, onRename, onDelete, onDragStart, onAddFiles }){
  const [dragOver, setDragOver] = useState(false)

  function onDropFiles(e){
    e.preventDefault(); setDragOver(false)
    const files = e.dataTransfer.files
    if (files?.length) onAddFiles(files)
  }

  return (
    <motion.div
      layout
      className={`${panelClass} p-4`}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e)=>{e.preventDefault(); setDragOver(true)}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={onDropFiles}
      title="Перетащите карточку на зону; файлы — внутрь карточки"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{pl.name}</div>
          <div className="text-xs text-white/60">{pl.tracks.length} трек(ов)</div>
        </div>
        <div className="flex gap-1">
          <button className="btn" onClick={onRename}>✎</button>
          <button className="btn" onClick={onDelete}>🗑</button>
        </div>
      </div>

      <div className={`mt-3 p-3 border rounded-md ${dragOver? 'border-white/30 bg-white/5' : 'border-white/10'}`}>
        {pl.tracks.length===0 && (
          <div className="text-white/60 text-sm">Перетащите файлы сюда или выберите ниже</div>
        )}
        <div className="grid gap-2 max-h-36 overflow-auto pr-1">
          {pl.tracks.map(t=>(
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-md px-3 py-2 truncate text-sm">
              {t.name}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <label className="btn cursor-pointer">
          + Файлы
          <input className="hidden" type="file" multiple onChange={(e)=>onAddFiles(e.target.files)} />
        </label>
        <div className="text-xs text-white/50">Перетащите карточку → зону</div>
      </div>
    </motion.div>
  )
}
