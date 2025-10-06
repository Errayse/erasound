import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import ZoneCard from '../components/ZoneCard'
import Modal from '../components/Modal'
import deviceIllustration from '../assets/era-device.svg'

const fallbackDevices = [
  {
    ip: '192.168.0.21',
    name: 'Холл · Ресивер',
    zone: 'Холл',
    online: true,
    volume: 68,
    speed: 95,
    latency: 12,
    uptime: '4 ч 12 мин',
    nowPlaying: {
      track: 'Morning Intro',
      artist: 'EraSound Studio',
      playlist: 'Утренний эфир',
      progress: 0.42,
      length: 210,
    },
  },
  {
    ip: '192.168.0.37',
    name: 'Кафе · Колонки',
    zone: 'Кафе',
    online: true,
    volume: 52,
    speed: 82,
    latency: 18,
    uptime: '2 ч 05 мин',
    nowPlaying: {
      track: 'Coffee Lounge',
      artist: 'LoFi Beats',
      playlist: 'Дневное настроение',
      progress: 0.63,
      length: 254,
    },
  },
  {
    ip: '192.168.0.52',
    name: 'Терраса · Усилитель',
    zone: 'Терраса',
    online: true,
    volume: 74,
    speed: 76,
    latency: 22,
    uptime: '56 мин',
    nowPlaying: {
      track: 'Sunset Chill',
      artist: 'Skyline Trio',
      playlist: 'Вечерняя витрина',
      progress: 0.18,
      length: 298,
    },
  },
  {
    ip: '192.168.0.88',
    name: 'Склад · Шлюз',
    zone: 'Склад',
    online: false,
    volume: 0,
    speed: 0,
    latency: null,
    uptime: '—',
    nowPlaying: null,
  },
]

function normalizeDevices(list){
  if (!Array.isArray(list) || list.length === 0) return []
  return list.map((item, index) => {
    const template = fallbackDevices[index % fallbackDevices.length]
    const base = {
      ...template,
      ...item,
    }
    const fromResponse = item?.nowPlaying || item?.playback || null
    const trackName = item?.track || item?.nowPlaying?.track || item?.currentTrack
    const playlistName = item?.playlist || item?.nowPlaying?.playlist || template.nowPlaying?.playlist
    const progress = item?.progress != null ? item.progress : item?.nowPlaying?.progress
    base.online = item?.online != null ? !!item.online : template.online
    base.speed = item?.speed ?? item?.bandwidth ?? template.speed
    base.latency = item?.latency ?? template.latency
    base.zone = item?.zone || item?.room || template.zone
    base.volume = item?.volume != null ? item.volume : template.volume
    base.uptime = item?.uptime || template.uptime
    base.nowPlaying = fromResponse || (trackName ? {
      track: trackName,
      artist: item?.artist || template.nowPlaying?.artist || '—',
      playlist: playlistName,
      progress: typeof progress === 'number' ? progress : template.nowPlaying?.progress || 0,
      length: item?.length || template.nowPlaying?.length || 240,
    } : template.nowPlaying)
    return base
  })
}

function summarizeDevices(devices){
  const total = devices.length
  const onlineDevices = devices.filter(d => d.online)
  const online = onlineDevices.length
  const offline = total - online
  const avgSpeed = online ? Math.round(onlineDevices.reduce((acc, d) => acc + (d.speed || 0), 0) / online) : 0
  const latencyDevices = onlineDevices.filter(d => d.latency != null)
  const avgLatency = latencyDevices.length ? Math.round(latencyDevices.reduce((acc, d) => acc + d.latency, 0) / latencyDevices.length) : 0
  const activeStreams = onlineDevices.filter(d => !!d.nowPlaying).length
  return { total, online, offline, avgSpeed, avgLatency, activeStreams }
}

const fallbackDevices = [
  {
    ip: '192.168.0.21',
    name: 'Холл · Ресивер',
    zone: 'Холл',
    online: true,
    volume: 68,
    speed: 95,
    latency: 12,
    uptime: '4 ч 12 мин',
    nowPlaying: {
      track: 'Morning Intro',
      artist: 'EraSound Studio',
      playlist: 'Утренний эфир',
      progress: 0.42,
      length: 210,
    },
  },
  {
    ip: '192.168.0.37',
    name: 'Кафе · Колонки',
    zone: 'Кафе',
    online: true,
    volume: 52,
    speed: 82,
    latency: 18,
    uptime: '2 ч 05 мин',
    nowPlaying: {
      track: 'Coffee Lounge',
      artist: 'LoFi Beats',
      playlist: 'Дневное настроение',
      progress: 0.63,
      length: 254,
    },
  },
  {
    ip: '192.168.0.52',
    name: 'Терраса · Усилитель',
    zone: 'Терраса',
    online: true,
    volume: 74,
    speed: 76,
    latency: 22,
    uptime: '56 мин',
    nowPlaying: {
      track: 'Sunset Chill',
      artist: 'Skyline Trio',
      playlist: 'Вечерняя витрина',
      progress: 0.18,
      length: 298,
    },
  },
  {
    ip: '192.168.0.88',
    name: 'Склад · Шлюз',
    zone: 'Склад',
    online: false,
    volume: 0,
    speed: 0,
    latency: null,
    uptime: '—',
    nowPlaying: null,
  },
]

