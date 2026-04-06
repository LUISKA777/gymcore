import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

const SUPABASE_URL = 'https://czdlykdzkneneckfzosw.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGx5a2R6a25lbmVja2Z6b3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzkwNjQsImV4cCI6MjA5MDY1NTA2NH0.-ZBe1hXFz5dTI0pOg4NSjQqEVBxN7-yrueSXIcpb2kc'

const PRESET_COLORS = [
  { name:'Morado', value:'#8b5cf6' },
  { name:'Azul', value:'#3b82f6' },
  { name:'Verde', value:'#10b981' },
  { name:'Rojo', value:'#ef4444' },
  { name:'Naranja', value:'#f97316' },
  { name:'Rosa', value:'#ec4899' },
  { name:'Cyan', value:'#06b6d4' },
  { name:'Amarillo', value:'#eab308' },
]

export function applyGymColor(color) {
  if (!color) return
  document.documentElement.style.setProperty('--gym-primary', color)
  const hex = color.replace('#','')
  const r = parseInt(hex.slice(0,2),16)
  const g = parseInt(hex.slice(2,4),16)
  const b = parseInt(hex.slice(4,6),16)
  document.documentElement.style.setProperty('--gym-primary-rgb', `${r},${g},${b}`)
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'#0a0a0a', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'16px 18px' }}>
      <div style={{ fontSize:10, letterSpacing:2, color:'#475569', textTransform:'uppercase', fontFamily:'DM Mono,monospace', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:600, color: color || 'var(--gym-primary)', lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#64748b' }}>{sub}</div>}
    </div>
  )
}

