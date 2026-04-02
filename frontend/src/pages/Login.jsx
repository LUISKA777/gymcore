import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import API from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async () => {
    if (!email || !password) return setError('Completá email y contraseña')
    setError('')
    setLoading(true)
    try {
      const res = await API.post('/auth/login', { email, password })
      login({ name: res.data.name, email: res.data.email, role: res.data.role, gym_id: res.data.gym_id }, res.data.token)
      navigate(res.data.role === 'admin' ? '/super-admin' : '/')
    } catch (e) {
      setError(e.response?.data?.detail || 'Credenciales incorrectas')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:28, fontWeight:700, color:'#a78bfa', letterSpacing:2 }}>GymCore</div>
        <div style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Sistema de gestión para gyms</div>
      </div>

      <div style={{ width:'100%', maxWidth:380, background:'#111', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'32px 28px' }}>
        <h2 style={{ fontSize:22, fontWeight:600, color:'#f1f5f9', marginBottom:4 }}>Iniciar sesión</h2>
        <p style={{ color:'#64748b', fontSize:12, marginBottom:28 }}>Accedé a tu panel de gym</p>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ marginBottom:16 }}>
          <label className="label">Correo electrónico</label>
          <input className="input" type="email" placeholder="gym@correo.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        <div style={{ marginBottom:24 }}>
          <label className="label">Contraseña</label>
          <input className="input" type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        <button className="btn btn-purple" onClick={submit} disabled={loading}
          style={{ width:'100%', padding:'12px', fontSize:14 }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}
