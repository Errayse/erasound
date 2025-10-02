import React from 'react'
import { motion } from 'framer-motion'

export default function ZoneCard({z, onPlay, onStop, onVolume, onOpen}){
  const statusClass = z.online ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'

  return (
    <motion.div
      layout
      className="glass rounded-xl p-4 shadow-glass flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${z.online ? 'bg-emerald-400' : 'bg-rose-500'}`} />
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-white/50">Устройство</div>
            <div className="text-lg font-semibold truncate">{z.name || z.ip}</div>
          </div>
          <span className={`ml-auto px-3 py-1 text-xs rounded-full ${statusClass}`}>
            {z.online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="text-sm text-white/60 truncate">
          {(z.zone || 'Без зоны')} · {z.ip || '—'}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:text-right sm:min-w-[260px]">
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn min-w-[2.75rem]" onClick={onPlay}>▶</button>
          <button className="btn min-w-[2.75rem]" onClick={onStop}>⏹</button>
        </div>
        <div className="flex flex-col gap-1 sm:min-w-[160px]">
          <span className="text-xs uppercase tracking-wide text-white/60">Громкость</span>
          <input
            className="accent-white/90"
            type="range"
            min="0"
            max="100"
            defaultValue={z.volume ?? 70}
            onChange={(e)=>onVolume?.(+e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button className="btn" onClick={onOpen}>Подробнее</button>
        </div>
      </div>
    </motion.div>
  )
}
