import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CANVAS_SIZE } from '../seeds'
import { canvasPointFromRelative, relativePointFromCanvas, lighten, statusTone } from '../utils'
import deviceIllustration from '../../../assets/era-device.svg'

const MIN_DISTANCE = 6

export default function InteractiveMap({
  devices,
  zones,
  tool,
  zoom,
  activeZone,
  pendingDeviceId,
  onDevicePositionChange,
  onDevicePlace,
  onZoneComplete,
  onSelectZone,
}){
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(null)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const point = {
        x: (event.clientX - rect.left) / zoom,
        y: (event.clientY - rect.top) / zoom,
      }
      if (dragging){
        const nextPoint = {
          x: point.x - dragging.offset.x,
          y: point.y - dragging.offset.y,
        }
        const relative = relativePointFromCanvas(nextPoint, CANVAS_SIZE)
        onDevicePositionChange?.(dragging.id, relative)
      } else if (draft?.active){
        setDraft(prev => {
          if (!prev) return prev
          const last = prev.points[prev.points.length - 1]
          if (!last || distanceBetween(last, point) > MIN_DISTANCE){
            return { ...prev, points: [...prev.points, point] }
          }
          return prev
        })
      }
    }

    const handlePointerUp = () => {
      if (dragging){
        setDragging(null)
      }
      if (draft?.active){
        finalizeDraft()
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, draft, zoom, onDevicePositionChange])

  function distanceBetween(a, b){
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  function finalizeDraft(){
    setDraft(prev => {
      if (!prev || prev.points.length < 3) return null
      const relPoints = prev.points.map(pt => relativePointFromCanvas(pt, CANVAS_SIZE))
      onZoneComplete?.({ points: relPoints })
      return null
    })
  }

  function handleCanvasPointerDown(event){
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const point = {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom,
    }

    if (tool === 'draw'){
      setDraft({ active: true, points: [point] })
      event.preventDefault()
      return
    }

    if (tool === 'drop' && pendingDeviceId){
      onDevicePlace?.(pendingDeviceId, relativePointFromCanvas(point, CANVAS_SIZE))
      return
    }

    if (tool === 'select'){
      onSelectZone?.(null)
    }
  }

  function handleDevicePointerDown(event, device){
    event.stopPropagation()
    const canvasPoint = canvasPointFromRelative(device.position || { x: 0.5, y: 0.5 }, CANVAS_SIZE)
    setDragging({
      id: device.id,
      offset: {
        x: (event.clientX - containerRef.current.getBoundingClientRect().left) / zoom - canvasPoint.x,
        y: (event.clientY - containerRef.current.getBoundingClientRect().top) / zoom - canvasPoint.y,
      },
    })
  }

  function renderZone(zone){
    const path = zone.points
      .map(point => {
        const p = canvasPointFromRelative(point, CANVAS_SIZE)
        return `${p.x},${p.y}`
      })
      .join(' ')
    const isActive = activeZone === zone.id
    return (
      <g key={zone.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelectZone?.(zone.id) }}>
        <polygon
          points={path}
          fill={lighten(zone.color, isActive ? 0.25 : 0.18)}
          stroke={lighten(zone.color, 0.45)}
          strokeWidth={isActive ? 3 : 2}
        />
        <text
          x={average(zone.points.map(p => canvasPointFromRelative(p, CANVAS_SIZE).x))}
          y={average(zone.points.map(p => canvasPointFromRelative(p, CANVAS_SIZE).y))}
          textAnchor="middle"
          className="fill-white text-xs font-medium"
        >
          {zone.name}
        </text>
      </g>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[5/3] w-full overflow-hidden rounded-3xl border border-white/5 bg-neutral-950/70"
      onPointerDown={handleCanvasPointerDown}
    >
      <motion.div
        className="absolute inset-0"
        style={{ width: CANVAS_SIZE.width, height: CANVAS_SIZE.height, transform: `scale(${zoom})`, transformOrigin: '0 0' }}
      >
        <svg
          viewBox={`0 0 ${CANVAS_SIZE.width} ${CANVAS_SIZE.height}`}
          className="h-full w-full"
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="rgba(255,255,255,0.02)" />
          {zones.map(renderZone)}
          {draft?.points?.length > 1 && (
            <polyline
              points={draft.points.map(pt => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="rgba(56,189,248,0.6)"
              strokeWidth={2}
              strokeDasharray="8 8"
            />
          )}
        </svg>

        {devices.map(device => {
          if (!device.position) return null
          const point = canvasPointFromRelative(device.position, CANVAS_SIZE)
          const tone = statusTone(device.status)
          const selected = pendingDeviceId === device.id
          return (
            <motion.button
              key={device.id}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-left shadow-lg backdrop-blur transition ${tone.border} ${selected ? 'border-emerald-400/60 bg-emerald-400/10' : 'bg-white/10'}`}
              style={{ left: point.x, top: point.y }}
              onPointerDown={(event) => handleDevicePointerDown(event, device)}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                  <img src={deviceIllustration} alt="Узел EraSound" className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{device.name}</p>
                  <p className="text-[10px] text-white/60">{device.ip}</p>
                </div>
              </div>
              <span className={`absolute -top-2 right-3 h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden />
            </motion.button>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {pendingDeviceId && tool === 'drop' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute inset-x-0 bottom-4 mx-auto w-max rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100"
          >
            Выберите точку на плане, чтобы разместить устройство.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function average(values){
  if (!values.length) return 0
  return values.reduce((acc, value) => acc + value, 0) / values.length
}
