import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import ZoneCard from '../components/ZoneCard'
import Modal from '../components/Modal'

export default function Dashboard(){
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)

  async function refresh(){
    const list = await api.scan()
    setItems(list)
  }
  useEffect(()=>{ refresh() }, [])

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Устройства</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={refresh}>Сканировать</button>
        </div>
      </div>
      <div className="grid gap-3">
        {items.map((z)=> (
          <ZoneCard key={z.ip} z={z}
            onPlay={()=>api.play(z.ip,'demo.mp3')}
            onStop={()=>api.stop(z.ip)}
            onVolume={(v)=>api.volume(z.ip, v)}
            onOpen={()=>setActive(z)}
          />
        ))}
        {items.length===0 && <div className="glass p-6 text-white/70">Ничего не найдено. Нажмите «Сканировать».</div>}
      </div>

      <Modal open={!!active} onClose={()=>setActive(null)} title={`Устройство ${active?.name || active?.ip || ''}`}>
        {active && (
          <div className="space-y-6">
            <div className="glass rounded-lg border border-white/10 p-4 space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold">{active.name || active.ip}</div>
                  <div className="text-sm text-white/60">
                    {active.zone ? `Зона: ${active.zone}` : 'Сетевой аудиоузел в сети'}
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${active.online ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                  {active.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="glass rounded-lg border border-white/10 p-4">
                <dt className="text-xs uppercase tracking-wide text-white/50">IP адрес</dt>
                <dd className="mt-1 font-mono text-sm">{active.ip}</dd>
              </div>
              <div className="glass rounded-lg border border-white/10 p-4">
                <dt className="text-xs uppercase tracking-wide text-white/50">Версия прошивки</dt>
                <dd className="mt-1 font-mono text-sm">{active.ver || '—'}</dd>
              </div>
              <div className="glass rounded-lg border border-white/10 p-4">
                <dt className="text-xs uppercase tracking-wide text-white/50">Статус</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${active.online ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {active.online ? 'Устройство онлайн' : 'Недоступно'}
                </dd>
              </div>
              <div className="glass rounded-lg border border-white/10 p-4">
                <dt className="text-xs uppercase tracking-wide text-white/50">Текущая громкость</dt>
                <dd className="mt-1 text-sm">{active.volume != null ? `${active.volume}%` : '—'}</dd>
              </div>
            </dl>

            <div className="glass rounded-lg border border-white/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/70">Управление воспроизведением</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={()=>api.play(active.ip,'demo.mp3')}>▶ Воспроизвести demo.mp3</button>
                <button className="btn glass" onClick={()=>api.stop(active.ip)}>⏹ Остановить</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
