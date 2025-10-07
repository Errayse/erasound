import { uid } from '../planner/utils'

export const MAP_CENTER = { lat: 55.7522, lng: 37.6156 }

export const ZONE_NAME_SUGGESTIONS = ['Холл', 'Кафе', 'Терраса', 'Лобби', 'Конференц-зал']

export function createMapDevices(){
  return [
    {
      id: 'dev-map-1',
      name: 'Холл · Ресивер',
      ip: '192.168.0.21',
      status: 'online',
      zone: 'Холл',
      accent: 'emerald',
      position: { lat: 55.7529, lng: 37.615 },
      nowPlaying: { track: 'Morning Jazz Loop', status: 'playing' },
    },
    {
      id: 'dev-map-2',
      name: 'Кафе · Колонки',
      ip: '192.168.0.37',
      status: 'online',
      zone: 'Кафе',
      accent: 'sky',
      position: { lat: 55.7523, lng: 37.6175 },
      nowPlaying: { track: 'Citywalk Groove', status: 'playing' },
    },
    {
      id: 'dev-map-3',
      name: 'Терраса · Усилитель',
      ip: '192.168.0.52',
      status: 'degraded',
      zone: 'Терраса',
      accent: 'amber',
      position: { lat: 55.7536, lng: 37.6184 },
      nowPlaying: { track: 'Ambient Breeze', status: 'playing' },
    },
    {
      id: 'dev-map-4',
      name: 'Склад · Шлюз',
      ip: '192.168.0.88',
      status: 'offline',
      zone: null,
      accent: 'rose',
      position: null,
      nowPlaying: null,
    },
    {
      id: 'dev-map-5',
      name: 'Лобби · Колонка',
      ip: '192.168.0.15',
      status: 'online',
      zone: 'Лобби',
      accent: 'violet',
      position: { lat: 55.7516, lng: 37.6142 },
      nowPlaying: { track: 'Welcome Chime', status: 'paused' },
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
        { lat: 55.7533, lng: 37.6141 },
        { lat: 55.7535, lng: 37.6161 },
        { lat: 55.7526, lng: 37.6164 },
        { lat: 55.7525, lng: 37.6146 },
      ],
    },
    {
      id: 'zone-2',
      name: 'Кафе',
      color: '#22c55e',
      stroke: 'rgba(34,197,94,0.35)',
      fill: 'rgba(34,197,94,0.18)',
      points: [
        { lat: 55.7524, lng: 37.617 },
        { lat: 55.7521, lng: 37.6181 },
        { lat: 55.7519, lng: 37.6168 },
        { lat: 55.7522, lng: 37.6159 },
      ],
    },
    {
      id: 'zone-3',
      name: 'Терраса',
      color: '#f97316',
      stroke: 'rgba(249,115,22,0.35)',
      fill: 'rgba(249,115,22,0.16)',
      points: [
        { lat: 55.7537, lng: 37.618 },
        { lat: 55.7539, lng: 37.6194 },
        { lat: 55.7531, lng: 37.6196 },
        { lat: 55.753, lng: 37.6182 },
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
