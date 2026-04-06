import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

const SUPABASE_URL = 'https://czdlykdzkneneckfzosw.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGx5a2R6a25lbmVja2Z6b3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzkwNjQsImV4cCI6MjA5MDY1NTA2NH0.-ZBe1hXFz5dTI0pOg4NSjQqEVBxN7-yrueSXIcpb2kc'
const PRESET_COLORS = [
  { name: 'Morado', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Amarillo', value: '#eab308' },
]

export function applyGymColor(color) {
  if (!color) return
  document.documentElement.style.setProperty('--gym-primary', color)
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0,2), 16)
  const g = parseInt(hex.slice(2,4), 16)
  const b = parseInt(hex.slice(4,6), 16)
  document.documentElement.style.setProperty('--gym-primary-rgb', `${r},${g},${b}`)
}

export default function GymProfile() {
  const [gym, setGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState('')
  const [form, setForm] = useState({})

  useEffect(() => {
    API.get('/gyms/me').then(r => {
      setGym(r.data)
      setForm({
        name: r.data.name,
        phone: r.data.phone,
        whatsapp_number: r.data.whatsapp_number,
        address: r.data.address,
        primary_color: r.data.primary_color || '#8b5cf6',
        stock_alert_threshold: r.data.stock_alert_threshold || 5,
      })
      applyGymColor(r.data.primary_color || '#8b5cf6')
    }).finally(() => setLoading(false))
  }, [])

  const uploadLogo = async (file) => {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `gym-${gym.id}.${ext}`
      await fetch(`${SUPABASE_URL}/storage/v1/object/gym-logos/${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}` },
      })
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/gym-logos/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': file.type },
        body: file,
      })
      if (res.ok) {
        const url = `${SUPABASE_URL}/storage/v1/object/public/gym-logos/${path}?t=${Date.now()}`
        await API.patch(`/gyms/${gym.id}`, { logo_url: url })
        setGym(prev => ({ ...prev, logo_url: url }))
        setSaved('Logo guardado')
        setTimeout(() => setSaved(''), 3000)
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
      setSaved('Perfil guardado')
      setTimeout(() => setSaved(''), 3000)
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Cargando...</div></div></div>

  const primary = form.primary_color || '#8b5cf6'

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-title">Perfil del Gym</div>

        <div className="section" style={{ maxWidth: 600 }}>
          <div className="section-title">Logo e identidad</div>

          <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:28 }}>
            <div style={{ width:100, height:100, borderRadius:16, border:`2px dashed ${primary}44`, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'#161616', flexShrink:0 }}>
              {gym.logo_url
                ? <img src={gym.logo_url} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:36, opacity:0.3 }}>🏋️</span>
              }
            </div>
            <div>
              <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>Logo del gym</div>
              <label style={{ background: primary, color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:500 }}>
                {uploading ? 'Subiendo...' : 'Subir logo'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
              </label>
              <div style={{ fontSize:11, color:'#475569', marginTop:6 }}>JPG, PNG — max 2MB</div>
            </div>
          </div>

          <div style={{ display:'grid', gap:16 }}>
            <div>
              <label className="label">Nombre del gym</label>
              <input className="input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Telefono</label>
              <input className="input" placeholder="8888-0000" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">WhatsApp (con codigo pais)</label>
              <input className="input" placeholder="50688880000" value={form.whatsapp_number || ''} onChange={e => setForm({...form, whatsapp_number: e.target.value})} />
            </div>
            <div>
              <label className="label">Direccion</label>
              <input className="input" placeholder="Ej: 100m norte del parque central" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </div>

            <div>
              <label className="label">Alerta stock bajo (unidades)</label>
              <input className="input" type="number" min="1" placeholder="5" value={form.stock_alert_threshold || ''} onChange={e => setForm({...form, stock_alert_threshold: parseInt(e.target.value)})} />
            </div>

            <div>
              <label className="label">Color principal</label>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                {PRESET_COLORS.map(c => (
                  <div key={c.value} onClick={() => setForm({...form, primary_color: c.value})}
                    style={{ width:36, height:36, borderRadius:'50%', background:c.value, cursor:'pointer',
                      border: form.primary_color === c.value ? `3px solid #fff` : '3px solid transparent',
                      outline: form.primary_color === c.value ? `2px solid ${c.value}` : 'none',
                      transition:'all 0.15s' }} title={c.name} />
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <input type="color" value={form.primary_color || '#8b5cf6'}
                  onChange={e => setForm({...form, primary_color: e.target.value})}
                  style={{ width:40, height:40, border:'none', borderRadius:8, cursor:'pointer', background:'none' }} />
                <span style={{ fontSize:12, color:'#64748b' }}>O elegí un color personalizado</span>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:20 }}>
            <button onClick={saveProfile} disabled={saving}
              style={{ background: primary, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:500 }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span style={{ color:'#34d399', fontSize:12 }}>{saved}</span>}
          </div>
        </div>

        <div className="section" style={{ maxWidth: 600 }}>
          <div className="section-title">Cambiar contrasena</div>
          <ChangePassword />
        </div>
      </div>
    </div>
  )
}

function ChangePassword() {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
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
      setMsg('Contrasena actualizada')
      setForm({ current: '', newPass: '', confirm: '' })
      setTimeout(() => setMsg(''), 3000)
    } catch (e) { setError(e.response?.data?.detail || 'Contrasena actual incorrecta') }
    setSaving(false)
  }

  return (
    <div style={{ display:'grid', gap:14 }}>
      {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{error}</div>}
      {msg && <div style={{ background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{msg}</div>}
      <div>
        <label className="label">Contrasena actual</label>
        <input className="input" type="password" placeholder="••••••••" value={form.current} onChange={e => setForm({...form, current: e.target.value})} />
      </div>
      <div>
        <label className="label">Nueva contrasena</label>
        <input className="input" type="password" placeholder="Minimo 6 caracteres" value={form.newPass} onChange={e => setForm({...form, newPass: e.target.value})} />
      </div>
      <div>
        <label className="label">Confirmar nueva contrasena</label>
        <input className="input" type="password" placeholder="Repetir contrasena" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
      </div>
      <button onClick={save} disabled={saving} className="btn btn-purple" style={{ width:'fit-content' }}>
        {saving ? 'Guardando...' : 'Cambiar contrasena'}
      </button>
    </div>
  )
}
