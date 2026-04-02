import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

const SUPABASE_URL = 'https://czdlykdzkneneckfzosw.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZGx5a2R6a25lbmVja2Z6b3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzkwNjQsImV4cCI6MjA5MDY1NTA2NH0.-ZBe1hXFz5dTI0pOg4NSjQqEVBxN7-yrueSXIcpb2kc'

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
      setForm({ name: r.data.name, phone: r.data.phone, whatsapp_number: r.data.whatsapp_number, address: r.data.address })
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
        setSaved('Logo guardado ✓')
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
      setSaved('Perfil guardado ✓')
      setTimeout(() => setSaved(''), 3000)
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Cargando...</div></div></div>

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-title">Perfil del Gym</div>

        <div className="section" style={{ maxWidth: 600 }}>
          <div className="section-title">Logo e identidad</div>

          <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:28 }}>
            <div style={{ width:100, height:100, borderRadius:16, border:'2px dashed rgba(139,92,246,0.3)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'#161616', flexShrink:0 }}>
              {gym.logo_url
                ? <img src={gym.logo_url} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:36, opacity:0.3 }}>🏋️</span>
              }
            </div>
            <div>
              <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>Logo del gym</div>
              <label style={{ background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, cursor:'pointer', fontWeight:500 }}>
                {uploading ? 'Subiendo...' : '📁 Subir logo'}
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
              </label>
              <div style={{ fontSize:11, color:'#475569', marginTop:6 }}>JPG, PNG — máx 2MB</div>
            </div>
          </div>

          <div style={{ display:'grid', gap:16 }}>
            <div>
              <label className="label">Nombre del gym</label>
              <input className="input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
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
              <label className="label">Dirección</label>
              <input className="input" placeholder="Ej: 100m norte del parque central" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
          </div>

          <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:20 }}>
            <button className="btn btn-purple" onClick={saveProfile} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span style={{ color:'#34d399', fontSize:12 }}>{saved}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
