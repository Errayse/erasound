import React, { useMemo, useRef, useState } from 'react'
import Modal from '../components/Modal'
import MapToolbar from '../features/map/components/MapToolbar'
import DevicePalette from '../features/map/components/DevicePalette'
import ZoneLegend from '../features/map/components/ZoneLegend'
import InteractiveMap from '../features/map/components/InteractiveMap'
import {
  createMapDevices,
  createDefaultZones,
  MAP_CENTER,
  ZONE_NAME_SUGGESTIONS,
} from '../features/map/seeds'
import { lighten } from '../features/map/utils'

const ZONE_COLORS = ['#22d3ee', '#34d399', '#f97316', '#a855f7', '#f472b6', '#facc15']

export default function Map(){
  const [devices, setDevices] = useState(() => createMapDevices())
  const [zones, setZones] = useState(() => createDefaultZones())
  const [tool, setTool] = useState('select')
  const [zoom, setZoom] = useState(17)
  const [pendingDevice, setPendingDevice] = useState(null)
  const [activeZone, setActiveZone] = useState(null)
  const [zoneForm, setZoneForm] = useState(null)
  const fitRef = useRef(null)

  const availableZoneNames = useMemo(() => {
    const existing = zones.map(zone => zone.name).filter(Boolean)
    return Array.from(new Set([...ZONE_NAME_SUGGESTIONS, ...existing]))
  }, [zones])

  const placedCount = useMemo(() => devices.filter(device => !!device.position).length, [devices])

  function updateDevicePosition(id, position){
    setDevices(prev => prev.map(device => device.id === id ? { ...device, position } : device))
  }

  function placeDevice(id, latlng){
    setDevices(prev => prev.map(device => device.id === id ? { ...device, position: { lat: latlng.lat, lng: latlng.lng } } : device))
    setPendingDevice(null)
    setTool('select')
  }

  function handleZoneComplete({ points }){
    const color = ZONE_COLORS[zones.length % ZONE_COLORS.length]
    const defaultOption = availableZoneNames[0] || ''
    setZoneForm({
      id: `zone-${Date.now()}`,
      name: '',
      selectedName: defaultOption,
      mode: defaultOption ? 'existing' : 'custom',
      color,
      points,
    })
  }

  function submitZone(){
    if (!zoneForm) return
    const baseName = zoneForm.mode === 'existing'
      ? (zoneForm.selectedName || zoneForm.name)
      : zoneForm.name
    const name = baseName?.trim() || 'Новая зона'
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
    setPendingDevice(prev => {
      const next = prev === id ? null : id
      setTool(next ? 'drop' : 'select')
      return next
    })
  }

  function focusDevice(id){
    setPendingDevice(prev => prev === id ? null : id)
  }

  function handleToolChange(nextTool){
    setTool(nextTool)
    if (nextTool !== 'drop'){
      setPendingDevice(null)
    }
  }

  function handleZoomIn(){
    setZoom(prev => Math.min(prev + 0.5, 20))
  }

  function handleZoomOut(){
    setZoom(prev => Math.max(prev - 0.5, 3))
  }

  function handleFit(){
    fitRef.current?.()
  }

  const unplacedDevices = devices.length - placedCount

  const zoneSelectValue = zoneForm?.mode === 'existing' ? zoneForm.selectedName : '__custom__'

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
        onToolChange={handleToolChange}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
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
            center={MAP_CENTER}
            zoom={zoom}
            devices={devices}
            zones={zones}
            tool={tool}
            activeZone={activeZone}
            pendingDeviceId={pendingDevice}
            onDevicePositionChange={updateDevicePosition}
            onDevicePlace={placeDevice}
            onZoneComplete={handleZoneComplete}
            onSelectZone={setActiveZone}
            onZoomChange={setZoom}
            fitToContent={fitRef}
          />

          <div className="glass rounded-3xl border border-white/5 p-5">
            <h3 className="text-sm font-semibold text-white">Подсказки</h3>
            <ul className="mt-3 grid gap-2 text-xs text-white/60">
              <li>— Инструмент «Рисовать зону» добавляет точку по клику. Двойной клик завершает полигон и открывает окно выбора названия.</li>
              <li>— В режиме «Разместить» кликните по карте, чтобы зафиксировать выбранное устройство. Перемещать устройство можно перетаскиванием маркера.</li>
              <li>— Масштабируйте карту колесом мыши или кнопками +/- и используйте «Подогнать», чтобы вернуть оптимальный охват.</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal open={!!zoneForm} onClose={() => setZoneForm(null)} title="Новая зона">
        <div className="space-y-4">
          <p className="text-sm text-white/70">Зона добавлена на карту. Укажите название или выберите одну из существующих зон.</p>
          {availableZoneNames.length > 0 && (
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wide text-white/50">Существующие зоны</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                value={zoneSelectValue}
                onChange={(event) => {
                  const value = event.target.value
                  setZoneForm(prev => {
                    if (!prev) return prev
                    if (value === '__custom__'){
                      return { ...prev, mode: 'custom' }
                    }
                    return { ...prev, mode: 'existing', selectedName: value }
                  })
                }}
              >
                {availableZoneNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="__custom__">Другое название</option>
              </select>
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-white/50">Название зоны</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
              placeholder="Например, Лаунж"
              value={zoneForm?.mode === 'existing' ? (zoneForm.selectedName || '') : zoneForm?.name ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setZoneForm(prev => {
                  if (!prev) return prev
                  if (prev.mode === 'existing'){
                    return { ...prev, selectedName: value, mode: 'custom' }
                  }
                  return { ...prev, name: value }
                })
              }}
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
