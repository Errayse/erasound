import { clamp01, uid } from './utils'

const demoPlayerPresets = [
  {
    track: 'Morning Intro',
    playlist: 'Доброе утро',
    artist: 'EraSound Studio',
    progress: 0.28,
    length: 214,
    isPlaying: true,
  },
  {
    track: 'City Flow',
    playlist: 'Дневное настроение',
    artist: 'Loft Ensemble',
    progress: 0.61,
    length: 256,
    isPlaying: true,
  },
  {
    track: 'Sunset Layers',
    playlist: 'Вечерняя витрина',
    artist: 'Skyline Trio',
    progress: 0.17,
    length: 301,
    isPlaying: true,
  },
]

export function createEmptyPlayer(){
  return {
    id: uid(),
    track: null,
    playlist: null,
    artist: null,
    progress: 0,
    length: 240,
    isPlaying: false,
    listId: null,
    trackId: null,
  }
}

export function createDemoPlayer(index = 0){
  const preset = demoPlayerPresets[index % demoPlayerPresets.length]
  return { ...createEmptyPlayer(), ...preset }
}

export function normalizePlayer(entry, fallback, index){
  const base = { ...createEmptyPlayer(), ...(fallback || createDemoPlayer(index)) }
  if (entry && typeof entry === 'object'){
    if (entry.track) base.track = entry.track
    if (entry.title && !base.track) base.track = entry.title
    if (entry.playlist) base.playlist = entry.playlist
    if (entry.playlistName && !base.playlist) base.playlist = entry.playlistName
    if (entry.artist) base.artist = entry.artist
    if (entry.length) base.length = entry.length
    if (entry.listId) base.listId = entry.listId
    if (entry.playlistId && !base.listId) base.listId = entry.playlistId
    if (entry.trackId) base.trackId = entry.trackId
    if (entry.isPlaying != null) base.isPlaying = !!entry.isPlaying
    if (typeof entry.state === 'string'){
      base.isPlaying = entry.state === 'playing'
    }
    if (entry.position != null){
      const position = Math.max(0, Math.min(entry.position, entry.length || base.length || 0))
      base.progress = base.length ? clamp01(position / base.length) : 0
    }else if (entry.elapsed != null){
      const elapsed = Math.max(0, entry.elapsed)
      base.progress = base.length ? clamp01(elapsed / base.length) : clamp01(entry.progress ?? base.progress)
    }else if (entry.progress != null){
      base.progress = clamp01(entry.progress)
    }
  }
  return base
}
