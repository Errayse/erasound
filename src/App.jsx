import React, { useState } from 'react'
import TopNav from './components/TopNav'
import Dashboard from './pages/Dashboard'
import Map from './pages/Map'
import Devices from './pages/Devices'
import Schedule from './pages/Schedule'
import Settings from './pages/Settings'

export default function App(){
  const [tab, setTab] = useState('Обзор')
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <TopNav tab={tab} setTab={setTab} />
      <main className="flex-1 overflow-x-hidden">
        {tab==='Панель' && <Dashboard />}
        {tab==='Карта' && <Map />}
        {tab==='Устройства' && <Devices />}
        {tab==='Планировщик' && <Schedule />}
        {tab==='Параметры' && <Settings />}
      </main>
    </div>
  )
}
