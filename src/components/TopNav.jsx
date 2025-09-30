import React from 'react'

export default function TopNav({tab, setTab}){
  const tabs = ['Панель','Карта','Контент','Группы','Расписание','Настройки']
  return (
    <header className="sticky top-0 z-10 bg-neutral-950/70 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 grid place-items-center font-bold">SK</div>
          <span className="font-semibold text-sm text-white/80">SoundKeeper</span>
        </div>
        <nav className="flex gap-1">
          {tabs.map((t)=> (
            <button key={t} onClick={()=>setTab(t)} className={`btn ${tab===t?'bg-white/20':''}`}>{t}</button>
          ))}
        </nav>
      </div>
    </header>
  )
}
