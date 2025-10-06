import React, { useState } from 'react'
import TopNav from './components/TopNav'
import Dashboard from './pages/Dashboard'
import Map from './pages/Map'
import Content from './pages/Content'
import Groups from './pages/Groups'
import Schedule from './pages/Schedule'
import Settings from './pages/Settings'

export default function App(){
  const [tab, setTab] = useState('Обзор')
  return (
    <div className="min-h-screen">
      <TopNav tab={tab} setTab={setTab} />
      {tab==='Обзор' && <Dashboard />}
      {tab==='Сеть' && <Map />}
      {tab==='Медиа' && <Content />}
      {tab==='Зоны' && <Groups />}
      {tab==='Расписание' && <Schedule />}
      {tab==='Параметры' && <Settings />}
    </div>
  )
}
