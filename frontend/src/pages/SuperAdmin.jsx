import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import API from '../api'

const Modal = ({ title, onClose, onSave, saving, error, children }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:32, width:'100%', maxWidth:460 }}>
      <h3 style={{ fontSize:20, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>{title}</h3>
      {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{error}</div>}
      {children}
      <div style={{ display:'flex', gap:12, marginTop:24 }}>
        <button onClick={onClose} style={{ flex:1, padding:'10px', background:'transparent', color:'#64748b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, cursor:'pointer', fontSize:13 }}>Cancelar</button>
        <button onClick={onSave} disabled={saving} style={{ flex:2, padding:'10px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
)

export default function SuperAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [pinModal, setPinModal] = useState(null)
  const [newPin, setNewPin] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return }
    API.get('/gyms/').then(r => setGyms(r.data)).finally(() => setLoading(false))
  }, [user])

  const save = async () => {
    if (!form.name || !form.email || !form.password) return setError('Nombre, email y contraseña son obligatorios')
    if (!form.owner_pin || form.owner_pin.length < 4) return setError('El PIN debe tener al menos 4 digitos')
    setSaving(true)
    try {
      const res = await API.post('/auth/register', form)
      // Save PIN separately
      await API.patch(`/gyms/${res.data.id}`, { owner_pin: form.owner_pin })
      const r = await API.get('/gyms/')
      setGyms(r.data)
      setModal(false); setForm({}); setError('')
    } catch (e) { setError(e.response?.data?.detail || 'Error al crear gym') }
    setSaving(false)
  }

  const toggleGym = async (id, active) => {
    await API.patch(`/gyms/${id}`, { active: !active })
    setGyms(prev => prev.map(g => g.id === id ? { ...g, active: !active } : g))
  }

  const deleteGym = async (gym) => {
    if (!confirm(`¿Eliminar ${gym.name} permanentemente? Esta acción no se puede deshacer.`)) return
    await API.delete(`/gyms/${gym.id}`)
    setGyms(prev => prev.filter(g => g.id !== gym.id))
  }

  const savePin = async () => {
    if (!newPin || newPin.length < 4) return
    setSavingPin(true)
    try {
      await API.patch(`/gyms/${pinModal.id}`, { owner_pin: newPin })
      setPinModal(null); setNewPin('')
    } catch {}
    setSavingPin(false)
  }

  const filtered = gyms.filter(g => g.role !== 'admin' && g.name?.toLowerCase().includes(search.toLowerCase()))
  const activeCount = filtered.filter(g => g.active).length

  return (
    <div style={{ minHeight:'100vh', background:'#080808', color:'#f1f5f9', fontFamily:'Inter,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'#111', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>G</div>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:'#f1f5f9' }}>GymWep</div>
            <div style={{ fontSize:11, color:'#64748b', fontFamily:'DM Mono,monospace', letterSpacing:1 }}>SUPER ADMIN</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'#64748b' }}>{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ background:'transparent', color:'#64748b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 14px', fontSize:12, cursor:'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{ padding:'32px' }}>
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:28 }}>
          {[
            ['Total gyms', filtered.length, '#a78bfa'],
            ['Activos', activeCount, '#34d399'],
            ['Inactivos', filtered.length - activeCount, '#f87171'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', fontFamily:'DM Mono,monospace', marginBottom:8 }}>{label}</div>
              <div style={{ fontSize:32, fontWeight:600, color, lineHeight:1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12, flexWrap:'wrap' }}>
          <input
            placeholder="Buscar gym..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#f1f5f9', fontSize:13, padding:'9px 14px', outline:'none', width:260 }}
          />
          <button onClick={() => { setForm({}); setError(''); setModal(true) }}
            style={{ background:'#8b5cf6', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            + Agregar gym
          </button>
        </div>

        {/* Gyms grid */}
        {loading ? <div style={{ color:'#64748b', padding:40, textAlign:'center', fontFamily:'DM Mono,monospace' }}>Cargando gyms...</div> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {filtered.map(g => (
              <div key={g.id} style={{ background:'#111', border:`1px solid ${g.active ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.15)'}`, borderRadius:16, padding:20, transition:'border-color 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:'rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#a78bfa', flexShrink:0 }}>
                    {g.name?.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:600, color:'#f1f5f9', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</div>
                    <div style={{ fontSize:11, color:'#64748b', fontFamily:'DM Mono,monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.email}</div>
                  </div>
                  <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontFamily:'DM Mono,monospace', fontWeight:500, flexShrink:0,
                    background: g.active ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                    color: g.active ? '#34d399' : '#f87171' }}>
                    {g.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {[
                    ['Teléfono', g.phone || '—'],
                    ['Registrado', new Date(g.created_at).toLocaleDateString('es-CR')],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background:'#0a0a0a', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'#475569', marginBottom:2, fontFamily:'DM Mono,monospace', letterSpacing:1 }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize:12, color:'#94a3b8' }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => toggleGym(g.id, g.active)}
                    style={{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                      background: g.active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                      color: g.active ? '#f87171' : '#34d399' }}>
                    {g.active ? 'Restringir' : 'Activar'}
                  </button>
                  <button onClick={() => { setPinModal(g); setNewPin('') }}
                    style={{ padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, background:'rgba(139,92,246,0.1)', color:'#a78bfa' }}>
                    PIN
                  </button>
                  <button onClick={() => deleteGym(g)}
                    style={{ padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, background:'rgba(248,113,113,0.08)', color:'#f87171' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div style={{ gridColumn:'1/-1', color:'#64748b', padding:40, textAlign:'center', fontFamily:'DM Mono,monospace' }}>
                No hay gyms registrados
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal title="Registrar nuevo gym" onClose={() => setModal(false)} onSave={save} saving={saving} error={error}>
          <div style={{ display:'grid', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>Nombre del gym</label>
              <input style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }}
                placeholder="PowerFit Gym" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>Correo electrónico</label>
              <input type="email" style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }}
                placeholder="gym@correo.com" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>Teléfono</label>
              <input style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }}
                placeholder="8888-0000" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>WhatsApp (sin 506)</label>
              <input style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }}
                placeholder="88880000" value={form.whatsapp_number || ''} onChange={e => setForm({...form, whatsapp_number: '506' + e.target.value.replace(/\D/g,'')})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>Contraseña inicial</label>
              <input type="password" style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }}
                placeholder="Minimo 6 caracteres" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>PIN del dueño</label>
              <input style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }}
                placeholder="Minimo 4 digitos" maxLength={8} value={form.owner_pin || ''} onChange={e => setForm({...form, owner_pin: e.target.value})} />
              <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>El dueño lo puede cambiar despues desde Mi Gym</div>
            </div>
          </div>
        </Modal>
      )}

      {pinModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:360 }}>
            <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:8 }}>Resetear PIN</h3>
            <p style={{ color:'#64748b', fontSize:12, marginBottom:20 }}>{pinModal.name}</p>
            <label style={{ display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }}>Nuevo PIN</label>
            <input style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:18, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box', textAlign:'center', letterSpacing:6, marginBottom:20 }}
              placeholder="1234" maxLength={8} value={newPin} onChange={e => setNewPin(e.target.value)} />
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => { setPinModal(null); setNewPin('') }}
                style={{ flex:1, padding:'10px', background:'transparent', color:'#64748b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, cursor:'pointer', fontSize:13 }}>Cancelar</button>
              <button onClick={savePin} disabled={savingPin}
                style={{ flex:2, padding:'10px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
                {savingPin ? 'Guardando...' : 'Guardar PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
