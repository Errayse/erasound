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

const fallbackDevices = [
  { ip: '192.168.0.21', name: 'Холл · Ресивер' },
  { ip: '192.168.0.37', name: 'Кафе · Колонки' },
  { ip: '192.168.0.52', name: 'Терраса · Усилитель' },
]

const defaultZones = [
  { id: 'z1', name: 'Вход', deviceIps: ['192.168.0.21'], playlistIds: [] },
  { id: 'z2', name: 'Кафе', deviceIps: ['192.168.0.37'], playlistIds: [] },
  { id: 'z3', name: 'Терраса', deviceIps: ['192.168.0.52'], playlistIds: [] },
]

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

const fallbackDevices = [
  { ip: '192.168.0.21', name: 'Холл · Ресивер' },
  { ip: '192.168.0.37', name: 'Кафе · Колонки' },
  { ip: '192.168.0.52', name: 'Терраса · Усилитель' },
]

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
  const [devices, setDevices] = useState(fallbackDevices)
  // зоны: [{id,name,deviceIp,playlistIds:[]}]
  const [zones, setZones] = useState(()=> {
    const stored = ls.get('sk_zones', defaultZones)
    const source = Array.isArray(stored) && stored.length ? stored : defaultZones
    return source.map((zone, idx) => ({
      id: zone.id || `z${idx+1}`,
      name: zone.name || `Зона ${idx+1}`,
      playlistIds: Array.isArray(zone.playlistIds) ? zone.playlistIds : [],
      deviceIps: Array.isArray(zone.deviceIps)
        ? Array.from(new Set(zone.deviceIps.filter(Boolean)))
        : zone.deviceIp
          ? [zone.deviceIp]
          : [],
    }))
  })
  // плейлисты: [{id,name,tracks:[{id,name}]}]
  const [lists, setLists] = useState(()=> {
    const stored = ls.get('sk_playlists', [])
    if (Array.isArray(stored) && stored.length) return stored
    return createDemoPlaylists()
  })
  const [transfers, setTransfers] = useState(()=> ls.get('sk_transfers', {}))
  const transferTimers = useRef({})

  const [dialog, setDialog] = useState({ mode: null, id: null })
  const [dialogValue, setDialogValue] = useState('')
  const [dialogError, setDialogError] = useState('')

  const activeZone = useMemo(() => zones.find(z => z.id === dialog.id), [zones, dialog])
  const activeList = useMemo(() => lists.find(l => l.id === dialog.id), [lists, dialog])

  const dialogTitle = useMemo(() => {
    switch(dialog.mode){
      case 'createZone': return 'Новая зона'
      case 'renameZone': return 'Переименовать зону'
      case 'deleteZone': return 'Удалить зону'
      case 'createList': return 'Новый плейлист'
      case 'renameList': return 'Переименовать плейлист'
      case 'deleteList': return 'Удалить плейлист'
      default: return ''
    }
  }, [dialog.mode])

  function closeDialog(){
    setDialog({ mode: null, id: null })
    setDialogValue('')
    setDialogError('')
  }

  async function scanDevices(){
    try{
      const res = await api.scan()
      if(Array.isArray(res) && res.length){
        setDevices(res)
      }else{
        setDevices(fallbackDevices)
      }
    }catch{
      setDevices(fallbackDevices)
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
    setZones(z => [...z, { id:uid(), name, deviceIps:[], playlistIds:[] }])
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

  function openDialog(mode, id = null, value = ''){
    setDialog({ mode, id })
    setDialogValue(value)
    setDialogError('')
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
      default:
        break
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
            onRename={()=>openDialog('renameZone', z.id, z.name)}
            onDelete={()=>openDialog('deleteZone', z.id)}
            onUnassign={(listId)=>unassign(z.id, listId)}
            onDrop={(e)=>onDropToZone(e, z.id)}
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
              onRename={()=>openDialog('renameList', pl.id, pl.name)}
              onDelete={()=>openDialog('deleteList', pl.id)}
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

            {['deleteZone','deleteList'].includes(dialog.mode) && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-white/80">
                    Вы уверены, что хотите удалить {dialog.mode==='deleteZone' ? 'зону' : 'плейлист'}
                    {' '}«{dialog.mode==='deleteZone' ? activeZone?.name : activeList?.name}»?
                  </div>
                  {dialog.mode==='deleteList' && (
                    <div className="text-xs text-white/60">Она будет отвязана от всех зон.</div>
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

function ZoneCard({ z, devices, lists, transfers, onToggleDevice, onRemoveDevice, onRename, onDelete, onUnassign, onDrop }){
  const assigned = z.playlistIds.map(id => lists.find(l => l.id === id)).filter(Boolean)
  const selectedDevices = z.deviceIps.map(ip => devices.find(d => d.ip === ip) || { ip, name: ip })
  const availableDevices = devices.filter(d => !z.deviceIps.includes(d.ip))
  const [over, setOver] = useState(false)

  return (
    <motion.div
      layout
      className={`${panelClass} p-4 flex flex-col gap-4`}
      onDragOver={(e)=>{e.preventDefault(); setOver(true)}}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{ e.preventDefault(); setOver(false); onDrop(e) }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="font-medium truncate text-base">{z.name}</div>
          <div className="text-xs text-white/50">{assigned.length} плейлист(а)</div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button className="btn" onClick={onRename} aria-label="Переименовать зону">✎</button>
          <button className="btn" onClick={onDelete} aria-label="Удалить зону">🗑</button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-white/50">Устройства</span>
          {selectedDevices.length > 0 && (
            <span className="text-[11px] text-white/40">{selectedDevices.length} выбрано</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedDevices.map(dev => (
            <span key={dev.ip} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm">
              <span className="truncate max-w-[8rem] sm:max-w-[10rem]">{dev.name || dev.ip}</span>
              <button
                type="button"
                className="text-xs text-white/60 hover:text-white"
                onClick={()=>onRemoveDevice(dev.ip)}
                aria-label={`Убрать устройство ${dev.name || dev.ip}`}
              >×</button>
            </span>
          ))}
          <DevicePicker
            available={availableDevices}
            onSelect={(ip)=>onToggleDevice(ip)}
          />
        </div>
        {selectedDevices.length === 0 && (
          <div className="text-sm text-white/60 bg-white/5 border border-white/10 rounded-md px-3 py-2">
            Нет выбранных устройств. Добавьте одно или несколько, чтобы выгружать плейлисты в зону.
          </div>
        )}
      </div>

      <div className={`p-3 border rounded-md transition-colors ${over ? 'border-white/30 bg-white/5' : 'border-white/10 bg-transparent'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-wide text-white/50">Плейлисты зоны</div>
          <div className="text-[11px] text-white/40">Перетащите карточку плейлиста сюда</div>
        </div>
        <div className="mt-2 grid gap-2">
          {assigned.length === 0 && (
            <div className="text-white/60 text-sm border border-dashed border-white/15 rounded-md px-3 py-6 text-center">
              Перетащите плейлист из списка справа или создайте новый ниже.
            </div>
          )}
          {assigned.map(pl => {
            const totalTracks = pl.tracks.length
            return (
              <div key={pl.id} className="bg-white/5 border border-white/10 rounded-md px-3 py-3 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-300/70 mt-1" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{pl.name}</div>
                    <div className="text-xs text-white/50">{totalTracks} трек(ов)</div>
                  </div>
                  <button className="btn" onClick={()=>onUnassign(pl.id)}>Убрать</button>
                </div>

                {selectedDevices.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDevices.map(dev => {
                      const key = transferKey(z.id, pl.id, dev.ip)
                      const entry = transfers[key]
                      const progress = Math.min(100, Math.round(entry?.progress ?? 0))
                      const done = entry?.status === 'success'
                      return (
                        <div key={dev.ip} className="flex items-center gap-2 text-xs text-white/70">
                          <span className="truncate max-w-[8rem] sm:max-w-[11rem]">{dev.name || dev.ip}</span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${done ? 'bg-emerald-400/80' : 'bg-sky-400/70'}`}
                              style={{ width: `${done ? 100 : progress}%` }}
                            />
                          </div>
                          <span className={`w-14 text-right ${done ? 'text-emerald-200' : 'text-white/60'}`}>
                            {done ? 'готово' : `${progress}%`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-white/60">
                    Добавьте устройство выше, чтобы начать передачу плейлиста.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
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
        className={`btn glass ${hasOptions ? '' : 'opacity-60 cursor-not-allowed'}`}
        onClick={() => hasOptions && setOpen(v => !v)}
        disabled={!hasOptions}
      >
        + Устройство
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
