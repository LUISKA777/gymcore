import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import API from '../api'

export default function RoleSelect() {
  const { user, setRole } = useAuth()
  const navigate = useNavigate()
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const enterAsEmployee = () => {
    setRole('employee')
    navigate('/clientes')
  }

  const verifyPin = async () => {
    if (!pin) return setError('Ingresa el PIN')
    setLoading(true)
    try {
      const res = await API.get('/gyms/me')
      if (String(res.data.owner_pin).trim() === String(pin).trim()) {
        setRole('owner')
        navigate('/dashboard')
      } else {
        setError('PIN incorrecto')
      }
    } catch { setError('Error al verificar') }
    setLoading(false)
  }

  const primary = localStorage.getItem('gc_color') || '#8b5cf6'

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:700, color: primary, letterSpacing:2 }}>GymWep</div>
        <div style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Bienvenido, {user?.name}</div>
      </div>

      {!showPin ? (
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ fontSize:16, fontWeight:500, color:'#f1f5f9' }}>Como queres entrar?</div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <button onClick={() => setShowPin(true)}
              style={{ background:'#111', border:`2px solid ${primary}`, borderRadius:16, padding:'24px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, textAlign:'left', transition:'all 0.2s' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${primary}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🏋️</div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:'#f1f5f9', marginBottom:2 }}>Soy el Dueno</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Acceso completo al sistema</div>
              </div>
              <div style={{ marginLeft:'auto', color: primary, fontSize:18 }}>›</div>
            </button>

            <button onClick={enterAsEmployee}
              style={{ background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'24px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, textAlign:'left' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'rgba(148,163,184,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>👤</div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:'#f1f5f9', marginBottom:2 }}>Soy Empleado</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Clientes, ventas y diagnostico</div>
              </div>
              <div style={{ marginLeft:'auto', color:'#475569', fontSize:18 }}>›</div>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ width:'100%', maxWidth:360, background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'32px 28px' }}>
          <button onClick={() => { setShowPin(false); setPin(''); setError('') }}
            style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:13, marginBottom:20, padding:0 }}>
            ← Volver
          </button>
          <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>PIN del dueno</h3>
          <p style={{ color:'#64748b', fontSize:12, marginBottom:24 }}>Ingresa tu PIN privado para acceder</p>

          {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{error}</div>}

          <input
            type="password"
            placeholder="••••••"
            maxLength={8}
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verifyPin()}
            style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:24, padding:'12px 14px', width:'100%', outline:'none', textAlign:'center', letterSpacing:8, boxSizing:'border-box', marginBottom:20 }}
          />

          <button onClick={verifyPin} disabled={loading}
            style={{ width:'100%', padding:'12px', background: primary, color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' }}>
            {loading ? 'Verificando...' : 'Entrar como dueno'}
          </button>
        </div>
      )}
    </div>
  )
}
