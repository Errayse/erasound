export const WEEK_DAYS = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
]

export const DAY_GROUPS = {
  all: WEEK_DAYS.map(d => d.value),
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  weekend: ['sat', 'sun'],
}

export const DAY_ORDER = WEEK_DAYS.map(d => d.value)
