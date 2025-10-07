import React from 'react'
import Modal from '../../../components/Modal'
import { DAY_GROUPS, WEEK_DAYS } from '../../planner/constants'

export default function PlannerDialog({
  dialog,
  dialogTitle,
  dialogValue,
  dialogData,
  dialogError,
  onClose,
  onSubmit,
  onWindowSubmit,
  onAnnouncementSubmit,
  setDialogValue,
  setDialogData,
  setDialogError,
  toggleDialogDay,
  setDialogDays,
  allTracks,
  activeZone,
  activeList,
  activeWindow,
  activeAnnouncement,
}){
  const open = Boolean(dialog.mode)

  function handleValueChange(event){
    setDialogValue(event.target.value)
    setDialogError('')
  }

  function handleDataChange(patcher){
    setDialogData(data => {
      const next = typeof patcher === 'function' ? patcher(data) : patcher
      return next
    })
    setDialogError('')
  }

  return (
    <Modal open={open} onClose={onClose} title={dialogTitle}>
      {dialog.mode && (
        <div className="space-y-4">
          {['createZone', 'renameZone', 'createList', 'renameList'].includes(dialog.mode) && (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-white/70 block">
                  {dialog.mode.includes('Zone') ? 'Название зоны' : 'Название плейлиста'}
                </label>
                <input
                  autoFocus
                  className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                  placeholder={dialog.mode.includes('Zone') ? 'Например, Лобби' : 'Например, Фоновая музыка'}
                  value={dialogValue}
                  onChange={handleValueChange}
                />
                {dialogError && <div className="text-xs text-rose-300">{dialogError}</div>}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn glass" onClick={onClose}>Отмена</button>
                <button type="submit" className="btn">Сохранить</button>
              </div>
            </form>
          )}

          {['addWindow', 'editWindow'].includes(dialog.mode) && dialogData && (
            <form className="space-y-4" onSubmit={onWindowSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-white/70 block">Название окна</label>
                <input
                  className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                  value={dialogData.label || ''}
                  onChange={(event) => handleDataChange(data => data ? { ...data, label: event.target.value } : data)}
                  placeholder="Например, Утренний поток"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Начало</label>
                  <input
                    type="time"
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.start || ''}
                    onChange={(event) => handleDataChange(data => data ? { ...data, start: event.target.value } : data)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Окончание</label>
                  <input
                    type="time"
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.end || ''}
                    onChange={(event) => handleDataChange(data => data ? { ...data, end: event.target.value } : data)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-white/70">Дни недели</div>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map(day => {
                    const checked = dialogData.days?.includes(day.value)
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => toggleDialogDay(day.value)}
                        className={`rounded-full px-3 py-1 text-xs transition-colors border ${checked ? 'border-sky-400/70 bg-sky-400/10 text-sky-100' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-3 text-xs text-white/50">
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => setDialogDays(DAY_GROUPS.all)}>Все</button>
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => setDialogDays(DAY_GROUPS.weekdays)}>Будни</button>
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => setDialogDays(DAY_GROUPS.weekend)}>Выходные</button>
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => setDialogDays([])}>Очистить</button>
                </div>
              </div>
              {dialogError && <div className="text-xs text-rose-300">{dialogError}</div>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn glass" onClick={onClose}>Отмена</button>
                <button type="submit" className="btn">{dialog.mode === 'addWindow' ? 'Добавить' : 'Сохранить'}</button>
              </div>
            </form>
          )}

          {['addAnnouncement', 'editAnnouncement'].includes(dialog.mode) && dialogData && (
            <form className="space-y-4" onSubmit={onAnnouncementSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-white/70 block">Заголовок объявления</label>
                <input
                  className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                  value={dialogData.title || ''}
                  onChange={(event) => handleDataChange(data => data ? { ...data, title: event.target.value } : data)}
                  placeholder="Например, Анонс мероприятия"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Повторение</label>
                  <select
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.repeat || 'daily'}
                    onChange={(event) => handleDataChange(data => data ? { ...data, repeat: event.target.value } : data)}
                  >
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Раз в неделю</option>
                    <option value="hourly">Каждый час</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Время</label>
                  <input
                    type="time"
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.time || ''}
                    onChange={(event) => handleDataChange(data => data ? { ...data, time: event.target.value } : data)}
                    disabled={dialogData.repeat === 'hourly'}
                  />
                </div>
              </div>

              {dialogData.repeat === 'hourly' && (
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">Минута внутри часа</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                    value={dialogData.offsetMinutes ?? 0}
                    onChange={(event) => handleDataChange(data => data ? { ...data, offsetMinutes: event.target.value } : data)}
                  />
                </div>
              )}

              {dialogData.repeat === 'weekly' && (
                <div className="space-y-2">
                  <div className="text-sm text-white/70">Дни недели</div>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map(day => {
                      const checked = dialogData.days?.includes(day.value)
                      return (
                        <button
                          type="button"
                          key={day.value}
                          onClick={() => toggleDialogDay(day.value)}
                          className={`rounded-full px-3 py-1 text-xs transition-colors border ${checked ? 'border-sky-400/70 bg-sky-400/10 text-sky-100' : 'border-white/15 bg-white/5 text-white/60 hover:text-white'}`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-white/70 block">Источник трека</label>
                {(() => {
                  const selection = dialogData.track?.type === 'library'
                    ? `library:${dialogData.track.listId}:${dialogData.track.trackId}`
                    : 'custom'
                  return (
                    <>
                      <select
                        className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                        value={selection}
                        onChange={(event) => {
                          const value = event.target.value
                          if (value.startsWith('library:')) {
                            const [, listId, trackId] = value.split(':')
                            handleDataChange(data => data ? { ...data, track: { type: 'library', listId, trackId } } : data)
                          } else {
                            handleDataChange(data => data ? {
                              ...data,
                              track: {
                                type: 'custom',
                                name: data.track?.type === 'custom' ? data.track.name : '',
                              },
                            } : data)
                          }
                        }}
                      >
                        <option value="custom">Произвольный файл / поток</option>
                        {allTracks.map(opt => (
                          <option key={`${opt.listId}:${opt.trackId}`} value={`library:${opt.listId}:${opt.trackId}`}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {selection === 'custom' && (
                        <input
                          className="w-full bg-white/10 border border-white/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                          value={dialogData.track?.name || ''}
                          onChange={(event) => handleDataChange(data => data ? { ...data, track: { type: 'custom', name: event.target.value } } : data)}
                          placeholder="Например, Announcement.mp3"
                        />
                      )}
                    </>
                  )
                })()}
              </div>

              {dialogError && <div className="text-xs text-rose-300">{dialogError}</div>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn glass" onClick={onClose}>Отмена</button>
                <button type="submit" className="btn">{dialog.mode === 'addAnnouncement' ? 'Добавить' : 'Сохранить'}</button>
              </div>
            </form>
          )}

          {['deleteZone', 'deleteList', 'deleteWindow', 'deleteAnnouncement'].includes(dialog.mode) && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-white/80">
                  {dialog.mode === 'deleteZone' && <>Вы уверены, что хотите удалить зону «{activeZone?.name}»?</>}
                  {dialog.mode === 'deleteList' && <>Вы уверены, что хотите удалить плейлист «{activeList?.name}»?</>}
                  {dialog.mode === 'deleteWindow' && <>Удалить временное окно «{activeWindow?.label}»?</>}
                  {dialog.mode === 'deleteAnnouncement' && <>Удалить включение «{activeAnnouncement?.title}»?</>}
                </div>
                {dialog.mode === 'deleteList' && (
                  <div className="text-xs text-white/60">Она будет отвязана от всех зон.</div>
                )}
                {dialog.mode === 'deleteWindow' && (
                  <div className="text-xs text-white/60">Расписание зоны обновится сразу после удаления.</div>
                )}
                {dialog.mode === 'deleteAnnouncement' && (
                  <div className="text-xs text-white/60">Запланированное объявление перестанет воспроизводиться.</div>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn glass" onClick={onClose}>Отмена</button>
                <button type="button" className="btn bg-rose-500/40" onClick={onSubmit}>Удалить</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
