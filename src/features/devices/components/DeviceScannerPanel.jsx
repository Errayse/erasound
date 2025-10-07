import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconRadar, IconSearch, IconFilter, IconPlus } from '../icons'

const filterOptions = [
  { id: 'all', label: 'Все' },
  { id: 'online', label: 'Онлайн' },
  { id: 'degraded', label: 'Нестабильные' },
  { id: 'offline', label: 'Оффлайн' },
  { id: 'pending', label: 'Ожидание' },
]

export default function DeviceScannerPanel({
  scanning,
  onScan,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  onToggleManual,
  showManual,
  total,
  discovered,
}){
  return (
    <div className="glass rounded-3xl border border-white/5 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Устройства EraSound</h2>
          <p className="text-sm text-white/60">Управляйте обнаружением, подтверждением и доступом к модулям в сети.</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence initial={false}>
            {scanning && (
              <motion.span
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                Поиск устройств...
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={onScan}
            className={`flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm transition ${scanning ? 'bg-white/10 text-white/60' : 'bg-white/10 text-white hover:border-white/30 hover:bg-white/20 hover:text-white'}`}
            disabled={scanning}
          >
            <IconRadar className={`h-4 w-4 ${scanning ? 'animate-spin text-emerald-300' : 'text-white'}`} />
            Сканировать сеть
          </button>
          <button
            onClick={onToggleManual}
            className={`flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white ${showManual ? 'bg-white/10 text-white' : 'bg-transparent'}`}
          >
            <IconPlus className="h-4 w-4" />
            Добавить вручную
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <IconSearch className="h-4 w-4 text-white/50" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Поиск по названию или IP"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          <span className="text-xs text-white/50">{total} устройств · {discovered} авто</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
            <IconFilter className="h-3.5 w-3.5" />
            Состояние
          </span>
          {filterOptions.map(option => {
            const active = statusFilter === option.id
            return (
              <button
                key={option.id}
                onClick={() => onStatusFilter(option.id)}
                className={`rounded-full px-3 py-1 text-xs transition ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