export default function GymProfile() {
  const [gym, setGym] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState('')
  const [form, setForm] = useState({})
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    Promise.all([API.get('/gyms/me'), API.get('/dashboard/'), API.get('/products/')])
      .then(([g, d, p]) => {
        setGym(g.data); setDashboard(d.data); setProducts(p.data)
        setForm({
          name: g.data.name, phone: g.data.phone,
          whatsapp_number: g.data.whatsapp_number, address: g.data.address,
          primary_color: g.data.primary_color || '#8b5cf6',
        })
        applyGymColor(g.data.primary_color || '#8b5cf6')
      }).finally(() => setLoading(false))
  }, [])

  const uploadLogo = async (file) => {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `gym-${gym.id}.${ext}`
      await fetch(`${SUPABASE_URL}/storage/v1/object/gym-logos/${path}`, { method:'DELETE', headers:{ Authorization:`Bearer ${SUPABASE_ANON}` } })
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/gym-logos/${path}`, { method:'POST', headers:{ Authorization:`Bearer ${SUPABASE_ANON}`, 'Content-Type':file.type }, body:file })
      if (res.ok) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/gym-logos/${path}?t=${Date.now()}`
        await API.patch(`/gyms/${gym.id}`, { logo_url: url })
        setGym(prev => ({ ...prev, logo_url: url }))
        setSaved('Logo guardado'); setTimeout(() => setSaved(''), 3000)
      }
    } catch {}
    setUploading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      await API.patch(`/gyms/${gym.id}`, form)
      setGym(prev => ({ ...prev, ...form }))
      applyGymColor(form.primary_color)
      localStorage.setItem('gc_color', form.primary_color)
      setSaved('Guardado'); setTimeout(() => setSaved(''), 3000)
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Cargando...</div></div></div>

  const primary = form.primary_color || '#8b5cf6'
  const d = dashboard || {}
  const activeClients = d.active_clients || 0
  const overdueClients = d.overdue_clients || 0
  const retentionRate = activeClients > 0 ? Math.round(((activeClients - overdueClients) / activeClients) * 100) : 0
  const incomeChange = d.income_last_month > 0 ? Math.round(((d.income_this_month - d.income_last_month) / d.income_last_month) * 100) : 0
  const monthly = d.monthly_chart || []
  const maxIncome = Math.max(...monthly.slice(-6).map(m => m.income), 1)
  const lowStockCount = products.filter(p => p.alert_enabled && p.stock <= (p.alert_threshold || 5)).length

  const navStyle = (t) => ({
    padding:'10px 20px', cursor:'pointer', border:'none',
    background: tab === t ? `rgba(var(--gym-primary-rgb),0.1)` : 'none',
    color: tab === t ? 'var(--gym-primary)' : '#64748b',
    borderBottom: tab === t ? `2px solid var(--gym-primary)` : '2px solid transparent',
    fontFamily:'DM Mono,monospace', fontSize:11, letterSpacing:2, textTransform:'uppercase',
  })

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* Header del gym */}
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:28, background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'20px 24px' }}>
          <div style={{ width:72, height:72, borderRadius:16, border:`2px solid ${primary}44`, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#161616' }}>
            {gym?.logo_url
              ? <img src={gym.logo_url} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:30, opacity:0.3 }}>🏋️</span>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:24, fontWeight:700, color:'#f1f5f9', marginBottom:2 }}>{gym?.name}</div>
            <div style={{ fontSize:12, color:'#64748b' }}>{gym?.email}</div>
            {gym?.address && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{gym.address}</div>}
          </div>
          <div style={{ display:'flex', gap:16, textAlign:'center' }}>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--gym-primary)' }}>{activeClients}</div>
              <div style={{ fontSize:10, color:'#475569', fontFamily:'DM Mono,monospace', letterSpacing:1 }}>CLIENTES</div>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.06)' }} />
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:'#34d399' }}>{retentionRate}%</div>
              <div style={{ fontSize:10, color:'#475569', fontFamily:'DM Mono,monospace', letterSpacing:1 }}>RETENCION</div>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.06)' }} />
            <div>
              <div style={{ fontSize:22, fontWeight:700, color: incomeChange >= 0 ? '#34d399' : '#f87171' }}>{incomeChange >= 0 ? '+' : ''}{incomeChange}%</div>
              <div style={{ fontSize:10, color:'#475569', fontFamily:'DM Mono,monospace', letterSpacing:1 }}>VS MES ANT.</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
          <button style={navStyle('stats')} onClick={() => setTab('stats')}>Estadisticas</button>
          <button style={navStyle('perfil')} onClick={() => setTab('perfil')}>Perfil</button>
          <button style={navStyle('seguridad')} onClick={() => setTab('seguridad')}>Seguridad</button>
        </div>

        {tab === 'stats' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
              <StatCard label="Ingresos este mes" value={`₡${(d.income_this_month||0).toLocaleString()}`} sub={`${incomeChange >= 0 ? '+' : ''}${incomeChange}% vs anterior`} color="#34d399" />
              <StatCard label="Ganancia neta" value={`₡${(d.net_income||0).toLocaleString()}`} sub="Ingresos menos gastos" color={(d.net_income||0) >= 0 ? '#34d399' : '#f87171'} />
              <StatCard label="Clientes activos" value={activeClients} sub={`+${d.new_clients||0} este mes`} />
              <StatCard label="Morosos" value={overdueClients} sub={`${activeClients > 0 ? Math.round((overdueClients/activeClients)*100) : 0}% del total`} color="#f87171" />
              <StatCard label="Retencion" value={`${retentionRate}%`} sub="Clientes al dia" color="#34d399" />
              <StatCard label="Stock bajo" value={lowStockCount} sub="productos con alerta" color={lowStockCount > 0 ? '#fbbf24' : '#34d399'} />
            </div>

            <div className="section">
              <div className="section-title">Ingresos ultimos 6 meses</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:90 }}>
                {monthly.slice(-6).map((m, i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:10, color:'#34d399', fontFamily:'DM Mono,monospace' }}>
                      {m.income > 0 ? `₡${(m.income/1000).toFixed(0)}k` : ''}
                    </div>
                    <div style={{ width:'100%', background:'var(--gym-primary)', borderRadius:'4px 4px 0 0', height: Math.max((m.income/maxIncome)*70, m.income > 0 ? 4 : 2), transition:'height 0.3s' }} />
                    <div style={{ fontSize:10, color:'#64748b', fontFamily:'DM Mono,monospace' }}>{m.month}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="section">
                <div className="section-title">Top clientes</div>
                {(d.top_clients || []).slice(0,5).map((c, i) => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize:11, color:'#475569', fontFamily:'DM Mono,monospace', width:16 }}>#{i+1}</div>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:`rgba(var(--gym-primary-rgb),0.15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--gym-primary)' }}>{c.name.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>{c.months_as_client || 0} meses</div>
                    </div>
                  </div>
                ))}
                {!(d.top_clients || []).length && <p style={{ color:'#64748b', fontSize:13 }}>Sin datos</p>}
              </div>

              <div className="section">
                <div className="section-title">Por vencer esta semana</div>
                {(d.expiring_soon || []).slice(0,5).map(c => (
                  <div key={c.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize:13 }}>{c.name}</div>
                    <span style={{ fontSize:11, color:'#fbbf24', fontFamily:'DM Mono,monospace' }}>{c.membership_end}</span>
                  </div>
                ))}
                {!(d.expiring_soon || []).length && <p style={{ color:'#64748b', fontSize:13 }}>Nadie vence esta semana</p>}
              </div>
            </div>
          </>
        )}

        {tab === 'perfil' && (
          <div style={{ maxWidth:560 }}>
            <div className="section" style={{ marginBottom:16 }}>
              <div className="section-title">Logo</div>
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:8 }}>
                <div style={{ width:80, height:80, borderRadius:14, border:`2px dashed ${primary}44`, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'#161616', flexShrink:0 }}>
                  {gym?.logo_url ? <img src={gym.logo_url} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:28, opacity:0.3 }}>🏋️</span>}
                </div>
                <label style={{ background: primary, color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:500 }}>
                  {uploading ? 'Subiendo...' : 'Cambiar logo'}
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
                </label>
              </div>
            </div>

            <div className="section" style={{ marginBottom:16 }}>
              <div className="section-title">Informacion</div>
              <div style={{ display:'grid', gap:14 }}>
                <div><label className="label">Nombre del gym</label><input className="input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><label className="label">Telefono</label><input className="input" placeholder="8888-0000" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><label className="label">WhatsApp</label><input className="input" placeholder="50688880000" value={form.whatsapp_number || ''} onChange={e => setForm({...form, whatsapp_number: e.target.value})} /></div>
                <div><label className="label">Direccion</label><input className="input" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} /></div>
              </div>
            </div>

            <div className="section" style={{ marginBottom:16 }}>
              <div className="section-title">Color principal</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                {PRESET_COLORS.map(c => (
                  <div key={c.value} onClick={() => setForm({...form, primary_color: c.value})}
                    style={{ width:36, height:36, borderRadius:'50%', background:c.value, cursor:'pointer',
                      border: form.primary_color === c.value ? '3px solid #fff' : '3px solid transparent',
                      outline: form.primary_color === c.value ? `2px solid ${c.value}` : 'none' }} title={c.name} />
                ))}
              </div>
              <input type="color" value={form.primary_color || '#8b5cf6'} onChange={e => setForm({...form, primary_color: e.target.value})}
                style={{ width:40, height:40, border:'none', borderRadius:8, cursor:'pointer', background:'none' }} />
            </div>

            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <button onClick={saveProfile} disabled={saving}
                style={{ background: primary, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:500 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {saved && <span style={{ color:'#34d399', fontSize:12 }}>{saved}</span>}
            </div>
          </div>
        )}

        {tab === 'seguridad' && (
          <div style={{ maxWidth:460 }}>
            <div className="section" style={{ marginBottom:16 }}>
              <div className="section-title">PIN del dueno</div>
              <p style={{ color:'#64748b', fontSize:12, marginBottom:14 }}>El PIN se usa para entrar como dueno en la pantalla de seleccion de rol.</p>
              <ChangePIN gymId={gym?.id} />
            </div>
            <div className="section">
              <div className="section-title">Cambiar contrasena</div>
              <ChangePassword />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChangePIN({ gymId }) {
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    if (!pin || pin.length < 4) return setMsg('El PIN debe tener al menos 4 digitos')
    setSaving(true)
    try {
      await API.patch(`/gyms/${gymId}`, { owner_pin: pin })
      setMsg('PIN actualizado'); setPin('')
      setTimeout(() => setMsg(''), 3000)
    } catch { setMsg('Error al guardar') }
    setSaving(false)
  }

  return (
    <div style={{ display:'grid', gap:12 }}>
      {msg && <div style={{ color: msg.includes('Error') ? '#f87171' : '#34d399', fontSize:12 }}>{msg}</div>}
      <div><label className="label">Nuevo PIN</label>
        <input className="input" type="password" placeholder="Min 4 digitos" maxLength={8} value={pin} onChange={e => setPin(e.target.value)} style={{ maxWidth:200 }} />
      </div>
      <button className="btn btn-purple" onClick={save} disabled={saving} style={{ width:'fit-content' }}>
        {saving ? 'Guardando...' : 'Cambiar PIN'}
      </button>
    </div>
  )
}

function ChangePassword() {
  const [form, setForm] = useState({ current:'', newPass:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const save = async () => {
    if (!form.current || !form.newPass) return setError('Completa todos los campos')
    if (form.newPass !== form.confirm) return setError('Las contrasenas no coinciden')
    if (form.newPass.length < 6) return setError('Minimo 6 caracteres')
    setError(''); setSaving(true)
    try {
      await API.post('/auth/change-password', { current_password: form.current, new_password: form.newPass })
      setMsg('Contrasena actualizada'); setForm({ current:'', newPass:'', confirm:'' })
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setError(e.response?.data?.detail || 'Contrasena actual incorrecta') }
    setSaving(false)
  }

  return (
    <div style={{ display:'grid', gap:14 }}>
      {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{error}</div>}
      {msg && <div style={{ color:'#34d399', fontSize:12 }}>{msg}</div>}
      <div><label className="label">Contrasena actual</label><input className="input" type="password" placeholder="••••••••" value={form.current} onChange={e => setForm({...form, current: e.target.value})} /></div>
      <div><label className="label">Nueva contrasena</label><input className="input" type="password" placeholder="Minimo 6 caracteres" value={form.newPass} onChange={e => setForm({...form, newPass: e.target.value})} /></div>
      <div><label className="label">Confirmar contrasena</label><input className="input" type="password" placeholder="Repetir" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} /></div>
      <button onClick={save} disabled={saving} className="btn btn-purple" style={{ width:'fit-content' }}>
        {saving ? 'Guardando...' : 'Cambiar contrasena'}
      </button>
    </div>
  )
}
