import React, { useState } from 'react'
import { IconLan, IconLock, IconKey, IconPlus, IconFolder } from '../icons'

export default function ManualDeviceForm({ onCreate }){
  const [form, setForm] = useState({
    name: '',
    ip: '',
    username: '',
    password: '',
  })

  function update(field, value){
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e){
    e.preventDefault()
    if (!form.name.trim() || !form.ip.trim()) return
    onCreate?.({ ...form })
    setForm({ name: '', ip: '', username: '', password: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field
            icon={IconFolder}
            label="Название"
            placeholder="Например, Бар · Усилитель"
            value={form.name}
            onChange={(value) => update('name', value)}
          />
          <Field
            icon={IconLan}
            label="IP-адрес"
            placeholder="192.168.0.120"
            value={form.ip}
            onChange={(value) => update('ip', value)}
          />
          <Field
            icon={IconLock}
            label="Логин"
            placeholder="admin"
            value={form.username}
            onChange={(value) => update('username', value)}
          />
          <Field
            icon={IconKey}
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            value={form.password}
            onChange={(value) => update('password', value)}
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-400/20"
        >
          <IconPlus className="h-4 w-4" />
          Добавить устройство
        </button>
      </div>
    </form>
  )
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text' }){
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-wide text-white/50">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-white/30">
        <Icon className="h-4 w-4 text-white/60" />
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
