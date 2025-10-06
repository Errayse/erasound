import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  IconChevronDown,
  IconClock,
  IconDeviceSmall,
  IconPlaylistSmall,
  IconPlus,
  IconPrev,
  IconPlay,
  IconStop,
  IconNext,
} from './icons'
import { formatClockLabel } from '../../planner/utils'

export const panelClass = 'panel bg-white/5 border border-white/10 rounded-lg shadow-glass'

export function SectionHeader({ title, subtitle, actions }){
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-sm text-white/60">{subtitle}</div>
      </div>
      <div className="flex gap-2">{actions}</div>
      <div className="w-full h-px bg-white/10 md:hidden" />
    </div>
  )
}

export function SubsectionHeader({ title, subtitle, onAction, actionLabel }){
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <div className="text-xs uppercase tracking-wide text-white/50">{title}</div>
        {subtitle && <div className="text-xs text-white/40">{subtitle}</div>}
      </div>
      {onAction && (
        <CircleIconButton icon={<IconPlus className="h-4 w-4" />} label={actionLabel} onClick={onAction} />
      )}
    </div>
  )
}

export function CircleIconButton({ icon, label, onClick, tone = 'neutral', size = 'md', variant = 'solid' }){
  const toneClass = tone === 'danger'
    ? 'text-rose-200 hover:text-rose-100 focus-visible:ring-rose-300/40'
    : 'text-white/70 hover:text-white focus-visible:ring-white/40'

  const variantClass = variant === 'ghost'
    ? 'bg-transparent hover:bg-white/10'
    : 'bg-white/10 hover:bg-white/20'

  const sizeClass = size === 'sm' ? 'h-9 w-9' : size === 'xs' ? 'h-8 w-8' : 'h-10 w-10'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${sizeClass} ${variantClass} ${toneClass}`}
    >
      {icon}
    </button>
  )
}

export function SummaryPill({ icon, label, value }){
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
      <span className="text-white/50" aria-hidden="true">{icon}</span>
      <span className="font-semibold text-white">{value}</span>
      <span className="text-white/40">{label}</span>
    </div>
  )
}

export function OverviewTile({ icon, title, value, hint }){
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-white/60 text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {hint && <div className="text-xs text-white/40 truncate">{hint}</div>}
    </div>
  )
}

export function ScheduleBadge({ children }){
  return (
    <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/60">
      {children}
    </span>
  )
}

export function ToggleChip({ active, onClick, labelOn = 'Вкл', labelOff = 'Выкл' }){
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors
        ${active ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-300' : 'bg-white/30'}`} />
      {active ? labelOn : labelOff}
    </button>
  )
}

export function DeviceDetailChip({ name, ip, status, onRemove }){
  const color = status === 'offline' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <div className="min-w-0">
        <div className="truncate text-sm text-white/80">{name}</div>
        <div className="text-[11px] text-white/40">{ip}</div>
      </div>
      <CircleIconButton
        icon={<IconPlus className="h-3.5 w-3.5 rotate-45" />}
        label={`Убрать ${name}`}
        onClick={onRemove}
        size="xs"
        variant="ghost"
      />
    </div>
  )
}

export function AddDeviceDropdown({ available = [], onSelect }){
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hasOptions = Array.isArray(available) && available.length > 0

  useEffect(() => {
    function handleClick(event){
      if (!ref.current) return
      if (!ref.current.contains(event.target)){
        setOpen(false)
      }
    }
    if (open){
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!hasOptions) setOpen(false)
  }, [hasOptions])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${hasOptions ? 'hover:bg-white/20 hover:text-white' : 'cursor-not-allowed opacity-40'}`}
        onClick={() => hasOptions && setOpen(v => !v)}
        disabled={!hasOptions}
        aria-label="Добавить устройство"
        title={hasOptions ? 'Добавить устройство' : 'Нет доступных устройств'}
      >
        <IconPlus className="h-4 w-4" />
      </button>
      {open && hasOptions && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-white/10 bg-neutral-950/90 backdrop-blur px-2 py-2 shadow-xl">
          <div className="text-xs text-white/40 px-3 pb-2">Доступные устройства</div>
          <div className="space-y-1 max-h-56 overflow-auto pr-1">
            {available.map(dev => (
              <button
                key={dev.ip}
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                onClick={() => { onSelect(dev.ip); setOpen(false) }}
              >
                <div className="font-medium truncate">{dev.name || dev.ip}</div>
                <div className="text-xs text-white/50">{dev.ip}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ZonePlayerFooter({ player, progressPercent, elapsedSeconds, trackLength, onPlayerAction }){
  const isPlaying = Boolean(player?.isPlaying)
  const hasTrack = Boolean(player?.track)
  const title = hasTrack ? player.track : 'Нет активного трека'
  const artist = player?.artist
  const playlist = player?.playlist
  const progressValue = Number.isFinite(progressPercent)
    ? Math.max(0, Math.min(100, Math.round(progressPercent)))
    : 0

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{isPlaying ? 'Сейчас в эфире' : 'Эфир приостановлен'}</span>
        {playlist && <span className="max-w-[60%] truncate text-right text-white/40">{playlist}</span>}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`truncate text-sm font-medium ${hasTrack ? 'text-white/85' : 'text-white/40'}`}>
              {title}
            </div>
            {artist && <div className="text-xs text-white/40 truncate">{artist}</div>}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-white/30'}`} />
            <span>{isPlaying ? 'В эфире' : 'Ожидание'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CircleIconButton icon={<IconPrev className="h-4 w-4" />} label="Предыдущий трек" onClick={() => onPlayerAction?.('prev')} variant="ghost" size="sm" />
              <CircleIconButton icon={<IconPlay className="h-4 w-4" />} label="Воспроизвести" onClick={() => onPlayerAction?.('play')} variant="ghost" size="sm" />
              <CircleIconButton icon={<IconStop className="h-4 w-4" />} label="Остановить" onClick={() => onPlayerAction?.('stop')} variant="ghost" size="sm" />
              <CircleIconButton icon={<IconNext className="h-4 w-4" />} label="Следующий трек" onClick={() => onPlayerAction?.('next')} variant="ghost" size="sm" />
            </div>
            <div className="min-w-[56px] text-right text-xs text-white/50">{progressValue}%</div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-white/80"
                initial={{ width: 0 }}
                animate={{ width: `${progressValue}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/40">
              <span>{formatClockLabel(elapsedSeconds)}</span>
              <span>{formatClockLabel(trackLength)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
