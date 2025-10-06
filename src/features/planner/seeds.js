import { DAY_GROUPS } from './constants'
import { uid } from './utils'
import { createDemoPlayer } from './player'

export const scheduleFallbackDevices = [
  { ip: '192.168.0.21', name: 'Холл · Ресивер', status: 'online' },
  { ip: '192.168.0.37', name: 'Кафе · Колонки', status: 'degraded' },
  { ip: '192.168.0.52', name: 'Терраса · Усилитель', status: 'offline' },
]

export function createDefaultWindow(){
  return {
    id: uid(),
    label: 'Ежедневный эфир',
    start: '08:00',
    end: '20:00',
    days: DAY_GROUPS.all,
    enabled: true,
  }
}

export function createDefaultAnnouncement(){
  return {
    id: uid(),
    title: 'Анонс события',
    repeat: 'daily',
    time: '12:00',
    days: DAY_GROUPS.all,
    track: { type: 'custom', name: 'Announcement.mp3' },
    offsetMinutes: 0,
    enabled: true,
  }
}

export function createDemoPlaylists(){
  return [
    {
      id: uid(),
      name: 'Утренний эфир',
      tracks: [
        { id: uid(), name: 'Opening Intro.mp3' },
        { id: uid(), name: 'Morning Jazz Loop.wav' },
        { id: uid(), name: 'Daily Announcements.mp3' },
      ],
    },
    {
      id: uid(),
      name: 'Дневное настроение',
      tracks: [
        { id: uid(), name: 'Chill Lounge 01.mp3' },
        { id: uid(), name: 'Citywalk Groove.mp3' },
        { id: uid(), name: 'Acoustic Breeze.flac' },
      ],
    },
    {
      id: uid(),
      name: 'Вечерняя витрина',
      tracks: [
        { id: uid(), name: 'Ambient Bloom.mp3' },
        { id: uid(), name: 'Night Lights.wav' },
      ],
    },
  ]
}

export function createDefaultZones(){
  return [
    {
      id: 'z1',
      name: 'Холл',
      deviceIps: ['192.168.0.21'],
      playlistIds: [],
      playbackWindows: [
        {
          id: uid(),
          label: 'Утренний поток',
          start: '08:00',
          end: '11:30',
          days: DAY_GROUPS.weekdays,
          enabled: true,
        },
        {
          id: uid(),
          label: 'Вечерний поток',
          start: '16:00',
          end: '22:00',
          days: DAY_GROUPS.all,
          enabled: true,
        },
      ],
      announcements: [
        {
          id: uid(),
          title: 'Приветствие',
          repeat: 'daily',
          time: '09:00',
          days: DAY_GROUPS.all,
          track: { type: 'custom', name: 'Welcome chime.mp3' },
          offsetMinutes: 0,
          enabled: true,
        },
      ],
      player: createDemoPlayer(0),
    },
    {
      id: 'z2',
      name: 'Кафе',
      deviceIps: ['192.168.0.37'],
      playlistIds: [],
      playbackWindows: [
        {
          id: uid(),
          label: 'Основной поток',
          start: '08:00',
          end: '22:00',
          days: DAY_GROUPS.all,
          enabled: true,
        },
      ],
      announcements: [
        {
          id: uid(),
          title: 'Меню дня',
          repeat: 'daily',
          time: '12:00',
          days: DAY_GROUPS.all,
          track: { type: 'custom', name: 'Chef special.mp3' },
          offsetMinutes: 0,
          enabled: true,
        },
        {
          id: uid(),
          title: 'Счастливый час',
          repeat: 'hourly',
          time: '17:00',
          days: DAY_GROUPS.weekdays,
          track: { type: 'custom', name: 'Promo sweep.wav' },
          offsetMinutes: 15,
          enabled: true,
        },
      ],
      player: createDemoPlayer(1),
    },
    {
      id: 'z3',
      name: 'Терраса',
      deviceIps: ['192.168.0.52'],
      playlistIds: [],
      playbackWindows: [
        {
          id: uid(),
          label: 'Выходные вечера',
          start: '16:00',
          end: '23:30',
          days: DAY_GROUPS.weekend,
          enabled: true,
        },
      ],
      announcements: [
        {
          id: uid(),
          title: 'Анонс DJ-сета',
          repeat: 'weekly',
          time: '18:30',
          days: ['fri', 'sat'],
          track: { type: 'custom', name: 'DJ tonight.mp3' },
          offsetMinutes: 0,
          enabled: true,
        },
      ],
      player: createDemoPlayer(2),
    },
  ]
}
