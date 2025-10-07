import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AddDeviceDropdown,
  CircleIconButton,
  DeviceDetailChip,
  OverviewTile,
  ScheduleBadge,
  SubsectionHeader,
  SummaryPill,
  ToggleChip,
  ZonePlayerFooter,
  panelClass,
} from './primitives'
import {
  IconBell,
  IconChevronDown,
  IconClock,
  IconDevice,
  IconDeviceSmall,
  IconEdit,
  IconMinus,
  IconOverview,
  IconPlaylist,
  IconPlaylistSmall,
  IconSchedule,
  IconTrash,
} from './icons'
import {
  clamp01,
  describeAnnouncement,
  formatDaysForDisplay,
  resolveAnnouncementTrackLabel,
  resolveDeviceStatus,
  transferKey,
} from '../../planner/utils'
import { createEmptyPlayer } from '../../planner/player'

function TabButton({ active, label, onClick, children }){
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${active ? 'bg-white/20 text-white shadow-glass' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
    >
      {children}
    </button>
  )
}

function summarizeTransfers({ zoneId, playlistId, devices, transfers }){
  if (!devices.length) {
    return { state: 'idle', progress: 0, total: 0, completed: 0 }
  }

  let progress = 0
  let completed = 0

  devices.forEach(dev => {
    const key = transferKey(zoneId, playlistId, dev.ip)
    const entry = transfers[key]
    if (entry?.status === 'success') {
      completed += 1
      progress += 100
    } else {
      const val = entry?.progress ?? 0
      progress += Math.max(0, Math.min(100, val))
    }
  })

  const avg = progress / devices.length
  if (completed === devices.length) {
    return { state: 'success', progress: 100, total: devices.length, completed }
  }

  return { state: 'progress', progress: Math.round(avg), total: devices.length, completed }
}

