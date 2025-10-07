import React, { useMemo, useState } from 'react'
import Modal from '../components/Modal'
import MapToolbar from '../features/map/components/MapToolbar'
import DevicePalette from '../features/map/components/DevicePalette'
import ZoneLegend from '../features/map/components/ZoneLegend'
import InteractiveMap from '../features/map/components/InteractiveMap'
import { createMapDevices, createDefaultZones } from '../features/map/seeds'
import { lighten, normalizePosition } from '../features/map/utils'

const ZONE_COLORS = ['#22d3ee', '#34d399', '#f97316', '#a855f7', '#f472b6', '#facc15']

export default function Map(){
  const [devices, setDevices] = useState(() => createMapDevices())
  const [zones, setZones] = useState(() => createDefaultZones())
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(1)
  const [pendingDevice, setPendingDevice] = useState(null)
  const [activeZone, setActiveZone] = useState(null)
  const [zoneForm, setZoneForm] = useState(null)

  const placedCount = useMemo(() => devices.filter(device => !!device.position).length, [devices])

  function updateDevicePosition(id, position){
    const safe = normalizePosition(position)
    setDevices(prev => prev.map(device => device.id === id ? { ...device, position: safe } : device))
  }

  function placeDevice(id, position){
    const safe = normalizePosition(position)
    setDevices(prev => prev.map(device => device.id === id ? { ...device, position: safe } : device))
    setPendingDevice(null)
    setTool('select')
  }

  function handleZoneComplete({ points }){
    const color = ZONE_COLORS[zones.length % ZONE_COLORS.length]
    setZoneForm({ id: `zone-${Date.now()}`, name: '', color, points })
  }

  function submitZone(){
    if (!zoneForm) return
    const name = zoneForm.name.trim() || 'Новая зона'
    const color = zoneForm.color
    const stroke = lighten(color, 0.35)
    const fill = lighten(color, 0.18)
    setZones(prev => [...prev, { id: zoneForm.id, name, color, stroke, fill, points: zoneForm.points }])
    setActiveZone(zoneForm.id)
    setZoneForm(null)
  }

  function removeZone(id){
    setZones(prev => prev.filter(zone => zone.id !== id))
    if (activeZone === id){
      setActiveZone(null)
    }
  }

  function toggleDeploy(id){
    setPendingDevice(id)
    setTool('drop')
  }

  function adjustZoom(delta){
    setZoom(prev => Math.min(1.8, Math.max(0.6, prev + delta)))
  }

  function focusDevice(id){
    setPendingDevice(prev => {
      if (prev === id){
        if (tool === 'drop') setTool('select')
        return null
      }
      return id
    })
  }

  const placedDevices = devices.filter(device => !!device.position)
  const unplacedDevices = devices.length - placedDevices.length

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <section className="glass rounded-3xl border border-white/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Карта оборудования</h2>
            <p className="text-sm text-white/60">Расположите узлы EraSound, рисуйте акустические зоны и фиксируйте реальные помещения.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-white/70">
            <StatChip label="Размещено устройств" value={`${placedCount} / ${devices.length}`} />
            <StatChip label="Зон на карте" value={zones.length} />
            <StatChip label="Осталось распределить" value={unplacedDevices} tone="bg-white/10" />
          </div>
        </div>
      </section>

      <MapToolbar
        tool={tool}
        onToolChange={setTool}
        zoom={zoom}
        onZoomIn={() => adjustZoom(0.1)}
        onZoomOut={() => adjustZoom(-0.1)}
        onFit={() => setZoom(1)}
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <DevicePalette
            devices={devices}
            activeId={pendingDevice}
            onSelect={focusDevice}
            onToggleDeploy={toggleDeploy}
            deployId={pendingDevice}
          />
          <ZoneLegend
            zones={zones}
            activeZone={activeZone}
            onSelectZone={setActiveZone}
            onRemoveZone={removeZone}
          />
        </div>
        <div className="space-y-4">
          <InteractiveMap
            devices={devices}
            zones={zones}
            tool={tool}
            zoom={zoom}
            activeZone={activeZone}
            pendingDeviceId={pendingDevice}
            onDevicePositionChange={updateDevicePosition}
            onDevicePlace={placeDevice}
            onZoneComplete={handleZoneComplete}
            onSelectZone={setActiveZone}
          />

          <div className="glass rounded-3xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white">Подсказки</h3>
            <ul className="mt-3 grid gap-2 text-xs text-white/60">
              <li>— Выберите инструмент «Рисовать зону», зажмите кнопку мыши и обведите помещение. После отпускания появится окно для названия.</li>
              <li>— В режиме «Разместить» кликните по карте, чтобы зафиксировать выбранное устройство. Удерживайте устройство для точного перемещения.</li>
              <li>— Масштабируйте карту колёсиком мыши или кнопками +/- и используйте «Подогнать», чтобы вернуть вид по умолчанию.</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal open={!!zoneForm} onClose={() => setZoneForm(null)} title="Новая зона">
        <div className="space-y-4">
          <p className="text-sm text-white/70">Зона добавлена на карту. Укажите название и при необходимости уточните назначение.</p>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-white/50">Название зоны</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
              placeholder="Например, Лаунж"
              value={zoneForm?.name ?? ''}
              onChange={(event) => setZoneForm(prev => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: zoneForm?.color }} aria-hidden />
              Цвет зоны выбран автоматически
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setZoneForm(null)}>Отмена</button>
              <button className="btn" onClick={submitZone}>Сохранить</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatChip({ label, value, tone = 'bg-emerald-400/10' }){
  return (
    <span className={`inline-flex flex-col rounded-2xl border border-white/10 ${tone} px-3 py-2 text-left`}>
      <span className="text-[11px] uppercase tracking-wide text-white/40">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </span>
  )
}
