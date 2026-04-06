import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import API from '../api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    API.get('/dashboard/').then(r => setData(r.data)).finally(() => setLoading(false))
    const interval = setInterval(() => API.get('/dashboard/').then(r => setData(r.data)), 60000)
    return () => clearInterval(interval)
  }, [])

  const sendWhatsApp = (client) => {
    const num = client.whatsapp_number
    if (!num) return alert('Este cliente no tiene WhatsApp registrado')
    const msg = `¡Hola ${client.name}! 💪 Te recordamos que tu membresía vence mañana. ¡Renovála y seguí alcanzando tus metas! 🏋️`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <div className="main-content"><div className="loading">Cargando dashboard...</div></div>
    </div>
  )

  const d = data || {}
  const incomeChange = d.income_last_month > 0
    ? Math.round(((d.income_this_month - d.income_last_month) / d.income_last_month) * 100)
    : 0

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-title">Dashboard</div>

        <div className="cards-grid">
          <div className="card">
            <div className="card-label">Clientes activos</div>
            <div className="card-value" style={{ color:'#a78bfa' }}>{d.active_clients || 0}</div>
            <div className="card-sub">+{d.new_clients || 0} este mes</div>
          </div>
          <div className="card">
            <div className="card-label">Ingresos del mes</div>
            <div className="card-value" style={{ color:'#34d399' }}>₡{(d.income_this_month || 0).toLocaleString()}</div>
            <div className="card-sub" style={{ color: incomeChange >= 0 ? '#34d399' : '#f87171' }}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange}% vs mes anterior
            </div>
          </div>
          <div className="card">
            <div className="card-label">Morosos</div>
            <div className="card-value" style={{ color:'#f87171' }}>{d.overdue_clients || 0}</div>
            <div className="card-sub">membresías vencidas</div>
          </div>
          <div className="card">
            <div className="card-label">Ganancia real</div>
            <div className="card-value" style={{ color: (d.net_income || 0) >= 0 ? '#34d399' : '#f87171' }}>
              ₡{(d.net_income || 0).toLocaleString()}
            </div>
            <div className="card-sub">Ingresos − gastos</div>
          </div>
          <div className="card">
            <div className="card-label">Proyección próx. mes</div>
            <div className="card-value" style={{ color:'#60a5fa' }}>₡{(d.projected_income || 0).toLocaleString()}</div>
            <div className="card-sub">Basado en promedio</div>
          </div>
          <div className="card">
            <div className="card-label">Total gastos</div>
            <div className="card-value" style={{ color:'#fbbf24' }}>₡{(d.total_expenses || 0).toLocaleString()}</div>
            <div className="card-sub">Este mes</div>
          </div>
        </div>

        {d.overdue_clients > 0 && (
          <div className="alert-box">
            <div>
              <div style={{ color:'#f87171', fontSize:14, fontWeight:500, marginBottom:4 }}>
                💰 Morosos actuales — {d.overdue_clients} clientes
              </div>
              <div style={{ color:'#64748b', fontSize:12 }}>
                {d.overdue_list?.slice(0,3).map(c => c.name).join(', ')}{d.overdue_clients > 3 ? ` y ${d.overdue_clients - 3} más` : ''}
              </div>
            </div>
            <button className="btn btn-red" onClick={() => navigate('/clientes')}>Ver lista</button>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="section">
            <div className="section-title">Clientes en riesgo — vencen pronto</div>
            {!d.expiring_soon?.length
              ? <p style={{ color:'#64748b', fontSize:13 }}>No hay clientes por vencer esta semana</p>
              : d.expiring_soon.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="avatar">{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>Vence: {c.membership_end}</div>
                  </div>
                  <button className="btn btn-green" style={{ fontSize:11, padding:'5px 10px' }}
                    onClick={() => sendWhatsApp(c)}>WhatsApp</button>
                </div>
              ))
            }
          </div>

          <div className="section">
            <div className="section-title">Top clientes</div>
            {!d.top_clients?.length
              ? <p style={{ color:'#64748b', fontSize:13 }}>Sin datos aún</p>
              : d.top_clients.map((c, i) => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' }}
                  onClick={() => navigate(`/clientes/${c.id}`)}>
                  <div style={{ width:24, fontSize:12, color:'#64748b', fontFamily:'DM Mono,monospace' }}>#{i+1}</div>
                  <div className="avatar">{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{c.months_as_client || 0} meses como cliente</div>
                  </div>
                  <span className="pill pill-purple">VIP</span>
                </div>
              ))
            }
          </div>

          <div className="section" style={{ gridColumn:'1/-1' }}>
            <div className="section-title">Ingresos últimos 6 meses</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
              {(d.monthly_chart || []).map((m, i) => {
                const max = Math.max(...(d.monthly_chart || []).map(x => x.income), 1)
                const h = max > 0 ? Math.max((m.income / max) * 100, m.income > 0 ? 8 : 3) : 3
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:10, color:'#34d399', fontFamily:'DM Mono,monospace' }}>
                      {m.income > 0 ? `₡${(m.income/1000).toFixed(0)}k` : ''}
                    </div>
                    <div style={{ width:'100%', background: m.income > 0 ? '#8b5cf6' : '#1e1e1e', borderRadius:'4px 4px 0 0', height:`${h}%`, minHeight:4, transition:'height 0.3s' }} />
                    <div style={{ fontSize:10, color:'#64748b', fontFamily:'DM Mono,monospace' }}>{m.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
