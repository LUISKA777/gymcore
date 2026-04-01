import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const NAV = [
  { path: '/',           icon: '▦', label: 'Dashboard' },
  { path: '/clientes',   icon: '👤', label: 'Clientes' },
  { path: '/finanzas',   icon: '₡', label: 'Finanzas' },
  { path: '/gastos',     icon: '−', label: 'Gastos' },
  { path: '/diagnostico',icon: '⚡', label: 'Diagnóstico' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="sidebar">
      <div className="sidebar-logo">GymCore</div>
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
