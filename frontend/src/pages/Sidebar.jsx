import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useEffect, useState } from 'react'
import API from '../api'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isOwner, isEmployee, setRole } = useAuth()
  const [gym, setGym] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('gc_color')
    if (saved) applyColor(saved)
    API.get('/gyms/me').then(r => {
      setGym(r.data)
      applyColor(r.data.primary_color || '#8b5cf6')
      localStorage.setItem('gc_color', r.data.primary_color || '#8b5cf6')
    }).catch(() => {})
  }, [])

  const applyColor = (color) => {
    document.documentElement.style.setProperty('--gym-primary', color)
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0,2), 16)
    const g = parseInt(hex.slice(2,4), 16)
    const b = parseInt(hex.slice(4,6), 16)
    document.documentElement.style.setProperty('--gym-primary-rgb', `${r},${g},${b}`)
  }

  const ownerNav = [
    { path: '/',             icon: '▦', label: 'Dashboard' },
    { path: '/clientes',     icon: '👤', label: 'Clientes' },
    { path: '/inventario',   icon: '📦', label: 'Inventario' },
    { path: '/finanzas',     icon: '₡',  label: 'Finanzas' },
    { path: '/gastos',       icon: '−',  label: 'Gastos' },
    { path: '/reportes',     icon: '📊', label: 'Reportes' },
    { path: '/diagnostico',  icon: '⚡', label: 'Diagnostico' },
    { path: '/perfil-gym',   icon: '🏋️', label: 'Mi Gym' },
  ]

  const employeeNav = [
    { path: '/clientes',    icon: '👤', label: 'Clientes' },
    { path: '/ventas',      icon: '🛒', label: 'Ventas' },
    { path: '/inventario',  icon: '📦', label: 'Inventario' },
    { path: '/diagnostico', icon: '⚡', label: 'Diagnostico' },
  ]

  const nav = isOwner ? ownerNav : employeeNav
  const mobileNav = nav.slice(0, 5)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const switchRole = () => {
    setRole(null)
    navigate('/rol')
  }

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo" style={{ display:'flex', alignItems:'center', gap:10 }}>
          {gym?.logo_url && <img src={gym.logo_url} alt="logo" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }} />}
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{gym?.name || 'GymCore'}</span>
        </div>

        {isEmployee && (
          <div style={{ margin:'8px 12px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#fbbf24', fontFamily:'DM Mono,monospace', textAlign:'center', letterSpacing:1 }}>
            MODO EMPLEADO
          </div>
        )}

        <div className="sidebar-nav">
          {nav.map(n => (
            <a key={n.path} className={`nav-item ${location.pathname === n.path ? 'active' : ''}`}
              onClick={() => navigate(n.path)} style={{ cursor:'pointer' }}>
              <span style={{ fontSize:16 }}>{n.icon}</span>
              {n.label}
            </a>
          ))}
        </div>

        <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:13, color:'#f1f5f9', fontWeight:500, marginBottom:2 }}>{user?.name}</div>
          <div style={{ fontSize:11, color: isOwner ? 'var(--gym-primary)' : '#fbbf24', marginBottom:12, fontFamily:'DM Mono,monospace', letterSpacing:1 }}>
            {isOwner ? 'DUENO' : 'EMPLEADO'}
          </div>
          <button className="btn btn-ghost" onClick={switchRole} style={{ width:'100%', fontSize:11, marginBottom:8 }}>Cambiar rol</button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ width:'100%', fontSize:12 }}>Cerrar sesion</button>
        </div>
      </div>

      <div className="mobile-nav">
        {mobileNav.map(n => (
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
