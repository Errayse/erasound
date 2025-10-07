import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import deviceIllustration from '../../../assets/era-device.svg'
import { IconSignal, IconPower, IconMore, IconLock, IconRefresh, IconCheck, IconKey, IconLan } from '../icons'

const statusStyles = {
  online: { label: 'Онлайн', tone: 'bg-emerald-500/80 text-emerald-100 border-emerald-400/50' },
  offline: { label: 'Оффлайн', tone: 'bg-rose-500/80 text-rose-100 border-rose-400/50' },
  degraded: { label: 'Нестабильно', tone: 'bg-amber-500/80 text-amber-100 border-amber-400/40' },
  pending: { label: 'Ожидает', tone: 'bg-sky-500/80 text-sky-100 border-sky-400/40' },
}

function signalColor(value){
  if (value >= 80) return 'bg-emerald-400'
  if (value >= 55) return 'bg-sky-400'
  if (value >= 30) return 'bg-amber-400'
  return 'bg-rose-400'
}

export default function DeviceCard({
  device,
  onCredentialsChange,
  onCredentialsSubmit,
  onToggleSelect,
  onPushConfig,
  onReboot,
}){
  const [focus, setFocus] = useState(false)
  const selected = !!device.selected
  const status = statusStyles[device.status] || statusStyles.pending
  const [authDraft, setAuthDraft] = useState(() => ({
    username: device.credentials?.username || '',
    password: device.credentials?.password?.replace(/•/g, '') || '',
  }))

  const hasChanges = useMemo(() => {
    const originalUser = device.credentials?.username || ''
    const originalPass = (device.credentials?.password || '').replace(/•/g, '')
    return authDraft.username !== originalUser || authDraft.password !== originalPass
  }, [authDraft, device.credentials])

  function updateField(field, value){
    setAuthDraft(prev => ({ ...prev, [field]: value }))
    onCredentialsChange?.(device.id, { ...authDraft, [field]: value })
  }

  function handleSubmit(){
    onCredentialsSubmit?.(device.id, authDraft)
  }

  function handleToggle(){
    onToggleSelect?.(device.id)
  }

  function handlePush(){
    onPushConfig?.(device.id)
  }

  function handleReboot(){
    onReboot?.(device.id)
  }

  return (
    <motion.article
      layout
      className={`glass relative overflow-hidden rounded-3xl border border-white/5 transition shadow-lg shadow-black/10 ${focus ? 'ring-2 ring-white/20' : ''} ${selected ? 'border-emerald-400/40 ring-2 ring-emerald-400/30' : ''}`}
      onFocusCapture={() => setFocus(true)}
      onBlurCapture={() => setFocus(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/0" aria-hidden />
      <div className="flex flex-col gap-6 p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.span layout className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${status.tone}`}>
                <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                {status.label}
              </motion.span>
              <button
                onClick={handleToggle}
                className={`rounded-full p-2 transition ${selected ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                title="Отметить устройство"
              >
                <IconMore className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">{device.name}</h3>
              <p className="text-sm text-white/60">{device.ip} · {device.model}</p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center justify-center rounded-2xl bg-white/5 p-3 sm:flex">
            <img src={deviceIllustration} alt="EraSound устройство" className="h-20 w-20 object-contain" />
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <MetricRow icon={IconSignal} label="Сигнал" value={device.signal ? `${device.signal}%` : '—'}>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className={`h-full ${signalColor(device.signal || 0)}`} style={{ width: `${Math.max(0, Math.min(100, device.signal || 0))}%` }} />
              </div>
            </MetricRow>
            <MetricRow icon={IconLan} label="Сеть" value={device.bandwidth ? `${device.bandwidth} Мбит/с` : '—'}>
              <span className="text-xs text-white/50">задержка {device.latency != null ? `${device.latency} мс` : '—'}</span>
            </MetricRow>
            <MetricRow icon={IconLock} label="Защита" value={device.credentials?.stored ? 'Сохранено' : 'Требуется ввод'}>
              <span className="text-xs text-white/50">{device.discoveredAt}</span>
            </MetricRow>
          </div>

          <div className="space-y-3">
            <CredentialsField
              label="Логин"
              value={authDraft.username}
              placeholder="admin"
              onChange={(val) => updateField('username', val)}
            />
            <CredentialsField
              label="Пароль"
              type="password"
              value={authDraft.password}
              placeholder="Введите пароль"
              onChange={(val) => updateField('password', val)}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-white/50">
              <span>Обновлено: {device.updatedAt}</span>
              {device.onboarding && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-200">Нужно подтвердить</span>}
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
            {device.tags?.map(tag => (
              <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-white/70">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ToolbarButton icon={IconRefresh} label="Пересканировать" onClick={handlePush} />
            <ToolbarButton icon={IconPower} label="Перезагрузить" onClick={handleReboot} />
            <ToolbarButton icon={IconCheck} label="Сохранить доступ" disabled={!hasChanges} onClick={handleSubmit} accent />
          </div>
        </footer>
      </div>
    </motion.article>
  )
}

function MetricRow({ icon: Icon, label, value, children }){
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-white/70">{label}</p>
            <p className="text-sm text-white">{value}</p>
          </div>
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

function CredentialsField({ label, value, placeholder, onChange, type = 'text' }){
  return (
    <label className="block space-y-1">
      <span className="text-xs uppercase tracking-wide text-white/50">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2 focus-within:border-white/30">
        {label === 'Пароль' ? <IconKey className="h-4 w-4 text-white/60" /> : <IconLock className="h-4 w-4 text-white/60" />}
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
        />
      </div>
    </label>
  )
}

function ToolbarButton({ icon: Icon, label, onClick, disabled, accent }){
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group flex h-11 w-11 items-center justify-center rounded-full border border-white/5 ${accent ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'} transition hover:border-white/40 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-30`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
