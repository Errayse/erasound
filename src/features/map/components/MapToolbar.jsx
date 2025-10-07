import React from 'react'
import { IconHand, IconPen, IconTarget, IconZoomIn, IconZoomOut, IconLayers, IconCompass } from './icons'

const tools = [
  { id: 'select', label: 'Перемещение', Icon: IconHand },
  { id: 'draw', label: 'Рисовать зону', Icon: IconPen },
  { id: 'drop', label: 'Разместить', Icon: IconTarget },
]

export default function MapToolbar({ tool, onToolChange, zoom, onZoomIn, onZoomOut, onFit }){
  return (
    <div className="glass rounded-3xl border border-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {tools.map(({ id, label, Icon }) => {
            const active = tool === id
            return (
              <button
                key={id}
                onClick={() => onToolChange(id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${active ? 'border-white/30 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'}`}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <button
            onClick={onZoomOut}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-white/30 hover:text-white"
            title="Отдалить"
          >
            <IconZoomOut className="h-4 w-4" />
          </button>
          <span className="w-20 rounded-full bg-white/5 px-3 py-1 text-center text-white/70">{Math.round(zoom * 100)}%</span>
          <button
            onClick={onZoomIn}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-white/30 hover:text-white"
            title="Приблизить"
          >
            <IconZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={onFit}
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-white/30 hover:text-white"
            title="Подогнать"
          >
            <IconCompass className="h-4 w-4" />
          </button>
          <span className="ml-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-white/50">
            <IconLayers className="h-3.5 w-3.5" />
            План этажа
          </span>
        </div>
      </div>
    </div>
  )
}
