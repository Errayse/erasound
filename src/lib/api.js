const api = {
  async scan() {
    const r = await fetch('/api/devices/scan')
    return r.json()
  },
  async devices() {
    const r = await fetch('/api/devices')
    return r.json()
  },
  async play(ip, file) {
    await fetch(`/api/device/${ip}/play`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({file})})
  },
  async stop(ip) {
    await fetch(`/api/device/${ip}/stop`, {method:'POST'})
  },
  async volume(ip, level) {
    await fetch(`/api/device/${ip}/volume`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({level})})
  },
  async files(ip) {
    const r = await fetch(`/api/device/${ip}/files`)
    return r.json()
  },
  async upload(ip, file) {
    const fd = new FormData(); fd.append('file', file)
    await fetch(`/api/device/${ip}/upload`, {method:'POST', body: fd})
  }
}
export default api
