import React from 'react'
import { motion } from 'framer-motion'

const resolveProgress = (progress) => {
  if (progress == null || Number.isNaN(progress)) return 0
  if (progress > 1) return Math.min(100, Math.round(progress))
  return Math.min(100, Math.round(progress * 100))
}

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '--:--'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ZoneCard({z, onPlay, onStop, onVolume, onOpen}){
  const statusClass = z.online ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
  const track = z.nowPlaying
  const percent = resolveProgress(track?.progress)
  const length = track?.length ?? 0
  const elapsed = length ? Math.round((length * percent) / 100) : 0

  return (
    <motion.div
      layout
      className="glass rounded-xl p-4 shadow-glass flex flex-col gap-4"
    >
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-start gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${z.online ? 'bg-emerald-400' : 'bg-rose-500'} mt-1.5`} />
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-white/50">Устройство</div>
            <div className="text-lg font-semibold truncate">{z.name || z.ip}</div>
            <div className="text-sm text-white/60 truncate">{(z.zone || 'Без зоны')} · {z.ip || '—'}</div>
          </div>
          <span className={`ml-auto px-3 py-1 text-xs rounded-full ${statusClass}`}>
            {z.online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-white/50">Сейчас играет</div>
          {track ? (
            <div className="space-y-2">
              <div className="text-sm text-white/80 truncate">{track.track}</div>
              <div className="text-xs text-white/50">{track.playlist ? `Плейлист: ${track.playlist}` : 'Плейлист не назначен'}</div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="font-mono text-white/70">{formatDuration(elapsed)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${z.online ? 'bg-emerald-400/80' : 'bg-white/30'} transition-all duration-500`} style={{ width: `${percent}%` }} />
                </div>
                <span className="font-mono text-white/50">{formatDuration(length)}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-md px-3 py-2">
              Плеер свободен — назначьте плейлист, чтобы начать эфир.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-white/60">
          <span>Скорость: {z.speed ? `${z.speed} Мбит/с` : '—'}</span>
          <span>Задержка: {z.latency != null ? `${z.latency} мс` : '—'}</span>
          <span>Аптайм: {z.uptime || '—'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn min-w-[2.75rem]" onClick={onPlay}>▶</button>
          <button className="btn min-w-[2.75rem]" onClick={onStop}>⏹</button>
          <button className="btn" onClick={onOpen}>Подробнее</button>
        </div>
        <div className="w-full sm:w-60">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span>Громкость</span>
            <span>{z.volume != null ? `${z.volume}%` : '—'}</span>
          </div>
          <input
            className="accent-white/90 w-full"
            type="range"
            min="0"
            max="100"
            defaultValue={z.volume ?? 70}
            onChange={(e)=>onVolume?.(+e.target.value)}
          />
        </div>
      </div>
    </motion.div>
  )
}
