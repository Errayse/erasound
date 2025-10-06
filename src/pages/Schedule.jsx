import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../lib/api'
import { DAY_GROUPS } from '../features/planner/constants'
import {
  plannerStorage as ls,
  transferKey,
  uid,
  timeToMinutes,
} from '../features/planner/utils'
import {
  scheduleFallbackDevices,
  createDefaultZones,
  createDefaultWindow,
  createDefaultAnnouncement,
  createDemoPlaylists,
} from '../features/planner/seeds'
import {
  normalizeScheduleDevices,
  normalizeZone,
  normalizeWindow,
  normalizeAnnouncement,
  cloneWindowData,
  cloneAnnouncementData,
} from '../features/planner/normalizers'
import ZoneCard from '../features/planner/components/ZoneCard'
import PlaylistCard from '../features/planner/components/PlaylistCard'
import PlannerDialog from '../features/planner/components/PlannerDialog'
import { SectionHeader } from '../features/planner/components/primitives'

const defaultZones = createDefaultZones()

export default function Schedule(){
  const [devices, setDevices] = useState(scheduleFallbackDevices)

  const [zones, setZones] = useState(() => {
    const stored = ls.get('sk_zones', defaultZones)
    const source = Array.isArray(stored) && stored.length ? stored : defaultZones
    return source.map((zone, idx) => normalizeZone(zone, defaultZones[idx], idx))
  })

  const [lists, setLists] = useState(() => {
    const stored = ls.get('sk_playlists', [])
    if (Array.isArray(stored) && stored.length) return stored
    return createDemoPlaylists()
  })

  const [transfers, setTransfers] = useState(() => ls.get('sk_transfers', {}))
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

  useEffect(() => { scanDevices() }, [])
  useEffect(() => ls.set('sk_zones', zones), [zones])
  useEffect(() => ls.set('sk_playlists', lists), [lists])
  useEffect(() => ls.set('sk_transfers', transfers), [transfers])

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
        }, 1200)
      }

      if (entry.status === 'success' && transferTimers.current[key]) {
        clearInterval(transferTimers.current[key])
        delete transferTimers.current[key]
      }
    })
  }, [transfers])

  useEffect(() => () => {
    Object.values(transferTimers.current).forEach(timer => clearInterval(timer))
  }, [])

  async function scanDevices(){
    try{
      const res = await api.scan()
      const normalized = normalizeScheduleDevices(res)
      setDevices(Array.isArray(normalized) && normalized.length ? normalized : scheduleFallbackDevices)
    }catch{
      setDevices(scheduleFallbackDevices)
    }
  }

  function toggleZoneDevice(zoneId, ip){
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      const set = new Set(zone.deviceIps)
      if (set.has(ip)){
        set.delete(ip)
      }else{
        set.add(ip)
      }
      return { ...zone, deviceIps: Array.from(set) }
    }))
  }

  function removeZoneDevice(zoneId, ip){
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      return { ...zone, deviceIps: zone.deviceIps.filter(item => item !== ip) }
    }))
  }

  function createZoneWithName(name){
    const label = name || `Зона ${zones.length + 1}`
    const id = uid()
    setZones(z => [
      ...z,
      normalizeZone({
        id,
        name: label,
        deviceIps: [],
        playlistIds: [],
        playbackWindows: [createDefaultWindow()],
        announcements: [createDefaultAnnouncement()],
      }, null, z.length),
    ])
  }

  function renameZoneWithName(id, name){
    setZones(z => z.map(zone => zone.id === id ? { ...zone, name } : zone))
  }

  function deleteZone(id){
    setZones(z => z.filter(zone => zone.id !== id))
  }

  function createListWithName(name){
    setLists(l => [...l, { id: uid(), name, tracks: [] }])
  }

  function renameListWithName(id, name){
    setLists(l => l.map(list => list.id === id ? { ...list, name } : list))
  }

  function deleteList(id){
    setLists(l => l.filter(list => list.id !== id))
    setZones(z => z.map(zone => ({
      ...zone,
      playlistIds: zone.playlistIds.filter(listId => listId !== id),
    })))
  }

  function addFilesToList(id, fileList){
    if (!fileList) return
    const files = Array.from(fileList)
    if (!files.length) return
    setLists(l => l.map(list => {
      if (list.id !== id) return list
      return {
        ...list,
        tracks: [
          ...list.tracks,
          ...files.map(file => ({ id: uid(), name: file.name })),
        ],
      }
    }))
  }

  function onDragStartPlaylist(e, id){
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-sk', JSON.stringify({ type: 'playlist', id }))
  }

  function onDropToZone(e, zoneId){
    e.preventDefault()
    const data = e.dataTransfer.getData('application/x-sk')
    if (!data) return
    const payload = JSON.parse(data)
    if (payload.type !== 'playlist') return
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      if (zone.playlistIds.includes(payload.id)) return zone
      return { ...zone, playlistIds: [...zone.playlistIds, payload.id] }
    }))
  }

  function unassign(zoneId, listId){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      playlistIds: zone.playlistIds.filter(id => id !== listId),
    } : zone))
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

    if (['addWindow','editWindow'].includes(mode)){
      const seed = options.data ? cloneWindowData(options.data) : cloneWindowData(createDefaultWindow())
      setDialogData(seed)
    }else if(['addAnnouncement','editAnnouncement'].includes(mode)){
      const seed = options.data ? cloneAnnouncementData(options.data) : cloneAnnouncementData(createDefaultAnnouncement())
      setDialogData(seed)
    }else{
      setDialogData(null)
    }
  }

  function closeDialog(){
    setDialog({ mode: null, id: null, zoneId: null, targetId: null })
    setDialogValue('')
    setDialogError('')
    setDialogData(null)
  }

  function handleDialogSubmit(e){
    if (e?.preventDefault) e.preventDefault()
    const value = dialogValue.trim()

    if (['createZone','renameZone','createList','renameList'].includes(dialog.mode)){
      if (!value){
        setDialogError('Введите название, чтобы сохранить изменения.')
        return
      }
    }

    switch(dialog.mode){
      case 'createZone':
        createZoneWithName(value)
        break
      case 'renameZone':
        if (dialog.id) renameZoneWithName(dialog.id, value)
        break
      case 'createList':
        createListWithName(value)
        break
      case 'renameList':
        if (dialog.id) renameListWithName(dialog.id, value)
        break
      case 'deleteZone':
        if (dialog.id) deleteZone(dialog.id)
        break
      case 'deleteList':
        if (dialog.id) deleteList(dialog.id)
        break
      case 'deleteWindow':
        if (dialog.zoneId && dialog.targetId) deletePlaybackWindow(dialog.zoneId, dialog.targetId)
        break
      case 'deleteAnnouncement':
        if (dialog.zoneId && dialog.targetId) deleteAnnouncement(dialog.zoneId, dialog.targetId)
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

  function addPlaybackWindow(zoneId, payload){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      playbackWindows: [...zone.playbackWindows, normalizeWindow(payload)],
    } : zone))
  }

  function updatePlaybackWindow(zoneId, windowId, payload){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      playbackWindows: zone.playbackWindows.map(window => window.id === windowId ? normalizeWindow({ ...window, ...payload, id: window.id }) : window),
    } : zone))
  }

  function deletePlaybackWindow(zoneId, windowId){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      playbackWindows: zone.playbackWindows.filter(window => window.id !== windowId),
    } : zone))
  }

  function togglePlaybackWindow(zoneId, windowId){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      playbackWindows: zone.playbackWindows.map(window => window.id === windowId ? { ...window, enabled: !window.enabled } : window),
    } : zone))
  }

  function addAnnouncement(zoneId, payload){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      announcements: [...zone.announcements, normalizeAnnouncement(payload)],
    } : zone))
  }

  function updateAnnouncement(zoneId, announcementId, payload){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      announcements: zone.announcements.map(entry => entry.id === announcementId ? normalizeAnnouncement({ ...entry, ...payload, id: entry.id }) : entry),
    } : zone))
  }

  function deleteAnnouncement(zoneId, announcementId){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      announcements: zone.announcements.filter(entry => entry.id !== announcementId),
    } : zone))
  }

  function toggleAnnouncement(zoneId, announcementId){
    setZones(z => z.map(zone => zone.id === zoneId ? {
      ...zone,
      announcements: zone.announcements.map(entry => entry.id === announcementId ? { ...entry, enabled: !entry.enabled } : entry),
    } : zone))
  }

  function handleWindowFormSubmit(e){
    if (e?.preventDefault) e.preventDefault()
    if (!dialogData) return
    const label = (dialogData.label || '').trim()
    const start = dialogData.start || '00:00'
    const end = dialogData.end || '00:00'
    const days = Array.isArray(dialogData.days) ? dialogData.days.filter(Boolean) : []

    if (!label){
      setDialogError('Введите название окна, чтобы сохранить изменения.')
      return
    }
    if (!days.length){
      setDialogError('Выберите хотя бы один день недели.')
      return
    }
    if (timeToMinutes(end) <= timeToMinutes(start)){
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

    if (dialog.mode === 'addWindow'){
      addPlaybackWindow(dialog.zoneId, payload)
    }else if(dialog.mode === 'editWindow'){
      updatePlaybackWindow(dialog.zoneId, dialog.targetId, payload)
    }

    closeDialog()
  }

  function handleAnnouncementFormSubmit(e){
    if (e?.preventDefault) e.preventDefault()
    if (!dialogData) return

    const title = (dialogData.title || '').trim()
    if (!title){
      setDialogError('Введите название включения.')
      return
    }

    const repeat = dialogData.repeat || 'daily'
    const base = { ...dialogData, title, repeat }

    if (repeat === 'weekly'){
      const days = Array.isArray(dialogData.days) ? dialogData.days.filter(Boolean) : []
      if (!days.length){
        setDialogError('Выберите дни недели для запуска.')
        return
      }
      base.days = days
    }else if(repeat === 'daily'){
      base.days = DAY_GROUPS.all
    }else{
      base.days = Array.isArray(dialogData.days) ? dialogData.days.filter(Boolean) : []
    }

    if (repeat === 'hourly'){
      const offset = Math.max(0, Math.min(59, Number(dialogData.offsetMinutes) || 0))
      base.offsetMinutes = offset
      base.time = dialogData.time || '00:00'
    }else{
      if (!dialogData.time){
        setDialogError('Укажите время запуска объявления.')
        return
      }
      base.time = dialogData.time
      base.offsetMinutes = dialogData.offsetMinutes ?? 0
    }

    if (dialogData.track?.type === 'library'){
      if (!dialogData.track.listId || !dialogData.track.trackId){
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
      if (!name){
        setDialogError('Введите название или файл объявления.')
        return
      }
      base.track = { type: 'custom', name }
    }

    if (dialog.mode === 'addAnnouncement'){
      addAnnouncement(dialog.zoneId, base)
    }else if(dialog.mode === 'editAnnouncement'){
      updateAnnouncement(dialog.zoneId, dialog.targetId, base)
    }

    closeDialog()
  }

  function handleZonePlayerAction(zoneId, action){
    setZones(z => z.map(zone => {
      if (zone.id !== zoneId) return zone
      const playlistId = zone.playlistIds[0]
      const list = lists.find(l => l.id === playlistId)
      const tracks = list?.tracks || []
      const nextTrack = tracks[Math.floor(Math.random() * tracks.length)]
      const base = zone.player || {}

      switch(action){
        case 'play':
          return {
            ...zone,
            player: {
              ...base,
              isPlaying: true,
              progress: 0.05 + Math.random() * 0.4,
              track: nextTrack?.name || base.track || 'Demo Track',
              playlist: list?.name || base.playlist,
              artist: base.artist || 'EraSound Studio',
              length: nextTrack ? 240 + Math.random() * 120 : base.length || 240,
            },
          }
        case 'stop':
          return {
            ...zone,
            player: {
              ...base,
              isPlaying: false,
            },
          }
        case 'prev':
        case 'next':
          return {
            ...zone,
            player: {
              ...base,
              isPlaying: true,
              progress: 0.02,
              track: nextTrack?.name || base.track || 'Demo Track',
              playlist: list?.name || base.playlist,
            },
          }
        default:
          return zone
      }
    }))
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <SectionHeader
        title="Зоны"
        subtitle="Связывайте несколько устройств с зоной и отслеживайте прогресс загрузки плейлистов."
        actions={(
          <>
            <button className="btn" onClick={() => openDialog('createZone')}>+ Зона</button>
            <button className="btn" onClick={scanDevices}>Сканировать устройства</button>
          </>
        )}
      />

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {zones.map(zone => (
          <ZoneCard
            key={zone.id}
            z={zone}
            devices={devices}
            lists={lists}
            transfers={transfers}
            onToggleDevice={ip => toggleZoneDevice(zone.id, ip)}
            onRemoveDevice={ip => removeZoneDevice(zone.id, ip)}
            onRename={() => openDialog('renameZone', { id: zone.id, value: zone.name })}
            onDelete={() => openDialog('deleteZone', { id: zone.id })}
            onUnassign={listId => unassign(zone.id, listId)}
            onDrop={event => onDropToZone(event, zone.id)}
            onAddWindow={() => openDialog('addWindow', { zoneId: zone.id, data: createDefaultWindow() })}
            onEditWindow={window => openDialog('editWindow', { zoneId: zone.id, targetId: window.id, data: window })}
            onDeleteWindow={window => openDialog('deleteWindow', { zoneId: zone.id, targetId: window.id })}
            onToggleWindow={windowId => togglePlaybackWindow(zone.id, windowId)}
            onAddAnnouncement={() => openDialog('addAnnouncement', { zoneId: zone.id, data: createDefaultAnnouncement() })}
            onEditAnnouncement={entry => openDialog('editAnnouncement', { zoneId: zone.id, targetId: entry.id, data: entry })}
            onDeleteAnnouncement={entry => openDialog('deleteAnnouncement', { zoneId: zone.id, targetId: entry.id })}
            onToggleAnnouncement={announcementId => toggleAnnouncement(zone.id, announcementId)}
            onPlayerAction={action => handleZonePlayerAction(zone.id, action)}
          />
        ))}
      </div>

      <SectionHeader
        title="Плейлисты"
        subtitle="Готовые подборки для витрины — перетащите на нужную зону или загрузите новые треки."
        actions={<button className="btn" onClick={() => openDialog('createList')}>+ Плейлист</button>}
      />

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {lists.map(list => (
            <PlaylistCard
              key={list.id}
              pl={list}
              onRename={() => openDialog('renameList', { id: list.id, value: list.name })}
              onDelete={() => openDialog('deleteList', { id: list.id })}
              onDragStart={event => onDragStartPlaylist(event, list.id)}
              onAddFiles={files => addFilesToList(list.id, files)}
            />
          ))}
          {lists.length === 0 && (
            <motion.div className="panel p-6 text-white/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Плейлистов нет. Создайте первый.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PlannerDialog
        dialog={dialog}
        dialogTitle={dialogTitle}
        dialogValue={dialogValue}
        dialogData={dialogData}
        dialogError={dialogError}
        onClose={closeDialog}
        onSubmit={handleDialogSubmit}
        onWindowSubmit={handleWindowFormSubmit}
        onAnnouncementSubmit={handleAnnouncementFormSubmit}
        setDialogValue={setDialogValue}
        setDialogData={setDialogData}
        setDialogError={setDialogError}
        toggleDialogDay={toggleDialogDay}
        setDialogDays={setDialogDays}
        allTracks={allTracks}
        activeZone={activeZone}
        activeList={activeList}
        activeWindow={activeWindow}
        activeAnnouncement={activeAnnouncement}
      />
    </div>
  )
}
