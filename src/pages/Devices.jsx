import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  createDeviceSeeds,
  fabricateNewDevice,
  DeviceCard,
  DeviceScannerPanel,
  ManualDeviceForm,
} from '../features/devices'

function maskPassword(value){
  if (!value) return ''
  return '•'.repeat(Math.max(4, value.length))
}

export default function Devices(){
  const [devices, setDevices] = useState(() => createDeviceSeeds())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [scanning, setScanning] = useState(false)
  const [showManual, setShowManual] = useState(false)

  function handleScan(){
    if (scanning) return
    setScanning(true)
    window.setTimeout(() => {
      setDevices(prev => {
        const next = [...prev]
        const pending = next.filter(d => d.status === 'pending')
        const updated = next.map(device => {
          if (device.status === 'pending'){
            return { ...device, status: 'online', onboarding: false, updatedAt: 'только что' }
          }
          if (device.status === 'offline'){
            return { ...device, updatedAt: 'пару секунд назад', signal: 35 + Math.floor(Math.random() * 40) }
          }
          return device
        })
        if (pending.length === 0){
          updated.push({ ...fabricateNewDevice(), credentials: { username: '', password: '', stored: false } })
        }
        return updated
      })
      setScanning(false)
    }, 1400)
  }

  function handleManualCreate(form){
    const device = {
      id: form.ip || `manual-${Date.now()}`,
      name: form.name.trim() || 'Новое устройство',
      ip: form.ip.trim(),
      model: 'Era Stream Hub',
      firmware: '—',
      status: 'pending',
      signal: 45,
      bandwidth: 0,
      latency: null,
      lastSeen: 'добавлено вручную',
      discovered: false,
      credentials: { username: form.username.trim(), password: maskPassword(form.password.trim()), stored: !!form.password },
      tags: ['Добавлено вручную'],
      discoveredAt: 'Добавлено вручную',
      updatedAt: 'только что',
      onboarding: true,
    }
    setDevices(prev => [device, ...prev])
    setShowManual(false)
  }

  function handleCredentialsSubmit(id, creds){
    setDevices(prev => prev.map(device => {
      if (device.id !== id) return device
      return {
        ...device,
        credentials: {
          username: creds.username.trim(),
          password: maskPassword(creds.password.trim()),
          stored: true,
        },
        onboarding: false,
        updatedAt: 'только что',
      }
    }))
  }

  function handleToggleSelect(id){
    setDevices(prev => prev.map(device => device.id === id ? { ...device, selected: !device.selected } : device))
  }

  function handlePushConfig(id){
    setDevices(prev => prev.map(device => device.id === id ? {
      ...device,
      status: 'pending',
      onboarding: true,
      updatedAt: 'обновление параметров',
    } : device))
    window.setTimeout(() => {
      setDevices(prev => prev.map(device => device.id === id ? {
        ...device,
        status: 'online',
        onboarding: false,
        updatedAt: 'успешно синхронизировано',
        signal: Math.min(100, (device.signal || 55) + 10),
      } : device))
    }, 1800)
  }

  function handleReboot(id){
    setDevices(prev => prev.map(device => device.id === id ? {
      ...device,
      status: 'pending',
      updatedAt: 'перезагрузка',
    } : device))
    window.setTimeout(() => {
      setDevices(prev => prev.map(device => device.id === id ? {
        ...device,
        status: 'online',
        onboarding: false,
        updatedAt: 'готово',
      } : device))
    }, 2200)
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return devices.filter(device => {
      const matchesStatus = filter === 'all' || device.status === filter
      const matchesText = !needle || device.name.toLowerCase().includes(needle) || device.ip.includes(needle)
      return matchesStatus && matchesText
    })
  }, [devices, search, filter])

  const discoveredCount = devices.filter(d => d.discovered).length

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <DeviceScannerPanel
        scanning={scanning}
        onScan={handleScan}
        search={search}
        onSearch={setSearch}
        statusFilter={filter}
        onStatusFilter={setFilter}
        onToggleManual={() => setShowManual(prev => !prev)}
        showManual={showManual}
        total={devices.length}
        discovered={discoveredCount}
      />

      <AnimatePresence>{showManual && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <ManualDeviceForm onCreate={handleManualCreate} />
        </motion.div>
      )}</AnimatePresence>

      <div className="grid gap-4">
        <AnimatePresence>
          {filtered.map(device => (
            <motion.div key={device.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <DeviceCard
                device={device}
                onCredentialsSubmit={handleCredentialsSubmit}
                onToggleSelect={handleToggleSelect}
                onPushConfig={handlePushConfig}
                onReboot={handleReboot}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="glass rounded-3xl border border-white/5 p-8 text-center text-white/60">
            Не найдено устройств по текущему фильтру.
          </div>
        )}
      </div>
    </div>
  )
}
