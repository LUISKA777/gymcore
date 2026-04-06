const BASE = 'https://GymCore-production.up.railway.app/api'

const API = {
  async request(method, path, data) {
    const token = localStorage.getItem('gc_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const url = BASE + path
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
    if (res.status === 401) {
      localStorage.removeItem('gc_token')
      localStorage.removeItem('gc_user')
      window.location.href = '/login'
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error del servidor' }))
      throw { response: { status: res.status, data: err } }
    }
    return { data: await res.json() }
  },
  get(path)         { return this.request('GET', path) },
  post(path, data)  { return this.request('POST', path, data) },
  patch(path, data) { return this.request('PATCH', path, data) },
  delete(path)      { return this.request('DELETE', path) },
}

export default API
