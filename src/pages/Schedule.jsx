// src/pages/Schedule.jsx
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

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

export default function Schedule(){
  // устройства из сети
  const [devices, setDevices] = useState([])
  // зоны: [{id,name,deviceIp,playlistIds:[]}]
  const [zones, setZones] = useState(()=> ls.get('sk_zones', [
    { id:'z1', name:'Вход', deviceIp:'', playlistIds:[] },
    { id:'z2', name:'Кафе', deviceIp:'', playlistIds:[] },
    { id:'z3', name:'Озеро', deviceIp:'', playlistIds:[] },
  ]))
  // плейлисты: [{id,name,tracks:[{id,name}]}]
  const [lists, setLists] = useState(()=> ls.get('sk_playlists', []))

  useEffect(()=>{ (async()=>{
    try{ const res = await api.scan(); setDevices(Array.isArray(res)?res:[]) }catch{}
  })() },[])
  useEffect(()=> ls.set('sk_zones', zones), [zones])
  useEffect(()=> ls.set('sk_playlists', lists), [lists])

  function createZone(){
    const n = prompt('Название зоны?')?.trim(); if(!n) return
    setZones(z => [...z, { id:uid(), name:n, deviceIp:'', playlistIds:[] }])
  }
  function renameZone(id){
    const n = prompt('Новое название зоны?')?.trim(); if(!n) return
    setZones(z => z.map(x => x.id===id? {...x, name:n}:x))
  }
  function deleteZone(id){
    if(!confirm('Удалить зону?')) return
    setZones(z => z.filter(x => x.id!==id))
  }
  function setZoneDevice(zoneId, ip){
    setZones(z => z.map(x => x.id===zoneId? {...x, deviceIp:ip}:x))
  }

  function createList(){
    const n = prompt('Название плейлиста?')?.trim(); if(!n) return
    setLists(l => [...l, { id:uid(), name:n, tracks:[] }])
  }
  function renameList(id){
    const n = prompt('Новое название плейлиста?')?.trim(); if(!n) return
    setLists(l => l.map(x => x.id===id? {...x, name:n}:x))
  }
  function deleteList(id){
    if(!confirm('Удалить плейлист?')) return
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

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* ======= ЗОНЫ ======= */}
      <SectionHeader
        title="Зоны"
        subtitle="Карточки зон. Выберите устройство и перетащите на них плейлисты."
        actions={<>
          <button className="btn" onClick={createZone}>+ Зона</button>
          <button className="btn" onClick={async()=>{ try{ const r=await api.scan(); setDevices(Array.isArray(r)?r:[]) }catch{} }}>Сканировать устройства</button>
        </>}
      />

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {zones.map(z=>(
          <ZoneCard
            key={z.id}
            z={z}
            devices={devices}
            lists={lists}
            setDevice={setZoneDevice}
            onRename={()=>renameZone(z.id)}
            onDelete={()=>deleteZone(z.id)}
            onUnassign={(listId)=>unassign(z.id, listId)}
            onDrop={(e)=>onDropToZone(e, z.id)}
          />
        ))}
      </div>

      {/* ======= ПЛЕЙЛИСТЫ ======= */}
      <SectionHeader
        title="Плейлисты"
        subtitle="Прямоугольные карточки. Перетаскивайте на зоны выше."
        actions={<button className="btn" onClick={createList}>+ Плейлист</button>}
      />

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {lists.map(pl=>(
            <PlaylistCard
              key={pl.id}
              pl={pl}
              onRename={()=>renameList(pl.id)}
              onDelete={()=>deleteList(pl.id)}
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

function ZoneCard({ z, devices, lists, setDevice, onRename, onDelete, onUnassign, onDrop }){
  const assigned = z.playlistIds.map(id=>lists.find(l=>l.id===id)).filter(Boolean)
  const [over, setOver] = useState(false)

  return (
    <motion.div
      layout
      className={`${panelClass} p-4`}
      onDragOver={(e)=>{e.preventDefault(); setOver(true)}}
      onDragLeave={()=>setOver(false)}
      onDrop={(e)=>{ setOver(false); onDrop(e) }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{z.name}</div>
          <div className="text-xs text-white/60">Плейлистов: {assigned.length}</div>
        </div>
        <div className="flex gap-1">
          <button className="btn" onClick={onRename}>✎</button>
          <button className="btn" onClick={onDelete}>🗑</button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-white/60">Устройство</span>
        <select
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm"
          value={z.deviceIp}
          onChange={(e)=>setDevice(z.id, e.target.value)}
        >
          <option value="">—</option>
          {devices.map(d=>(
            <option key={d.ip} value={d.ip}>{d.name || d.ip} · {d.ip}</option>
          ))}
        </select>
      </div>

      <div className={`mt-3 p-3 border rounded-md ${over? 'border-white/30 bg-white/5' : 'border-white/10'}`}>
        <div className="text-xs text-white/60 mb-2">Плейлисты зоны</div>
        <div className="grid gap-2">
          {assigned.length===0 && <div className="text-white/50 text-sm">Перетащите плейлист сюда</div>}
          {assigned.map(pl=>(
            <div key={pl.id} className="bg-white/5 border border-white/10 rounded-md px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <div className="truncate">{pl.name}</div>
              <div className="text-xs text-white/50 ml-auto">{pl.tracks.length} трек(ов)</div>
              <button className="btn ml-2" onClick={()=>onUnassign(pl.id)}>Убрать</button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
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
