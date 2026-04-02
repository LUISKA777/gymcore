import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import API from '../api'

const GOALS = ['Perder peso', 'Ganar músculo', 'Mantenimiento', 'Rendimiento deportivo', 'Rehabilitación']

const Modal = ({ title, onClose, onSave, saving, error, children }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
    <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
      <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>{title}</h3>
      {error && <div className="error-msg">{error}</div>}
      {children}
      <div style={{ display:'flex', gap:12, marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
        <button className="btn btn-purple" onClick={onSave} disabled={saving} style={{ flex:2 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
)

export default function Clients() {
  const [clients, setClients] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([API.get('/clients/'), API.get('/dashboard/plans/')])
      .then(([c, p]) => { setClients(c.data); setPlans(p.data) })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.name) return setError('El nombre es obligatorio')
    setSaving(true)
    try {
      const res = await API.post('/clients', form)
      setClients(prev => [...prev, res.data])
      setModal(false); setForm({}); setError('')
    } catch (e) { setError(e.response?.data?.detail || 'Error al guardar') }
    setSaving(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = clients.filter(c => {
    if (!c.active) return false
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'overdue') return matchSearch && c.membership_end && c.membership_end < today
    if (filter === 'active') return matchSearch && c.membership_end && c.membership_end >= today
    return matchSearch
  })

  const statusOf = (c) => {
    if (!c.membership_end) return { label:'Sin membresía', cls:'pill-blue' }
    if (c.membership_end < today) return { label:'Vencida', cls:'pill-red' }
    const diff = Math.ceil((new Date(c.membership_end) - new Date()) / 86400000)
    if (diff <= 3) return { label:`Vence en ${diff}d`, cls:'pill-amber' }
    return { label:'Activa', cls:'pill-green' }
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="page-title" style={{ marginBottom:0 }}>Clientes</div>
          <button className="btn btn-purple" onClick={() => { setForm({}); setError(''); setModal(true) }}>+ Agregar cliente</button>
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <input className="input" placeholder="Buscar cliente..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth:260 }} />
          {['all','active','overdue'].map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn-purple' : 'btn-ghost'}`}
              onClick={() => setFilter(f)} style={{ fontSize:12 }}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Al día' : 'Morosos'}
            </button>
          ))}
        </div>

        {loading ? <div className="loading">Cargando...</div> : (
          <div className="section">
            <table className="table">
              <thead>
                <tr>
                  {['Cliente','Teléfono','Edad','Plan','Vencimiento','Estado',''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const st = statusOf(c)
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div className="avatar">{c.name.slice(0,2).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight:500 }}>{c.name}</div>
                            <div style={{ fontSize:11, color:'#64748b' }}>{c.months_as_client || 0} meses</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color:'#64748b' }}>{c.phone || '—'}</td>
                      <td style={{ color:'#64748b' }}>{c.age ? `${c.age} años` : '—'}</td>
                      <td>{c.membership_plans?.name || '—'}</td>
                      <td style={{ fontFamily:'DM Mono,monospace', fontSize:12 }}>{c.membership_end || '—'}</td>
                      <td><span className={`pill ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <button className="btn btn-ghost" style={{ fontSize:11, padding:'4px 10px' }}
                          onClick={() => navigate(`/clientes/${c.id}`)}>Ver</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!filtered.length && <div style={{ color:'#64748b', padding:20, textAlign:'center' }}>No hay clientes</div>}
          </div>
        )}
      </div>

      {modal && (
        <Modal title="Nuevo cliente" onClose={() => setModal(false)} onSave={save} saving={saving} error={error}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Nombre completo *</label>
              <input className="input" placeholder="Carlos Rodríguez" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" placeholder="8888-0000" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">WhatsApp (con código país)</label>
              <input className="input" placeholder="50688880000" value={form.whatsapp_number || ''} onChange={e => setForm({...form, whatsapp_number: e.target.value})} />
            </div>
            <div>
              <label className="label">Edad</label>
              <input className="input" type="number" placeholder="25" value={form.age || ''} onChange={e => setForm({...form, age: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="label">Meses como cliente</label>
              <input className="input" type="number" placeholder="0" value={form.months_as_client || ''} onChange={e => setForm({...form, months_as_client: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="label">Peso (kg)</label>
              <input className="input" type="number" step="0.1" placeholder="70.5" value={form.weight || ''} onChange={e => setForm({...form, weight: parseFloat(e.target.value)})} />
            </div>
            <div>
              <label className="label">Altura (cm)</label>
              <input className="input" type="number" placeholder="175" value={form.height || ''} onChange={e => setForm({...form, height: parseFloat(e.target.value)})} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Objetivo</label>
              <select className="input" value={form.goal || ''} onChange={e => setForm({...form, goal: e.target.value})}>
                <option value="">Seleccioná un objetivo</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Plan de membresía</label>
              <select className="input" value={form.membership_plan_id || ''} onChange={e => setForm({...form, membership_plan_id: parseInt(e.target.value)})}>
                <option value="">Sin plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₡{p.price.toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Inicio membresía</label>
              <input className="input" type="date" value={form.membership_start || ''} onChange={e => setForm({...form, membership_start: e.target.value})} />
            </div>
            <div>
              <label className="label">Fin membresía</label>
              <input className="input" type="date" value={form.membership_end || ''} onChange={e => setForm({...form, membership_end: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
