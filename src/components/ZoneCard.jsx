import React from 'react'
import { motion } from 'framer-motion'

export default function ZoneCard({z, onPlay, onStop, onVolume, onOpen}){
  return (
    <motion.div layout className="glass p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${z.online?'bg-green-400':'bg-red-500'}`}></div>
        <div>
          <div className="font-semibold">{z.name || z.ip}</div>
          <div className="text-sm text-white/60">{z.zone || 'Без зоны'} · {z.ip}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={onPlay}>▶</button>
        <button className="btn" onClick={onStop}>⏹</button>
        <input className="w-28 accent-white" type="range" min="0" max="100" defaultValue={z.volume ?? 70} onChange={(e)=>onVolume(+e.target.value)} />
        <button className="btn" onClick={onOpen}>Подробнее</button>
      </div>
    </motion.div>
  )
}
