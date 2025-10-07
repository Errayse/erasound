import { uid } from '../planner/utils'

export const CANVAS_SIZE = { width: 1200, height: 720 }

export function createMapDevices(){
  return [
    {
      id: 'dev-map-1',
      name: 'Холл · Ресивер',
      ip: '192.168.0.21',
      status: 'online',
      zone: 'Холл',
      accent: 'emerald',
      position: { x: 0.32, y: 0.28 },
    },
    {
      id: 'dev-map-2',
      name: 'Кафе · Колонки',
      ip: '192.168.0.37',
      status: 'online',
      zone: 'Кафе',
      accent: 'sky',
      position: { x: 0.58, y: 0.46 },
    },
    {
      id: 'dev-map-3',
      name: 'Терраса · Усилитель',
      ip: '192.168.0.52',
      status: 'degraded',
      zone: 'Терраса',
      accent: 'amber',
      position: { x: 0.78, y: 0.22 },
    },
    {
      id: 'dev-map-4',
      name: 'Склад · Шлюз',
      ip: '192.168.0.88',
      status: 'offline',
      zone: null,
      accent: 'rose',
      position: null,
    },
    {
      id: 'dev-map-5',
      name: 'Лобби · Колонка',
      ip: '192.168.0.15',
      status: 'online',
      zone: 'Лобби',
      accent: 'violet',
      position: { x: 0.24, y: 0.58 },
    },
  ]
}

export function createDefaultZones(){
  return [
    {
      id: 'zone-1',
      name: 'Холл',
      color: '#0ea5e9',
      stroke: 'rgba(14,165,233,0.35)',
      fill: 'rgba(14,165,233,0.20)',
      points: [
        { x: 0.18, y: 0.18 },
        { x: 0.45, y: 0.16 },
        { x: 0.48, y: 0.32 },
        { x: 0.22, y: 0.34 },
      ],
    },
    {
      id: 'zone-2',
      name: 'Кафе',
      color: '#22c55e',
      stroke: 'rgba(34,197,94,0.35)',
      fill: 'rgba(34,197,94,0.18)',
      points: [
        { x: 0.50, y: 0.40 },
        { x: 0.70, y: 0.38 },
        { x: 0.74, y: 0.58 },
        { x: 0.54, y: 0.60 },
      ],
    },
    {
      id: 'zone-3',
      name: 'Терраса',
      color: '#f97316',
      stroke: 'rgba(249,115,22,0.35)',
      fill: 'rgba(249,115,22,0.16)',
      points: [
        { x: 0.72, y: 0.12 },
        { x: 0.92, y: 0.10 },
        { x: 0.92, y: 0.28 },
        { x: 0.70, y: 0.32 },
      ],
    },
  ]
}

export function createZoneDraft(color){
  return {
    id: uid(),
    name: '',
    color,
    stroke: color,
    fill: color,
    points: [],
  }
}

export const palette = {
  emerald: '#34d399',
  sky: '#38bdf8',
  amber: '#fbbf24',
  rose: '#fb7185',
  violet: '#a855f7',
}
