import React from 'react'
import { IconTrash } from './icons'

export default function ZoneLegend({ zones, activeZone, onSelectZone, onRemoveZone }){
  return (
    <div className="glass rounded-3xl border border-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Зоны</h3>
          <p className="text-sm text-white/60">Полигоны на карте, окрашенные по цвету помещения.</p>
        </div>
      </div>
      <div className="grid gap-2">
        {zones.map(zone => {
          const selected = activeZone === zone.id
          return (
            <div
              key={zone.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition ${selected ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
            >
              <button onClick={() => onSelectZone(zone.id)} className="flex flex-1 items-center gap-3 text-left">
                <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{zone.name || 'Новая зона'}</p>
                  <p className="truncate text-xs text-white/50">{zone.points.length} точек</p>
                </div>
              </button>
              <button
                onClick={() => onRemoveZone(zone.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-rose-400/40 hover:text-rose-200"
                title="Удалить зону"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
        {zones.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-white/50">
            Пока нет зон. Нарисуйте область на карте.
          </div>
        )}
      </div>
    </div>
  )
}
