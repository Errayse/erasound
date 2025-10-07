import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { lighten, statusTone, toneColor } from '../utils'

const TILE_LAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function InteractiveMap({
  center,
  zoom,
  devices,
  zones,
  tool,
  activeZone,
  pendingDeviceId,
  onDevicePositionChange,
  onDevicePlace,
  onZoneComplete,
  onSelectZone,
  onZoomChange,
  fitToContent,
}){
  const [mapInstance, setMapInstance] = useState(null)
  const [draftPoints, setDraftPoints] = useState([])

  useEffect(() => {
    if (!mapInstance) return
    const handleZoom = () => {
      onZoomChange?.(mapInstance.getZoom())
    }
    mapInstance.on('zoomend', handleZoom)
    return () => {
      mapInstance.off('zoomend', handleZoom)
    }
  }, [mapInstance, onZoomChange])

  useEffect(() => {
    if (!mapInstance || !fitToContent) return
    fitToContent.current = () => {
      const bounds = computeBounds(devices, zones)
      if (bounds){
        mapInstance.fitBounds(bounds, { padding: [32, 32] })
      } else {
        mapInstance.setView(center, mapInstance.getZoom())
      }
    }
  }, [mapInstance, devices, zones, fitToContent, center])

  useEffect(() => {
    if (!mapInstance) return
    if (mapInstance.getZoom() !== zoom){
      mapInstance.setZoom(zoom)
    }
  }, [mapInstance, zoom])

  return (
    <div className="relative w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        whenCreated={setMapInstance}
        doubleClickZoom={false}
        scrollWheelZoom
        className="h-[520px] w-full overflow-hidden rounded-3xl border border-white/5"
        attributionControl={false}
      >
        <TileLayer url={TILE_LAYER} attribution="&copy; OpenStreetMap contributors" />

        <DrawingLayer
          tool={tool}
          pendingDeviceId={pendingDeviceId}
          draftPoints={draftPoints}
          setDraftPoints={setDraftPoints}
          onDevicePlace={onDevicePlace}
          onZoneComplete={onZoneComplete}
          onSelectZone={onSelectZone}
        />

        {zones.map(zone => (
          <Polygon
            key={zone.id}
            positions={zone.points.map(point => [point.lat, point.lng])}
            pathOptions={{
              color: lighten(zone.color, 0.4),
              fillColor: lighten(zone.color, activeZone === zone.id ? 0.35 : 0.2),
              fillOpacity: 0.7,
              weight: activeZone === zone.id ? 3 : 2,
            }}
            eventHandlers={{
              click: (event) => {
                event.originalEvent?.stopPropagation()
                onSelectZone?.(zone.id)
              },
            }}
          >
            <Tooltip direction="center" offset={[0, 0]} permanent className="era-map-popover">
              <span className="text-xs font-medium text-white drop-shadow-lg">{zone.name}</span>
            </Tooltip>
          </Polygon>
        ))}

        {draftPoints.length > 1 && (
          <Polyline
            positions={draftPoints.map(point => [point.lat, point.lng])}
            pathOptions={{ color: 'rgba(56,189,248,0.65)', weight: 2, dashArray: '8 6' }}
          />
        )}

        {devices.map(device => (
          <DeviceMarker
            key={device.id}
            device={device}
            pending={pendingDeviceId === device.id}
            onDragEnd={onDevicePositionChange}
          />
        ))}
      </MapContainer>

      <AnimatePresence>
        {pendingDeviceId && tool === 'drop' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-max rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100"
          >
            Кликните по карте, чтобы разместить устройство.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DrawingLayer({ tool, pendingDeviceId, draftPoints, setDraftPoints, onDevicePlace, onZoneComplete, onSelectZone }){
  useMapEvents({
    click(event){
      if (tool === 'drop' && pendingDeviceId){
        onDevicePlace?.(pendingDeviceId, event.latlng)
        return
      }

      if (tool === 'draw'){
        setDraftPoints(prev => [...prev, event.latlng])
        return
      }

      if (tool === 'select'){
        onSelectZone?.(null)
      }
    },
    dblclick(){
      if (tool === 'draw' && draftPoints.length >= 3){
        onZoneComplete?.({ points: draftPoints.map(point => ({ lat: point.lat, lng: point.lng })) })
        setDraftPoints([])
      }
    },
    contextmenu(){
      if (tool === 'draw'){
        setDraftPoints([])
      }
    },
  })

  useEffect(() => {
    if (tool !== 'draw' && draftPoints.length){
      setDraftPoints([])
    }
  }, [tool, draftPoints, setDraftPoints])

  return null
}

function DeviceMarker({ device, pending, onDragEnd }){
  const icon = useMemo(() => {
    if (!device.position) return null
    return L.divIcon({
      className: `era-marker-wrapper leaflet-div-icon ${pending ? 'era-marker--pending' : ''}`,
      html: renderToStaticMarkup(<MarkerContent device={device} />),
      iconSize: [180, 92],
      iconAnchor: [90, 46],
    })
  }, [device, pending])

  if (!device.position) return null

  const position = [device.position.lat, device.position.lng]

  return (
    <Marker
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const next = event.target.getLatLng()
          onDragEnd?.(device.id, { lat: next.lat, lng: next.lng })
        },
      }}
    />
  )
}

function MarkerContent({ device }){
  const tone = statusTone(device.status)
  const color = toneColor(device.status)
  const nowPlaying = device.nowPlaying
  const playbackLabel = nowPlaying?.status === 'playing'
    ? 'В эфире'
    : nowPlaying?.status === 'paused'
      ? 'На паузе'
      : device.status === 'offline'
        ? 'Нет сигнала'
        : 'Готов'

  return (
    <div className="era-marker">
      <div className="era-marker__head">
        <span className={`era-marker__dot ${tone.dot}`} aria-hidden />
        <div>
          <span>{device.name}</span>
          <span className="era-marker__ip">{device.ip}</span>
        </div>
      </div>
      <div className="era-marker__track" style={{ color }}>
        <span className="era-marker__wave" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="truncate">
          {nowPlaying?.track || 'Нет воспроизведения'}
        </span>
      </div>
      <span className="era-marker__status">{playbackLabel}</span>
    </div>
  )
}

function computeBounds(devices, zones){
  const points = []
  devices.forEach(device => {
    if (device.position){
      points.push([device.position.lat, device.position.lng])
    }
  })
  zones.forEach(zone => {
    zone.points.forEach(point => {
      points.push([point.lat, point.lng])
    })
  })
  if (!points.length) return null
  return L.latLngBounds(points)
}
