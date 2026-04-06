import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import API from '../api'

const GymIcon = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:40, height:40, opacity:0.15 }}>
    <rect x="8" y="34" width="8" height="12" rx="2" fill="currentColor"/>
    <rect x="64" y="34" width="8" height="12" rx="2" fill="currentColor"/>
    <rect x="16" y="28" width="6" height="24" rx="2" fill="currentColor"/>
    <rect x="58" y="28" width="6" height="24" rx="2" fill="currentColor"/>
    <rect x="22" y="36" width="36" height="8" rx="2" fill="currentColor"/>
  </svg>
)

const PersonIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width:32, height:32, opacity:0.2 }}>
    <circle cx="20" cy="10" r="6" fill="currentColor"/>
    <path d="M8 36c0-6.627 5.373-12 12-12h0c6.627 0 12 5.373 12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

const TrendIcon = ({ up }) => (
  <svg viewBox="0 0 24 24" fill="none" style={{ width:16, height:16 }}>
    {up
      ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    }
  </svg>
)

function MetricCard({ label, value, sub, color, icon, trend, trendUp, accentBg }) {
  return (
    <div style={{ background: accentBg || '#111', border:`1px solid rgba(255,255,255,0.06)`, borderRadius:16, padding:'20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:16, top:16, color }}>
        {icon}
      </div>
      <div style={{ fontSize:10, letterSpacing:2, color:'#475569', textTransform:'uppercase', fontFamily:'DM Mono,monospace', marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:700, color, lineHeight:1, marginBottom:6 }}>{value}</div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {trend !== undefined && (
          <span style={{ color: trendUp ? '#34d399' : '#f87171', display:'flex', alignItems:'center' }}>
            <TrendIcon up={trendUp} />
          </span>
        )}
        <span style={{ fontSize:11, color:'#64748b' }}>{sub}</span>
      </div>
    </div>
  )
}

function MiniBar({ value, max, color }) {
  const h = max > 0 ? Math.max((value / max) * 60, value > 0 ? 4 : 2) : 2
  return <div style={{ width:'100%', background: color, borderRadius:'3px 3px 0 0', height: h, transition:'height 0.4s ease' }} />
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [gym, setGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([API.get('/dashboard/'), API.get('/gyms/me')])
      .then(([d, g]) => { setData(d.data); setGym(g.data) })
      .finally(() => setLoading(false))
    const interval = setInterval(() => API.get('/dashboard/').then(r => setData(r.data)), 60000)
    return () => clearInterval(interval)
  }, [])

  const sendWhatsApp = (client) => {
    const num = client.whatsapp_number
    if (!num) return alert('Este cliente no tiene WhatsApp registrado')
    const gymName = gym?.name || 'el gym'
    const msg = `Hola ${client.name}! Te escribimos desde ${gymName} para avisarte que tu membresia vence pronto. Renovala y segui entrenando fuerte!`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <div className="main-content"><div className="loading">Cargando...</div></div>
    </div>
  )

  const d = data || {}
  const monthly = d.monthly_chart || []
  const last6 = monthly.slice(-6)
  const maxIncome = Math.max(...last6.map(m => m.income), 1)
  const incomeChange = d.income_last_month > 0
    ? Math.round(((d.income_this_month - d.income_last_month) / d.income_last_month) * 100) : 0
  const retentionRate = d.active_clients > 0
    ? Math.round(((d.active_clients - d.overdue_clients) / d.active_clients) * 100) : 100

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">

        {/* Hero banner */}
        <div style={{ background:`linear-gradient(135deg, #0d0d0d 0%, rgba(var(--gym-primary-rgb),0.12) 100%)`, border:'1px solid rgba(var(--gym-primary-rgb),0.2)', borderRadius:20, padding:'24px 28px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', right:40, top:'50%', transform:'translateY(-50%)', opacity:0.06 }}>
            <svg viewBox="0 0 200 120" fill="none" style={{ width:200 }}>
              <rect x="10" y="45" width="20" height="30" rx="4" fill="white"/>
              <rect x="170" y="45" width="20" height="30" rx="4" fill="white"/>
              <rect x="30" y="30" width="16" height="60" rx="4" fill="white"/>
              <rect x="154" y="30" width="16" height="60" rx="4" fill="white"/>
              <rect x="46" y="50" width="108" height="20" rx="4" fill="white"/>
              <circle cx="70" cy="15" r="10" fill="white"/>
              <path d="M55 95 Q70 85 85 95" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="130" cy="15" r="10" fill="white"/>
              <path d="M115 95 Q130 85 145 95" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:13, color:'rgba(var(--gym-primary-rgb),1)', fontFamily:'DM Mono,monospace', letterSpacing:2, marginBottom:6, textTransform:'uppercase' }}>Panel de control</div>
            <div style={{ fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>{gym?.name || 'GymCore'}</div>
            <div style={{ fontSize:13, color:'#64748b' }}>
              {d.active_clients || 0} clientes activos · {d.overdue_clients || 0} morosos · retencion {retentionRate}%
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'#475569', fontFamily:'DM Mono,monospace', letterSpacing:1, marginBottom:4 }}>INGRESOS ESTE MES</div>
            <div style={{ fontSize:36, fontWeight:700, color:'#34d399' }}>₡{(d.income_this_month || 0).toLocaleString()}</div>
            <div style={{ fontSize:12, color: incomeChange >= 0 ? '#34d399' : '#f87171' }}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange}% vs mes anterior
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
          <MetricCard label="Clientes activos" value={d.active_clients || 0}
            sub={`+${d.new_clients || 0} este mes`} color="var(--gym-primary)"
            icon={<PersonIcon />} />
          <MetricCard label="Morosos" value={d.overdue_clients || 0}
            sub="membresias vencidas" color="#f87171"
            icon={<svg viewBox="0 0 24 24" fill="none" style={{ width:28, height:28, opacity:0.2 }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>} />
          <MetricCard label="Ganancia real" value={`₡${(d.net_income || 0).toLocaleString()}`}
            sub="ingresos menos gastos" color={(d.net_income || 0) >= 0 ? '#34d399' : '#f87171'}
            trend={incomeChange} trendUp={incomeChange >= 0}
            icon={<GymIcon />} />
          <MetricCard label="Proyeccion" value={`₡${(d.projected_income || 0).toLocaleString()}`}
            sub="proximo mes estimado" color="#60a5fa"
            icon={<svg viewBox="0 0 24 24" fill="none" style={{ width:28, height:28, opacity:0.2 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
          <MetricCard label="Gastos del mes" value={`₡${(d.total_expenses || 0).toLocaleString()}`}
            sub="gastos registrados" color="#fbbf24" />
          <MetricCard label="Retencion" value={`${retentionRate}%`}
            sub="clientes al dia" color={retentionRate >= 80 ? '#34d399' : '#fbbf24'}
            trendUp={retentionRate >= 80} />
        </div>

        {/* Alert */}
        {d.overdue_clients > 0 && (
          <div style={{ background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(248,113,113,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚠</div>
              <div>
                <div style={{ color:'#f87171', fontSize:14, fontWeight:500 }}>{d.overdue_clients} clientes con membresia vencida</div>
                <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>{d.overdue_list?.slice(0,3).map(c => c.name).join(', ')}{d.overdue_clients > 3 ? ` +${d.overdue_clients - 3} mas` : ''}</div>
              </div>
            </div>
            <button onClick={() => navigate('/clientes')} style={{ background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:12, fontWeight:500 }}>Ver lista</button>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {/* Chart */}
          <div className="section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="section-title" style={{ marginBottom:0 }}>Ingresos — 6 meses</div>
              <button onClick={() => navigate('/reportes')} style={{ background:'none', border:'none', color:'var(--gym-primary)', fontSize:11, cursor:'pointer', fontFamily:'DM Mono,monospace', letterSpacing:1 }}>VER REPORTES →</button>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:8 }}>
              {last6.map((m, i) => (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:9, color:'#34d399', fontFamily:'DM Mono,monospace' }}>
                    {m.income > 0 ? `₡${(m.income/1000).toFixed(0)}k` : ''}
                  </div>
                  <MiniBar value={m.income} max={maxIncome} color="var(--gym-primary)" />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {last6.map((m, i) => (
                <div key={i} style={{ flex:1, textAlign:'center', fontSize:9, color:'#64748b', fontFamily:'DM Mono,monospace' }}>{m.month}</div>
              ))}
            </div>
          </div>

          {/* Clientes en riesgo */}
          <div className="section">
            <div className="section-title">Por vencer esta semana</div>
            {!d.expiring_soon?.length
              ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:32, marginBottom:8, opacity:0.3 }}>✓</div>
                  <div style={{ color:'#64748b', fontSize:13 }}>Nadie vence esta semana</div>
                </div>
              )
              : d.expiring_soon.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(251,191,36,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#fbbf24', flexShrink:0 }}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#fbbf24' }}>Vence: {c.membership_end}</div>
                  </div>
                  <button onClick={() => sendWhatsApp(c)} style={{ background:'rgba(37,211,102,0.1)', color:'#25D366', border:'1px solid rgba(37,211,102,0.2)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:11, fontWeight:500 }}>WhatsApp</button>
                </div>
              ))
            }
          </div>

          {/* Top clientes */}
          <div className="section">
            <div className="section-title">Top clientes</div>
            {!d.top_clients?.length
              ? <p style={{ color:'#64748b', fontSize:13 }}>Sin datos aun</p>
              : d.top_clients.map((c, i) => (
                <div key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}>
                  <div style={{ width:22, fontSize:11, color:'#475569', fontFamily:'DM Mono,monospace', textAlign:'center' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                  </div>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(var(--gym-primary-rgb),0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'var(--gym-primary)', flexShrink:0 }}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>{c.months_as_client || 0} meses</div>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(var(--gym-primary-rgb),0.1)', color:'var(--gym-primary)', fontFamily:'DM Mono,monospace' }}>VIP</span>
                </div>
              ))
            }
          </div>

          {/* Morosos */}
          <div className="section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="section-title" style={{ marginBottom:0 }}>Morosos</div>
              {d.overdue_list?.length > 0 && (
                <button onClick={() => d.overdue_list.forEach((c,i) => {
                  if (c.whatsapp_number) setTimeout(() => {
                    const msg = `Hola ${c.name}! Tu membresia en ${gym?.name || 'el gym'} ha vencido. Renovala hoy y segui entrenando!`
                    window.open(`https://wa.me/${c.whatsapp_number}?text=${encodeURIComponent(msg)}`, '_blank')
                  }, i * 1500)
                })} style={{ background:'rgba(37,211,102,0.1)', color:'#25D366', border:'1px solid rgba(37,211,102,0.2)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:11 }}>
                  Notificar todos
                </button>
              )}
            </div>
            {!d.overdue_list?.length
              ? (
                <div style={{ textAlign:'center', padding:'20px 0' }}>
                  <div style={{ fontSize:32, marginBottom:8, opacity:0.3 }}>🎉</div>
                  <div style={{ color:'#64748b', fontSize:13 }}>Sin morosos</div>
                </div>
              )
              : d.overdue_list.slice(0,5).map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(248,113,113,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#f87171', flexShrink:0 }}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#f87171' }}>Vencio: {c.membership_end}</div>
                  </div>
                  {c.whatsapp_number && (
                    <button onClick={() => sendWhatsApp(c)} style={{ background:'rgba(37,211,102,0.1)', color:'#25D366', border:'1px solid rgba(37,211,102,0.2)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:11 }}>WhatsApp</button>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
