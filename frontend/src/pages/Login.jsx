import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import API from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')
  const [code, setCode] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [msg, setMsg] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async () => {
    if (!email || !password) return setError('Completa email y contrasena')
    setError(''); setLoading(true)
    try {
      const res = await API.post('/auth/login', { email, password })
      login({ name: res.data.name, email: res.data.email, role: res.data.role, gym_id: res.data.gym_id }, res.data.token)
      navigate(res.data.role === 'admin' ? '/super-admin' : '/rol')
    } catch (e) { setError(e.response?.data?.detail || 'Credenciales incorrectas') }
    setLoading(false)
  }

  const sendCode = async () => {
    if (!email) return setError('Ingresa tu email')
    setError(''); setLoading(true)
    try {
      const res = await API.post('/auth/forgot-password', { email, password: '' })
      if (res.data.whatsapp_number && res.data.code) {
        const num = res.data.whatsapp_number
        const gymName = res.data.name
        const msg = `GymWep - Codigo de verificacion\n\nHola ${gymName}!\n\nTu codigo para cambiar la contrasena es:\n\n*${res.data.code}*\n\nEste codigo es de uso unico. Si no solicitaste este cambio, ignoralo.`
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
        setMsg('Se abrio WhatsApp con tu codigo. Ingresalo abajo.')
        setMode('reset')
      } else {
        setMsg('Si el correo existe recibiras el codigo por WhatsApp')
        setMode('reset')
      }
    } catch (e) { setError(e.response?.data?.detail || 'Error al enviar codigo') }
    setLoading(false)
  }

  const resetPass = async () => {
    if (!code || !newPass) return setError('Completa todos los campos')
    if (newPass !== confirmPass) return setError('Las contrasenas no coinciden')
    if (newPass.length < 6) return setError('Minimo 6 caracteres')
    setError(''); setLoading(true)
    try {
      await API.post('/auth/reset-password', { email, code, new_password: newPass })
      setMsg('Contrasena actualizada. Ya podes ingresar.')
      setMode('login')
      setCode(''); setNewPass(''); setConfirmPass('')
    } catch (e) { setError(e.response?.data?.detail || 'Codigo invalido') }
    setLoading(false)
  }

  const inp = { background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#f1f5f9', fontSize:13, padding:'10px 14px', width:'100%', outline:'none', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:10, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:6, fontFamily:'DM Mono,monospace' }

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:700, color:'#a78bfa', letterSpacing:2 }}>GymWep</div>
        <div style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Sistema de gestion para gyms</div>
      </div>

      <div style={{ width:'100%', maxWidth:380, background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'32px 28px' }}>

        {mode === 'login' && <>
          <h2 style={{ fontSize:22, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>Iniciar sesion</h2>
          <p style={{ color:'#64748b', fontSize:12, marginBottom:28 }}>Accede a tu panel de gym</p>
          {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{error}</div>}
          {msg && <div style={{ background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{msg}</div>}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Correo electronico</label>
            <input style={inp} type="email" placeholder="gym@correo.com" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Contrasena</label>
            <input style={inp} type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <button onClick={submit} disabled={loading}
            style={{ width:'100%', padding:'12px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <div style={{ textAlign:'center', marginTop:16 }}>
            <span onClick={() => { setMode('forgot'); setError(''); setMsg('') }}
              style={{ color:'#64748b', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
              Olvide mi contrasena
            </span>
          </div>
        </>}

        {mode === 'forgot' && <>
          <h2 style={{ fontSize:22, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>Recuperar contrasena</h2>
          <p style={{ color:'#64748b', fontSize:12, marginBottom:28 }}>Te enviaremos el codigo por WhatsApp</p>
          {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{error}</div>}
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Correo electronico</label>
            <input style={inp} type="email" placeholder="gym@correo.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>
          <button onClick={sendCode} disabled={loading}
            style={{ width:'100%', padding:'12px', background:'#25D366', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' }}>
            {loading ? 'Enviando...' : 'Enviar codigo por WhatsApp'}
          </button>
          <div style={{ textAlign:'center', marginTop:16 }}>
            <span onClick={() => setMode('login')} style={{ color:'#64748b', fontSize:12, cursor:'pointer' }}>Volver al login</span>
          </div>
        </>}

        {mode === 'reset' && <>
          <h2 style={{ fontSize:22, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>Nueva contrasena</h2>
          <p style={{ color:'#64748b', fontSize:12, marginBottom:28 }}>Ingresa el codigo que recibiste por WhatsApp</p>
          {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{error}</div>}
          {msg && <div style={{ background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{msg}</div>}
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Codigo de verificacion</label>
            <input style={{ ...inp, textAlign:'center', fontSize:28, letterSpacing:10, fontWeight:700 }}
              placeholder="000000" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={lbl}>Nueva contrasena</label>
            <input style={inp} type="password" placeholder="Minimo 6 caracteres" value={newPass}
              onChange={e => setNewPass(e.target.value)} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Confirmar contrasena</label>
            <input style={inp} type="password" placeholder="Repetir contrasena" value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)} />
          </div>
          <button onClick={resetPass} disabled={loading}
            style={{ width:'100%', padding:'12px', background:'#8b5cf6', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' }}>
            {loading ? 'Actualizando...' : 'Cambiar contrasena'}
          </button>
          <div style={{ textAlign:'center', marginTop:16 }}>
            <span onClick={() => setMode('forgot')} style={{ color:'#64748b', fontSize:12, cursor:'pointer' }}>Reenviar codigo</span>
          </div>
        </>}
      </div>
    </div>
  )
}
