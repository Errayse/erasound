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
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass p-3">
                <div className="text-sm text-white/60">IP</div>
                <div className="font-mono">{active.ip}</div>
              </div>
              <div className="glass p-3">
                <div className="text-sm text-white/60">Версия</div>
                <div className="font-mono">{active.ver || '-'}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>api.play(active.ip,'demo.mp3')}>▶ Проиграть demo.mp3</button>
              <button className="btn" onClick={()=>api.stop(active.ip)}>⏹ Стоп</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
