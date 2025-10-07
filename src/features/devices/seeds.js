import { uid } from '../planner/utils'

const statusPool = ['online', 'offline', 'degraded', 'pending']

function randomFrom(array){
  return array[Math.floor(Math.random() * array.length)]
}

export function createDeviceSeeds(){
  const base = [
    {
      id: 'dev-1',
      name: 'Холл · Ресивер',
      ip: '192.168.0.21',
      model: 'Era Amp 2U',
      firmware: '1.2.4',
      status: 'online',
      signal: 92,
      bandwidth: 96,
      latency: 11,
      lastSeen: 'несколько секунд назад',
      discovered: true,
      credentials: { username: 'admin', password: '••••••••', stored: true },
      tags: ['Основная стойка'],
    },
    {
      id: 'dev-2',
      name: 'Кафе · Колонки',
      ip: '192.168.0.37',
      model: 'Era Stream Hub',
      firmware: '1.3.0-beta',
      status: 'degraded',
      signal: 68,
      bandwidth: 54,
      latency: 26,
      lastSeen: '1 минута назад',
      discovered: true,
      credentials: { username: 'audio', password: '', stored: false },
      tags: ['Группа B'],
    },
    {
      id: 'dev-3',
      name: 'Терраса · Усилитель',
      ip: '192.168.0.52',
      model: 'Era Outdoor Node',
      firmware: '1.1.9',
      status: 'offline',
      signal: 0,
      bandwidth: 0,
      latency: null,
      lastSeen: '32 минуты назад',
      discovered: true,
      credentials: { username: 'admin', password: '', stored: false },
      tags: ['Улица'],
    },
    {
      id: 'dev-4',
      name: 'Склад · Шлюз',
      ip: '192.168.0.88',
      model: 'Era IoT Bridge',
      firmware: '1.0.5',
      status: 'pending',
      signal: 41,
      bandwidth: 22,
      latency: 54,
      lastSeen: 'ожидает подтверждения',
      discovered: false,
      credentials: { username: '', password: '', stored: false },
      tags: ['Инвентаризация'],
    },
    {
      id: 'dev-5',
      name: 'Лобби · Колонка',
      ip: '192.168.0.15',
      model: 'Era Mini 4',
      firmware: '1.2.4',
      status: 'online',
      signal: 88,
      bandwidth: 71,
      latency: 18,
      lastSeen: '12 секунд назад',
      discovered: true,
      credentials: { username: 'audio', password: '••••', stored: true },
      tags: ['Лобби'],
    },
    {
      id: 'dev-6',
      name: 'Конференц · Матрица',
      ip: '192.168.0.61',
      model: 'Era Matrix 8×8',
      firmware: '2.0.1',
      status: 'online',
      signal: 76,
      bandwidth: 110,
      latency: 9,
      lastSeen: 'несколько секунд назад',
      discovered: false,
      credentials: { username: 'it', password: '', stored: false },
      tags: ['Конференции'],
    },
  ]

  return base.map((item, index) => ({
    ...item,
    id: item.id || `device-${index + 1}`,
    discoveredAt: item.discovered ? 'Автообнаружено' : 'Добавлено вручную',
    updatedAt: item.lastSeen,
    onboarding: item.status === 'pending',
  }))
}

export function fabricateNewDevice(){
  return {
    id: uid(),
    name: 'Новый узел',
    ip: '192.168.0.' + Math.floor(50 + Math.random() * 150),
    model: randomFrom(['Era Stream Hub', 'Era Amp 2U', 'Era Matrix 8×8']),
    firmware: '1.0.0',
    status: randomFrom(statusPool),
    signal: Math.floor(Math.random() * 90),
    bandwidth: Math.floor(20 + Math.random() * 90),
    latency: Math.floor(8 + Math.random() * 45),
    lastSeen: 'только что найдено',
    discovered: true,
    credentials: { username: '', password: '', stored: false },
    tags: ['Новый'],
    discoveredAt: 'Поиск сети',
    updatedAt: 'только что найдено',
    onboarding: true,
  }
}
