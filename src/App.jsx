import React, { useState } from 'react'
import TopNav from './components/TopNav'
import Dashboard from './pages/Dashboard'
import Map from './pages/Map'
import Content from './pages/Content'
import Groups from './pages/Groups'
import Schedule from './pages/Schedule'
import Settings from './pages/Settings'

export default function App(){
  const [tab, setTab] = useState('Панель')
  return (
    <div className="min-h-screen">
      <TopNav tab={tab} setTab={setTab} />
      {tab==='Панель' && <Dashboard />}
      {tab==='Карта' && <Map />}
      {tab==='Контент' && <Content />}
      {tab==='Группы' && <Groups />}
      {tab==='Расписание' && <Schedule />}
      {tab==='Настройки' && <Settings />}
    </div>
  )
}
