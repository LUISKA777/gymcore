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
    const saved = localStorage.getItem('gc_color')
    if (saved) {
      document.documentElement.style.setProperty('--gym-primary', saved)
      const hex = saved.replace('#', '')
      const r = parseInt(hex.slice(0,2), 16)
      const g = parseInt(hex.slice(2,4), 16)
      const b = parseInt(hex.slice(4,6), 16)
      document.documentElement.style.setProperty('--gym-primary-rgb', `${r},${g},${b}`)
    }
    API.get('/gyms/me').then(r => {
      setGym(r.data)
      const color = r.data.primary_color || '#8b5cf6'
      document.documentElement.style.setProperty('--gym-primary', color)
      const hex = color.replace('#', '')
      const rv = parseInt(hex.slice(0,2), 16)
      const gv = parseInt(hex.slice(2,4), 16)
      const bv = parseInt(hex.slice(4,6), 16)
      document.documentElement.style.setProperty('--gym-primary-rgb', `${rv},${gv},${bv}`)
      localStorage.setItem('gc_color', color)
    }).catch(() => {})
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" style={{ display:'flex', alignItems:'center', gap:10 }}>
          {gym?.logo_url && (
            <img src={gym.logo_url} alt="logo" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }} />
          )}
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{gym?.name || 'GymCore'}</span>
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
          <div style={{ fontSize:11, color:'#64748b', marginBottom:12, overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</div>
          <button className="btn btn-ghost" onClick={() => { logout(); navigate('/login') }}
            style={{ width:'100%', fontSize:12 }}>Cerrar sesión</button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        {NAV.slice(0, 5).map(n => (
          <a key={n.path} className={`mobile-nav-item ${location.pathname === n.path ? 'active' : ''}`}
            onClick={() => navigate(n.path)}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span>{n.label}</span>
          </a>
        ))}
      </div>
    </>
  )
}

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
