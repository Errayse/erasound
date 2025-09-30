// src/components/TopNav.jsx
import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * TopNav (showcase)
 * - адаптивный стеклянный навбар с плавными анимациями
 * - активный индикатор вкладки (плашка под кнопкой)
 * - поддержка клавиатуры (←/→ для переключения вкладок)
 * - единый стиль для всего приложения
 */

const TABS = ['Панель','Карта','Контент','Группы','Расписание','Настройки']

export default function TopNav({ tab, setTab }) {
  const wrapRef = useRef(null)

  // Клавиатура: стрелки ←/→ для переключения вкладок
  useEffect(() => {
    const onKey = (e) => {
      if (!wrapRef.current) return
      const idx = TABS.indexOf(tab)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setTab(TABS[(idx + 1) % TABS.length])
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setTab(TABS[(idx - 1 + TABS.length) % TABS.length])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, setTab])

  return (
    <header className="sticky top-0 z-20 bg-neutral-950/70 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Логотип/бренд */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-2xl bg-white/10 grid place-items-center shadow-glass">
            <div className="w-4 h-4 rounded-md bg-white/70" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-wide">SoundKeeper</div>
            <div className="text-xs text-white/50">Network Audio Control</div>
          </div>
        </div>

        {/* Навигация */}
        <nav
          ref={wrapRef}
          className="relative rounded-2xl border border-white/10 bg-white/5 p-1 shadow-glass overflow-hidden"
          role="tablist"
        >
          <ul className="flex items-center gap-1">
            {/* Подсветка активной вкладки (плавающая плашка) */}
            <motion.div
              key={`active-${tab}`}
              layoutId="nav-active"
              className="absolute top-1 bottom-1 rounded-xl bg-white/10"
              initial={false}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
              style={{
                // позиция вычисляется через offset активной кнопки
                // будем обновлять через эффект ниже
              }}
            />
            {TABS.map((t) => (
              <NavButton
                key={t}
                active={tab === t}
                onClick={() => setTab(t)}
                label={t}
              />
            ))}
          </ul>
        </nav>
      </div>
      {/* Небольшая тень под шапкой для отделения контента при скролле */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  )
}

/** Отдельная кнопка вкладки с измерением позиции для плавающей плашки */
function NavButton({ label, active, onClick }) {
  const ref = useRef(null)

  // Храним позицию кнопки в data-атрибутах родителя, чтобы TopNav мог их считать
  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement?.parentElement // <nav> wrapper
    if (!el || !parent) return
    const update = () => {
      const r = el.getBoundingClientRect()
      const p = parent.getBoundingClientRect()
      if (active) {
        // пишем CSS-переменные для активной плашки
        parent.style.setProperty('--active-left', `${r.left - p.left}px`)
        parent.style.setProperty('--active-width', `${r.width}px`)
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
        className={`relative z-10 px-3 sm:px-4 py-2 rounded-xl transition-colors
          ${active ? 'text-white' : 'text-white/70 hover:text-white'}
        `}
      >
        <span className="text-sm sm:text-[0.95rem] font-medium tracking-wide">
          {label}
        </span>
        {/* Микро-индикатор активной вкладки под текстом (полоса) */}
        <motion.span
          layoutId={`underline-${label}`}
          className={`block mt-0.5 h-0.5 rounded-full ${active ? 'bg-white/70' : 'bg-transparent'}`}
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      </button>

      {/* inline-стили для плавающей плашки — читаются TopNav через CSS vars */}
      <style>{`
        nav > ul > div[layoutid="nav-active"] {
          left: var(--active-left, 0px);
          width: var(--active-width, 0px);
        }
      `}</style>
    </li>
  )
}