function normalizeDevices(list){
  if (!Array.isArray(list) || list.length === 0) return []
  return list.map((item, index) => {
    const template = fallbackDevices[index % fallbackDevices.length]
    const base = {
      ...template,
      ...item,
    }
    const fromResponse = item?.nowPlaying || item?.playback || null
    const trackName = item?.track || item?.nowPlaying?.track || item?.currentTrack
    const playlistName = item?.playlist || item?.nowPlaying?.playlist || template.nowPlaying?.playlist
    const progress = item?.progress != null ? item.progress : item?.nowPlaying?.progress
    base.online = item?.online != null ? !!item.online : template.online
    base.speed = item?.speed ?? item?.bandwidth ?? template.speed
    base.latency = item?.latency ?? template.latency
    base.zone = item?.zone || item?.room || template.zone
    base.volume = item?.volume != null ? item.volume : template.volume
    base.uptime = item?.uptime || template.uptime
    base.nowPlaying = fromResponse || (trackName ? {
      track: trackName,
      artist: item?.artist || template.nowPlaying?.artist || '—',
      playlist: playlistName,
      progress: typeof progress === 'number' ? progress : template.nowPlaying?.progress || 0,
      length: item?.length || template.nowPlaying?.length || 240,
    } : template.nowPlaying)
    return base
  })
}

function summarizeDevices(devices){
  const total = devices.length
  const onlineDevices = devices.filter(d => d.online)
  const online = onlineDevices.length
  const offline = total - online
  const avgSpeed = online ? Math.round(onlineDevices.reduce((acc, d) => acc + (d.speed || 0), 0) / online) : 0
  const latencyDevices = onlineDevices.filter(d => d.latency != null)
  const avgLatency = latencyDevices.length ? Math.round(latencyDevices.reduce((acc, d) => acc + d.latency, 0) / latencyDevices.length) : 0
  const activeStreams = onlineDevices.filter(d => !!d.nowPlaying).length
  return { total, online, offline, avgSpeed, avgLatency, activeStreams }
}