function TransferSummary({ snapshot }){
  if (snapshot.total === 0) {
    return (
      <div className="text-xs text-white/50">
        Добавьте устройство выше, чтобы выгрузить плейлист.
      </div>
    )
  }

  const barClass = snapshot.state === 'success' ? 'bg-emerald-400/80' : 'bg-sky-400/80'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{snapshot.completed}/{snapshot.total} устройств</span>
        <span className="text-white/70">{snapshot.state === 'success' ? 'Готово' : `${snapshot.progress}%`}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full ${barClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${snapshot.progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  )
}

export function ZoneCard({
  z,
  devices,
  lists,
  transfers,
  onToggleDevice,
  onRemoveDevice,
  onRename,
  onDelete,
  onUnassign,
  onDrop,
  onAddWindow,
  onEditWindow,
  onDeleteWindow,
  onToggleWindow,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onToggleAnnouncement,
  onPlayerAction,
}){
  const assigned = z.playlistIds.map(id => lists.find(l => l.id === id)).filter(Boolean)
  const selectedDevices = z.deviceIps.map(ip => devices.find(d => d.ip === ip) || { ip, name: ip })
  const availableDevices = devices.filter(d => !z.deviceIps.includes(d.ip))
  const playbackWindows = Array.isArray(z.playbackWindows) ? z.playbackWindows : []
  const announcements = Array.isArray(z.announcements) ? z.announcements : []

  const [over, setOver] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const zoneDeviceCount = selectedDevices.length
  const playlistCount = assigned.length
  const windowCount = playbackWindows.length
  const activeWindowCount = playbackWindows.filter(win => win.enabled).length
  const announcementCount = announcements.length
  const activeAnnouncements = announcements.filter(item => item.enabled).length

  const primaryAnnouncement = announcements.find(item => item.enabled) || announcements[0]
  const nextAnnouncementLabel = primaryAnnouncement
    ? describeAnnouncement(primaryAnnouncement)
    : 'Не запланировано'

  const player = z.player || createEmptyPlayer()
  const rawProgress = typeof player.progress === 'number'
    ? (player.progress > 1 ? player.progress / 100 : player.progress)
    : 0
  const normalizedProgress = clamp01(rawProgress)
  const progressPercent = Math.round(normalizedProgress * 100)
  const trackLength = typeof player.length === 'number' ? player.length : 0
  const elapsedSeconds = Math.round(normalizedProgress * trackLength)
  const detailsId = `zone-${z.id}-details`

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Основное', Icon: IconOverview },
    { id: 'devices', label: 'Устройства', Icon: IconDevice },
    { id: 'playlists', label: 'Плейлисты', Icon: IconPlaylist },
    { id: 'schedule', label: 'Расписание', Icon: IconSchedule },
  ], [])

  const highlight = activeTab === 'playlists' && over

  function handleDragOver(e){
    e.preventDefault()
    if (!over) setOver(true)
    if (!expanded) setExpanded(true)
    if (activeTab !== 'playlists') setActiveTab('playlists')
  }

  function handleDragLeave(){
    setOver(false)
  }

  function handleDrop(e){
    e.preventDefault()
    setOver(false)
    if (!expanded) setExpanded(true)
    onDrop(e)
  }

  const containerClass = `${panelClass} overflow-hidden transition-colors duration-200 ${highlight ? 'border-sky-400/60 bg-sky-500/10' : ''}`

  return (
    <motion.div
      layout
      className={containerClass}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
                aria-controls={detailsId}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <IconChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Зона</div>
                <div className="text-base font-semibold truncate">{z.name}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SummaryPill icon={<IconDeviceSmall className="h-4 w-4" aria-hidden="true" />} label="Устройства" value={zoneDeviceCount} />
            <SummaryPill icon={<IconPlaylistSmall className="h-4 w-4" aria-hidden="true" />} label="Плейлисты" value={playlistCount} />
          </div>
        </div>

        {expanded && (
          <div id={detailsId} className="space-y-4 border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => {
                const Icon = tab.Icon
                return (
                  <TabButton
                    key={tab.id}
                    active={activeTab === tab.id}
                    label={tab.label}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4" />
                  </TabButton>
                )
              })}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <OverviewTile
                    icon={<IconClock className="h-4 w-4" />}
                    title="Окна эфира"
                    value={`${activeWindowCount}/${windowCount || 0}`}
                    hint={windowCount ? 'активно' : 'нет окон'}
                  />
                  <OverviewTile
                    icon={<IconBell className="h-4 w-4" />}
                    title="Точечные включения"
                    value={`${activeAnnouncements}/${announcementCount || 0}`}
                    hint={nextAnnouncementLabel}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CircleIconButton icon={<IconEdit className="h-4 w-4" />} label="Переименовать зону" onClick={onRename} />
                  <CircleIconButton icon={<IconTrash className="h-4 w-4" />} label="Удалить зону" onClick={onDelete} tone="danger" />
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedDevices.map(dev => (
                    <DeviceDetailChip
                      key={dev.ip}
                      name={dev.name || dev.ip}
                      ip={dev.ip}
                      status={resolveDeviceStatus(dev)}
                      onRemove={() => onRemoveDevice?.(dev.ip)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <AddDeviceDropdown
                    available={availableDevices}
                    onSelect={ip => onToggleDevice?.(ip, true)}
                  />
                  <p className="text-xs text-white/40">
                    Добавьте приёмники, чтобы синхронизировать эфир в этой зоне.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'playlists' && (
              <div className={`space-y-3 rounded-xl border ${highlight ? 'border-sky-400/60 bg-sky-500/10' : 'border-white/10 bg-white/5'} p-3 transition-colors`}>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Назначенные плейлисты</span>
                  <span>{playlistCount || '0'} шт.</span>
                </div>
                {assigned.length > 0 ? (
                  <div className="space-y-2">
                    {assigned.map(pl => {
                      const totalTracks = Array.isArray(pl.tracks) ? pl.tracks.length : 0
                      const snapshot = summarizeTransfers({
                        zoneId: z.id,
                        playlistId: pl.id,
                        devices: selectedDevices,
                        transfers,
                      })
                      return (
                        <div key={pl.id} className="rounded-lg border border-white/10 bg-neutral-900/60 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{pl.name}</div>
                              <div className="text-xs text-white/50">{totalTracks} трек(ов)</div>
                            </div>
                            <CircleIconButton icon={<IconMinus className="h-4 w-4" />} label="Убрать плейлист" onClick={() => onUnassign?.(pl.id)} />
                          </div>
                          <TransferSummary snapshot={snapshot} />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-sm text-white/60">
                    Перетащите плейлист справа, чтобы запланировать эфир.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <SubsectionHeader
                  title="Временные окна"
                  subtitle={windowCount ? `${activeWindowCount} активны из ${windowCount}` : 'пока не создано'}
                  actionLabel="Добавить окно"
                  onAction={onAddWindow}
                />
                <div className="space-y-2">
                  {playbackWindows.map(window => (
                    <div key={window.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{window.label}</div>
                          <div className="text-xs text-white/50">{window.start} — {window.end}</div>
                        </div>
                        <ToggleChip active={window.enabled} onClick={() => onToggleWindow(window.id)} labelOn="On" labelOff="Off" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                        <ScheduleBadge>{formatDaysForDisplay(window.days)}</ScheduleBadge>
                        <div className="ml-auto flex gap-1">
                          <CircleIconButton icon={<IconEdit className="h-4 w-4" />} label="Редактировать окно" onClick={() => onEditWindow(window)} size="sm" variant="ghost" />
                          <CircleIconButton icon={<IconTrash className="h-4 w-4" />} label="Удалить окно" onClick={() => onDeleteWindow(window)} size="sm" variant="ghost" tone="danger" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {playbackWindows.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-sm text-white/60">
                      Добавьте временные окна, чтобы ограничить звучание по расписанию.
                    </div>
                  )}
                </div>

                <SubsectionHeader
                  title="Точечные включения"
                  subtitle={announcementCount ? nextAnnouncementLabel : 'пока не запланировано'}
                  actionLabel="Добавить включение"
                  onAction={onAddAnnouncement}
                />
                <div className="space-y-2">
                  {announcements.map(entry => (
                    <div key={entry.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{entry.title}</div>
                          <div className="text-xs text-white/50 truncate">{resolveAnnouncementTrackLabel(entry, lists)}</div>
                        </div>
                        <ToggleChip active={entry.enabled} onClick={() => onToggleAnnouncement(entry.id)} labelOn="On" labelOff="Off" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                        <ScheduleBadge>{describeAnnouncement(entry)}</ScheduleBadge>
                        {entry.repeat === 'weekly' && entry.days?.length > 0 && (
                          <ScheduleBadge>{formatDaysForDisplay(entry.days)}</ScheduleBadge>
                        )}
                        <div className="ml-auto flex gap-1">
                          <CircleIconButton icon={<IconEdit className="h-4 w-4" />} label="Редактировать включение" onClick={() => onEditAnnouncement(entry)} size="sm" variant="ghost" />
                          <CircleIconButton icon={<IconTrash className="h-4 w-4" />} label="Удалить включение" onClick={() => onDeleteAnnouncement(entry)} size="sm" variant="ghost" tone="danger" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-sm text-white/60">
                      Настройте объявления и джинглы для событий и напоминаний.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <ZonePlayerFooter
          player={player}
          progressPercent={progressPercent}
          elapsedSeconds={elapsedSeconds}
          trackLength={trackLength}
          onPlayerAction={onPlayerAction}
        />
      </div>
    </motion.div>
  )
}

export default ZoneCard
