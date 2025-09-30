import React, {useState} from 'react'
import api from '../lib/api'

export default function Content(){
  const [ip, setIp] = useState('')
  const [files, setFiles] = useState([])
  const [file, setFile] = useState(null)

  async function loadFiles(){
    if(!ip) return
    const res = await api.files(ip)
    setFiles(res)
  }
  async function upload(){
    if(ip && file){ await api.upload(ip, file); await loadFiles() }
  }

  return <div className="max-w-6xl mx-auto p-4 space-y-3">
    <div className="glass p-4 flex gap-2 items-center">
      <input className="glass px-3 py-2 w-64" placeholder="IP устройства" value={ip} onChange={e=>setIp(e.target.value)} />
      <button className="btn" onClick={loadFiles}>Показать файлы</button>
      <input type="file" onChange={e=>setFile(e.target.files?.[0])}/>
      <button className="btn" onClick={upload}>Загрузить</button>
    </div>
    <div className="grid gap-2">
      {files?.map(f=>(<div key={f} className="glass px-4 py-2">{f}</div>))}
      {!files?.length && <div className="glass p-6 text-white/60">Нет данных</div>}
    </div>
  </div>
}
