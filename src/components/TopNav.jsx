// src/components/TopNav.jsx
import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * Боковая панель навигации для EraSound Center
 * - вертикальный стеклянный бар с иконками
 * - подсветка активной вкладки
 * - подсказки при наведении
 * - клавиатурная навигация (↑/↓)
 */

const TABS = [
  { id: 'Панель', label: 'Панель', Icon: IconDashboard },
  { id: 'Карта', label: 'Карта', Icon: IconMap },
  { id: 'Устройства', label: 'Устройства', Icon: IconDevices },
  { id: 'Планировщик', label: 'Планировщик', Icon: IconPlanner },
  { id: 'Параметры', label: 'Параметры', Icon: IconSettings },
]

export default function TopNav({ tab, setTab }) {
  const wrapRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (!wrapRef.current) return
      const idx = TABS.findIndex(t => t.id === tab)
      if (idx === -1) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = TABS[(idx + 1) % TABS.length]
        setTab(next.id)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = TABS[(idx - 1 + TABS.length) % TABS.length]
        setTab(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, setTab])

  return (
    <aside className="flex flex-col w-16 sm:w-20 xl:w-24 shrink-0 border-r border-white/10 bg-neutral-950/80 backdrop-blur-lg text-white">
      <div className="flex h-full flex-col items-center gap-8 py-6">
        <div className="select-none text-center">
          <div className="mx-auto mb-2 h-11 w-11 rounded-2xl bg-white/10 grid place-items-center shadow-glass">
            <div className="h-5 w-5 rounded-xl bg-white/80" />
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">Era</div>
        </div>

        <nav
          ref={wrapRef}
          className="relative flex flex-1 flex-col items-center gap-2"
          role="tablist"
        >
          <motion.span
            key={`active-${tab}`}
            layoutId="nav-active"
            className="absolute left-1 right-1 rounded-2xl bg-white/10"
            initial={false}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            style={{
              top: 'var(--active-top, 0px)',
              height: 'var(--active-height, 0px)'
            }}
          />
          <ul className="flex flex-1 flex-col items-center gap-2">
            {TABS.map((t) => (
              <NavButton
                key={t.id}
                active={tab === t.id}
                onClick={() => setTab(t.id)}
                label={t.label}
              >
                <t.Icon className="h-5 w-5" aria-hidden="true" />
              </NavButton>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

function NavButton({ label, active, onClick, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement?.parentElement // <nav> wrapper
    if (!el || !parent) return
    const update = () => {
      const r = el.getBoundingClientRect()
      const p = parent.getBoundingClientRect()
      if (active) {
        parent.style.setProperty('--active-top', `${r.top - p.top}px`)
        parent.style.setProperty('--active-height', `${r.height}px`)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active])

  return (
    <li>
      <button
        ref={ref}
        role="tab"
        aria-selected={active}
        onClick={onClick}
        className={`group relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${active ? 'text-white' : 'text-white/60 hover:text-white'}`}
        title={label}
      >
        {children}
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-neutral-900/90 px-3 py-1 text-xs text-white/80 opacity-0 shadow-lg backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
          {label}
        </span>
      </button>
    </li>
  )
}

function IconDashboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 13h7V4H4z" />
      <path d="M13 20h7v-9h-7z" />
      <path d="M4 20h7v-5H4z" />
      <path d="M13 4v5h7V4z" />
    </svg>
  )
}

function IconMap(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3 3 5.5v15l6-2.5 6 2.5 6-2.5v-15l-6 2.5z" />
      <path d="M9 3v15" />
      <path d="M15 5.5v15" />
    </svg>
  )
}

function IconDevices(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="7" height="12" rx="2" />
      <rect x="14" y="8" width="7" height="12" rx="2" />
      <path d="M6.5 18v2" />
      <path d="M17.5 20v1" />
      <path d="M14 12h7" />
      <path d="M3 10h7" />
    </svg>
  )
}

function IconPlanner(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4.5" width="16" height="16" rx="3" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M4 10h16" />
      <path d="M12 14h4" />
      <path d="M8 18h4" />
    </svg>
  )
}

function IconSettings(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
