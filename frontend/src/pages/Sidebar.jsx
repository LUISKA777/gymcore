import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useEffect, useState } from 'react'
import API from '../api'

const NAV = [
  { path: '/',            icon: '▦', label: 'Dashboard' },
  { path: '/clientes',    icon: '👤', label: 'Clientes' },
  { path: '/finanzas',    icon: '₡', label: 'Finanzas' },
  { path: '/gastos',      icon: '−', label: 'Gastos' },
  { path: '/diagnostico', icon: '⚡', label: 'Diagnóstico' },
  { path: '/perfil-gym',  icon: '🏋️', label: 'Mi Gym' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [gym, setGym] = useState(null)

  useEffect(() => {
    API.get('/gyms/me').then(r => setGym(r.data)).catch(() => {})
  }, [])

  return (
    <div className="sidebar">
      <div className="sidebar-logo" style={{ display:'flex', alignItems:'center', gap:10 }}>
        {gym?.logo_url && (
          <img src={gym.logo_url} alt="logo" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }} />
        )}
        <span>{gym?.name || 'GymCore'}</span>
      </div>
      <div className="sidebar-nav">
        {NAV.map(n => (
          <a key={n.path} className={`nav-item ${location.pathname === n.path ? 'active' : ''}`}
            onClick={() => navigate(n.path)} style={{ cursor:'pointer' }}>
            <span style={{ fontSize:16 }}>{n.icon}</span>
            {n.label}
          </a>
        ))}
      </div>
      <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:13, color:'#f1f5f9', fontWeight:500, marginBottom:4 }}>{user?.name}</div>
        <div style={{ fontSize:11, color:'#64748b', marginBottom:12 }}>{user?.email}</div>
        <button className="btn btn-ghost" onClick={() => { logout(); navigate('/login') }}
          style={{ width:'100%', fontSize:12 }}>Cerrar sesión</button>
      </div>
    </div>
  )
}