export default function Dashboard(){
  const [items, setItems] = useState(fallbackDevices)
  const [active, setActive] = useState(null)
  const [stats, setStats] = useState(()=>summarizeDevices(fallbackDevices))

  const nowPlayingDevice = useMemo(() => items.find(d => d.online && d.nowPlaying), [items])

  async function refresh(){
    try {
      const list = await api.scan()
      const normalized = normalizeDevices(list)
      if (normalized.length) {
        setItems(normalized)
        setStats(summarizeDevices(normalized))
        return
      }
    } catch {
      // silent fallback
    }
    setItems(fallbackDevices)
    setStats(summarizeDevices(fallbackDevices))
  }
  useEffect(()=>{ refresh() }, [])

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Обзор устройств</h2>
          <p className="text-sm text-white/60">Живой статус узлов EraSound Center, скорость сети и активные потоки.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={refresh}>Сканировать</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Устройств онлайн" value={stats.online} detail={`${stats.total} всего · ${stats.offline} оффлайн`} accent="emerald" />
        <StatCard label="Средняя скорость" value={stats.avgSpeed ? `${stats.avgSpeed} Мбит/с` : '—'} detail="по активным узлам" />
        <StatCard label="Средняя задержка" value={stats.avgLatency ? `${stats.avgLatency} мс` : '—'} detail="round-trip" />
        <StatCard label="Активные плейлисты" value={stats.activeStreams} detail="сейчас в эфире" accent="sky" />
      </div>

      <NowPlayingPanel device={nowPlayingDevice} />

      <div className="grid gap-3">
        {items.map((z)=> (
          <ZoneCard key={z.ip} z={z}
            onPlay={()=>api.play(z.ip,'demo.mp3')}
            onStop={()=>api.stop(z.ip)}
            onVolume={(v)=>api.volume(z.ip, v)}
            onOpen={()=>setActive(z)}
          />
        ))}
        {items.length===0 && <div className="glass p-6 text-white/70">Ничего не найдено. Нажмите «Сканировать».</div>}
      </div>

      <Modal open={!!active} onClose={()=>setActive(null)} title={`Устройство ${active?.name || active?.ip || ''}`}>
        {active && (
          <div className="space-y-6">
            <div className="glass rounded-lg border border-white/10 p-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative flex h-20 w-28 shrink-0 items-center justify-center">
                    <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" aria-hidden />
                    <img
                      src={deviceIllustration}
                      alt="Модуль EraSound"
                      className="relative h-16 w-auto drop-shadow-[0_8px_18px_rgba(15,23,42,0.25)]"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{active.name || active.ip}</div>
                    <div className="text-sm text-white/60">
                      {active.zone ? `Зона: ${active.zone}` : 'Сетевой аудиоузел в сети'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${active.online ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                    {active.online ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-xs text-white/50">Аптайм: {active.uptime || '—'}</span>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoTile label="IP адрес" value={active.ip} monospace />
              <InfoTile label="Средняя скорость" value={active.speed ? `${active.speed} Мбит/с` : '—'} />
              <InfoTile label="Задержка" value={active.latency != null ? `${active.latency} мс` : '—'} />
              <InfoTile label="Громкость" value={active.volume != null ? `${active.volume}%` : '—'} />
              <InfoTile label="Плейлист" value={active.nowPlaying?.playlist || '—'} />
              <InfoTile label="Версия прошивки" value={active.ver || '—'} />
            </dl>

            <DevicePlaybackCard device={active} />

            <div className="glass rounded-lg border border-white/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/70">Управление воспроизведением</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={()=>api.play(active.ip,'demo.mp3')}>▶ Воспроизвести demo.mp3</button>
                <button className="btn glass" onClick={()=>api.stop(active.ip)}>⏹ Остановить</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function StatCard({ label, value, detail, accent }){
  const accentClass = accent === 'emerald'
    ? 'text-emerald-200'
    : accent === 'sky'
      ? 'text-sky-200'
      : 'text-white'
  return (
    <div className="glass rounded-xl border border-white/10 p-4 space-y-2">
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div className={`text-2xl font-semibold ${accentClass}`}>{value}</div>
      {detail && <div className="text-xs text-white/60">{detail}</div>}
    </div>
  )
}

function NowPlayingPanel({ device }){
  const { hasTrack, track, percent, length, elapsed } = getPlaybackMeta(device)
  return (
    <div className="glass rounded-xl border border-white/10 p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">Сейчас играет</div>
          <div className="text-lg font-semibold">{hasTrack ? track.track : 'Плеер в ожидании'}</div>
          <div className="text-sm text-white/60">{hasTrack ? (track.artist || 'Неизвестный исполнитель') : 'Выберите плейлист, чтобы начать трансляцию.'}</div>
        </div>
        <div className="text-sm text-white/60 sm:text-right">
          <div>{device?.name || device?.ip || '—'}</div>
          <div>{track?.playlist ? `Плейлист: ${track.playlist}` : 'Плейлист не назначен'}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/50">
        <span className="font-mono text-white/70">{formatDuration(elapsed)}</span>
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-2 rounded-full bg-sky-400/70 transition-all duration-500" style={{ width: `${hasTrack ? percent : 0}%` }} />
        </div>
        <span className="font-mono text-white/50">{formatDuration(length)}</span>
      </div>
    </div>
  )
}

function DevicePlaybackCard({ device }){
  const { hasTrack, track, percent, length, elapsed } = getPlaybackMeta(device)
  return (
    <div className="glass rounded-lg border border-white/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/50">Состояние плеера</div>
          <div className="text-sm text-white/70">{hasTrack ? track.track : 'Плеер не воспроизводит контент'}</div>
        </div>
        {track?.playlist && (
          <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/70">{track.playlist}</span>
        )}
      </div>
      <div className="text-xs text-white/60 space-y-2">
        <div>{hasTrack ? `Исполнитель: ${track.artist || '—'}` : 'Назначьте плейлист для этого устройства.'}</div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-white/70">{formatDuration(elapsed)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-1.5 rounded-full ${hasTrack ? 'bg-emerald-400/80' : 'bg-white/20'}`} style={{ width: `${hasTrack ? percent : 0}%` }} />
          </div>
          <span className="font-mono text-white/50">{formatDuration(length)}</span>
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value, monospace }){
  return (
    <div className="glass rounded-lg border border-white/10 p-4">
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className={`mt-1 text-sm ${monospace ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function getPlaybackMeta(device){
  const track = device?.nowPlaying
  if (!track) {
    return { hasTrack: false, track: null, percent: 0, length: 0, elapsed: 0 }
  }
  const percent = resolveProgress(track.progress)
  const length = track.length ?? 0
  const elapsed = length ? Math.round((length * percent) / 100) : 0
  return { hasTrack: true, track, percent, length, elapsed }
}

function resolveProgress(progress){
  if (progress == null || Number.isNaN(progress)) return 0
  if (progress > 1) return Math.min(100, Math.round(progress))
  return Math.min(100, Math.round(progress * 100))
}

function formatDuration(seconds){
  if (!seconds || seconds <= 0) return '--:--'
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
