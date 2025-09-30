// src/pages/Content.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

/**
 * Content Manager (showcase)
 * - Сканирование устройств и выбор активного устройства
 * - Просмотр файлов на устройстве в виде адаптивной сетки карточек
 * - Drag&Drop загрузка с прогресс-очередью (визуально реалистично)
 * - Быстрый запуск файла (PLAY) и локальное удаление из списка (затычка)
 * - Фильтр/поиск, множественный выбор, действия над выбором
 * - Единый glassmorphism + плавные анимации
 */

const prettySize = (n) => {
  if (n == null) return ''
  const u = ['B','KB','MB','GB']
  let i = 0; let v = n
  while (v >= 1024 && i < u.length-1) { v/=1024; i++ }
  return `${v.toFixed(v<10?1:0)} ${u[i]}`
}

export default function Content(){
  const [devices, setDevices] = useState([])
  const [activeIp, setActiveIp] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState(new Set())
  const [dragOver, setDragOver] = useState(false)
  const [queue, setQueue] = useState([]) // [{name, progress, state:'queued'|'uploading'|'done'|'error'}]

  // первичная загрузка устройств
  useEffect(()=>{
    (async ()=>{
      try {
        const scanned = await api.scan()
        const list = Array.isArray(scanned) && scanned.length ? scanned : []
        setDevices(list)
        if (list[0]?.ip) {
          setActiveIp(list[0].ip)
        }
      } catch {
        setDevices([])
      }
    })()
  },[])

  // загрузка файлов с устройства
  useEffect(()=>{
    if (!activeIp) { setFiles([]); return }
    (async ()=>{
      setLoading(true)
      try {
        const f = await api.files(activeIp)
        // если бэкенд вернул строки без метаданных — оборачиваем
        const shaped = (Array.isArray(f) ? f : []).map(n => ({ name: n, size: null }))
        setFiles(shaped)
      } catch {
        setFiles([])
      } finally {
        setLoading(false)
      }
    })()
  },[activeIp])

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase()
    if (!q) return files
    return files.filter(f => f.name.toLowerCase().includes(q))
  },[files, query])

  function toggleSelect(name){
    const next = new Set(selection)
    if (next.has(name)) next.delete(name); else next.add(name)
    setSelection(next)
  }

  function clearSelection(){
    setSelection(new Set())
  }

  async function play(name){
    if (!activeIp || !name) return
    try { await api.play(activeIp, name) } catch {}
  }

  function removeLocal(names){
    if (!names?.length) return
    setFiles(prev => prev.filter(f => !names.includes(f.name)))
    clearSelection()
  }

  // Drag & Drop
  function onDragOver(e){ e.preventDefault(); setDragOver(true) }
  function onDragLeave(){ setDragOver(false) }
  function onDrop(e){
    e.preventDefault(); setDragOver(false)
    const list = Array.from(e.dataTransfer.files || [])
    if (list.length) startUpload(list)
  }
  function onPick(e){
    const list = Array.from(e.target.files || [])
    if (list.length) startUpload(list)
    e.target.value = ''
  }

  // Загрузка с прогрессом (реалистичная затычка + реальные api.upload)
  function startUpload(fileList){
    const jobs = fileList.map(f => ({
      name: f.name, file: f, progress: 0, state: 'queued'
    }))
    setQueue(prev => [...prev, ...jobs])
    runQueue([...jobs])
  }

  function runQueue(newJobs){
    const parallel = 3
    let running = 0
    let idx = 0

    const stepUpload = (job) => {
      job.state = 'uploading'
      setQueue(curr => curr.map(j => j===job ? {...j} : j))

      // визуальная симуляция с шагами + реальный вызов api.upload
      const totalSteps = 35 + Math.floor(Math.random()*35)
      let step = 0
      const timer = setInterval(async ()=>{
        step++
        job.progress = Math.min(100, Math.round(step/totalSteps*100))
        setQueue(curr => curr.map(j => j===job ? {...j} : j))

        if (step >= totalSteps) {
          clearInterval(timer)
          try {
            if (activeIp) await api.upload(activeIp, job.file)
            job.state = 'done'
            // добавить в список файлов, если его там нет
            setFiles(prev => {
              const exists = prev.some(f => f.name === job.name)
              return exists ? prev : [...prev, { name: job.name, size: job.file.size ?? null }]
            })
          } catch {
            job.state = 'error'
          }
          running--
          runNext()
        }
      }, 60)
    }

    const runNext = () => {
      if (idx >= newJobs.length) return
      if (running >= parallel) return
      const job = newJobs[idx++]
      running++
      stepUpload(job)
      // запуск парочки вперед
      runNext()
    }

    for (let i=0;i<parallel;i++) runNext()
  }

  // bulk actions
  function bulkPlay(){
    const names = Array.from(selection)
    // проигрываем последовательно (для демонстрации)
    ;(async ()=>{
      for (const n of names) await play(n)
    })()
  }
  function bulkRemove(){
    const names = Array.from(selection)
    removeLocal(names)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Панель выбора устройства и поиск */}
      <div className="glass p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-white/60 shrink-0">Устройство</span>
          <DeviceSelect devices={devices} activeIp={activeIp} setActiveIp={setActiveIp} />
          <button className="btn shrink-0" onClick={async ()=>{
            try {
              const scanned = await api.scan()
              const list = Array.isArray(scanned) ? scanned : []
              setDevices(list)
              if (!list.find(d=>d.ip===activeIp)) setActiveIp(list[0]?.ip || '')
            } catch {}
          }}>Сканировать</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Поиск</span>
          <input className="glass px-3 py-2 w-full sm:w-64" placeholder="music, promo, wav..."
                 value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
      </div>

      {/* Drag&Drop Зона */}
      <motion.div
        className={`glass p-6 text-center border-2 border-dashed ${dragOver ? 'border-white/40 bg-white/10' : 'border-white/15'}`}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
      >
        <div className="text-white/80 mb-1">Перетащите аудиофайлы сюда</div>
        <div className="text-white/50 text-sm mb-4">или выберите вручную</div>
        <label className="btn inline-flex cursor-pointer">
          Выбрать файлы
          <input type="file" multiple className="hidden" onChange={onPick} />
        </label>
      </motion.div>

      {/* Тулбар выбора */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-white/60">
          Файлов: <span className="text-white/80">{filtered.length}</span>
          {selection.size>0 && <> · Выбрано: <span className="text-white/80">{selection.size}</span></>}
        </div>
        <div className="flex gap-2">
          <button className="btn" disabled={selection.size===0} onClick={bulkPlay}>▶ Проиграть выбранные</button>
          <button className="btn" disabled={selection.size===0} onClick={bulkRemove}>🗑 Удалить из списка</button>
          <button className="btn" onClick={()=>setQueue([])}>Очистить очередь</button>
        </div>
      </div>

      {/* Сетка файлов */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {loading && Array.from({length:8}).map((_,i)=>(
            <motion.div key={`skel-${i}`} className="glass h-28 animate-pulse" initial={{opacity:0}} animate={{opacity:1}} />
          ))}
          {!loading && filtered.map((f)=>(
            <FileTile
              key={f.name}
              f={f}
              selected={selection.has(f.name)}
              onSelect={()=>toggleSelect(f.name)}
              onPlay={()=>play(f.name)}
              onRemove={()=>removeLocal([f.name])}
            />
          ))}
          {!loading && filtered.length===0 && (
            <motion.div className="glass p-6 text-white/60" initial={{opacity:0}} animate={{opacity:1}}>
              Пусто. Загрузите файлы или измените фильтр.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Очередь загрузки */}
      <AnimatePresence>
        {queue.length>0 && (
          <motion.div
            className="glass p-4 space-y-3"
            initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:8}}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">Очередь загрузки</div>
              <div className="text-sm text-white/60">{queue.filter(q=>q.state==='done').length}/{queue.length} завершено</div>
            </div>
            <div className="grid gap-2 max-h-64 overflow-auto pr-1">
              {queue.map((q,i)=>(
                <div key={i} className="glass p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="truncate">{q.name}</div>
                    <div className="text-white/60">{q.state}</div>
                  </div>
                  <Progress value={q.progress}/>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Subcomponents ---------- */

function DeviceSelect({devices, activeIp, setActiveIp}){
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const active = devices.find(d => d.ip === activeIp)

  useEffect(()=>{
    const onDoc = (e) => { if (!btnRef.current?.parentElement?.contains(e.target)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  },[])

  return (
    <div className="relative">
      <button ref={btnRef} className="btn min-w-56 flex items-center justify-between gap-3"
              onClick={()=>setOpen(v=>!v)}>
        <span className="truncate">{active ? `${active.name || active.ip} · ${active.ip}` : '— не выбрано —'}</span>
        <span className="text-white/70">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute z-10 mt-2 w-72 glass p-2 max-h-72 overflow-auto"
            initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:6}}
          >
            {devices.length===0 && <div className="px-3 py-2 text-white/60 text-sm">Устройств не найдено</div>}
            {devices.map(d=>(
              <button key={d.ip} className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2"
                      onClick={()=>{ setActiveIp(d.ip); setOpen(false) }}>
                <div className={`w-2.5 h-2.5 rounded-full ${d.online?'bg-green-400':'bg-red-500'}`} />
                <div className="truncate">{d.name || d.ip}</div>
                <div className="ml-auto text-xs text-white/50">{d.ip}</div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FileTile({ f, selected, onSelect, onPlay, onRemove }){
  return (
    <motion.div
      layout
      initial={{opacity:0, y:8}}
      animate={{opacity:1, y:0}}
      exit={{opacity:0, y:8}}
      className={`glass p-3 flex flex-col gap-3 ${selected ? 'ring-1 ring-white/30' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/10 grid place-items-center select-none">🎵</div>
        <div className="min-w-0">
          <div className="truncate font-medium">{f.name}</div>
          <div className="text-xs text-white/60">{prettySize(f.size)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <button className="btn flex-1" onClick={(e)=>{e.stopPropagation(); onPlay()}}>▶ Проиграть</button>
        <button className="btn" onClick={(e)=>{e.stopPropagation(); onRemove()}}>🗑</button>
      </div>
    </motion.div>
  )
}

function Progress({value}){
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-white/70"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
