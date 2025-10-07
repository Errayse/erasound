import React from 'react'
import { statusTone } from '../utils'

export default function DevicePalette({ devices, onSelect, activeId, onToggleDeploy, deployId }){
  return (
    <div className="glass rounded-3xl border border-white/5 p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white">Устройства</h3>
        <p className="text-sm text-white/60">Перетащите или кликните, чтобы разместить узлы на плане.</p>
      </div>
      <div className="grid gap-3">
        {devices.map(device => {
          const tone = statusTone(device.status)
          const selected = activeId === device.id
          const pendingDeploy = deployId === device.id
          const nowPlaying = device.nowPlaying
          const playbackLabel = nowPlaying?.status === 'playing'
            ? 'В эфире'
            : nowPlaying?.status === 'paused'
              ? 'На паузе'
              : device.status === 'offline'
                ? 'Нет сигнала'
                : 'Готов'
          return (
            <div
              key={device.id}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${selected ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
            >
              <button onClick={() => onSelect(device.id)} className="flex flex-1 items-start gap-3 text-left">
                <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">{device.name}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${selected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}
                    >
                      {device.position ? 'На карте' : 'В списке'}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white/50">{device.ip} · {device.zone || 'Не закреплено'}</p>
                  <p className="truncate text-[11px] text-white/60">{playbackLabel}{nowPlaying?.track ? ` · ${nowPlaying.track}` : ''}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onToggleDeploy(device.id)}
                className={`ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white ${pendingDeploy ? 'bg-emerald-400/20 text-emerald-100' : ''}`}
                title={device.position ? 'Переместить' : 'Разместить на карте'}
              >
                ▸
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
