import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function Bar({ value, max, color, label, height = 80 }) {
  const pct = max > 0 ? Math.max((value / max) * height, value > 0 ? 6 : 2) : 2
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
      <div style={{ fontSize:10, color, fontFamily:'DM Mono,monospace' }}>
        {value > 0 ? `₡${(value/1000).toFixed(0)}k` : ''}
      </div>
      <div style={{ width:'100%', display:'flex', alignItems:'flex-end', height }}>
        <div style={{ width:'100%', background: color, borderRadius:'4px 4px 0 0', height: pct, transition:'height 0.4s ease' }} />
      </div>
      <div style={{ fontSize:10, color:'#64748b', fontFamily:'DM Mono,monospace' }}>{label}</div>
    </div>
  )
}

function PctChange({ current, previous, label }) {
  if (!previous) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize:13, color:'#94a3b8' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:13, color:'#f1f5f9' }}>₡{current.toLocaleString()}</span>
        <span style={{ fontSize:12, padding:'2px 8px', borderRadius:20, background: up ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: up ? '#34d399' : '#f87171' }}>
          {up ? '+' : ''}{pct}%
        </span>
      </div>
    </div>
  )
}

export default function Reports() {
  const [dashboard, setDashboard] = useState(null)
  const [annual, setAnnual] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('monthly')
  const today = new Date()

  useEffect(() => {
    Promise.all([API.get('/dashboard/'), API.get('/dashboard/annual')])
      .then(([d, a]) => { setDashboard(d.data); setAnnual(a.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Cargando reportes...</div></div></div>

  const monthly = dashboard?.monthly_chart || []
  const last6 = monthly.slice(-6)
  const maxIncome = Math.max(...last6.map(m => m.income), 1)
  const maxExpenses = Math.max(...last6.map(m => m.expenses || 0), 1)

  const thisMonth = monthly[monthly.length - 1] || {}
  const lastMonth = monthly[monthly.length - 2] || {}
  const threeMonthsAgo = monthly[monthly.length - 4] || {}

  const currentYear = annual?.find(y => y.year === today.getFullYear())
  const previousYear = annual?.find(y => y.year === today.getFullYear() - 1)

  const navStyle = (t) => ({
    padding:'10px 20px', cursor:'pointer', border:'none',
    background: tab === t ? 'rgba(var(--gym-primary-rgb),0.1)' : 'none',
    color: tab === t ? 'var(--gym-primary)' : '#64748b',
    borderBottom: tab === t ? '2px solid var(--gym-primary)' : '2px solid transparent',
    fontFamily:'DM Mono,monospace', fontSize:11, letterSpacing:2, textTransform:'uppercase',
  })

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-title">Reportes</div>

        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
          <button style={navStyle('monthly')} onClick={() => setTab('monthly')}>Mensual</button>
          <button style={navStyle('annual')} onClick={() => setTab('annual')}>Anual</button>
          <button style={navStyle('compare')} onClick={() => setTab('compare')}>Comparativo</button>
        </div>

        {tab === 'monthly' && (
          <>
            <div className="cards-grid" style={{ marginBottom:24 }}>
              {[
                ['Ingresos este mes', thisMonth.income || 0, '#34d399'],
                ['Gastos este mes', thisMonth.expenses || 0, '#f87171'],
                ['Ganancia neta', thisMonth.net || 0, (thisMonth.net || 0) >= 0 ? '#34d399' : '#f87171'],
                ['Proyeccion prox. mes', dashboard?.projected_income || 0, '#60a5fa'],
              ].map(([label, val, color]) => (
                <div key={label} className="card">
                  <div className="card-label">{label}</div>
                  <div className="card-value" style={{ color }}>₡{val.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="section" style={{ marginBottom:16 }}>
              <div className="section-title">Ingresos vs gastos — ultimos 6 meses</div>
              <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:120, marginBottom:8 }}>
                {last6.map((m, i) => (
                  <div key={i} style={{ flex:1, display:'flex', gap:2, alignItems:'flex-end', height:120 }}>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:9, color:'#34d399', fontFamily:'DM Mono,monospace' }}>
                        {m.income > 0 ? `₡${(m.income/1000).toFixed(0)}k` : ''}
                      </div>
                      <div style={{ width:'100%', background:'#8b5cf6', borderRadius:'3px 3px 0 0', height: Math.max((m.income/maxIncome)*90, m.income > 0 ? 4 : 1), transition:'height 0.4s' }} />
                    </div>
                    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:9, color:'#f87171', fontFamily:'DM Mono,monospace' }}>
                        {m.expenses > 0 ? `₡${(m.expenses/1000).toFixed(0)}k` : ''}
                      </div>
                      <div style={{ width:'100%', background:'rgba(248,113,113,0.4)', borderRadius:'3px 3px 0 0', height: Math.max(((m.expenses||0)/maxIncome)*90, (m.expenses||0) > 0 ? 4 : 1), transition:'height 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {last6.map((m, i) => (
                  <div key={i} style={{ flex:1, textAlign:'center', fontSize:10, color:'#64748b', fontFamily:'DM Mono,monospace' }}>{m.month}</div>
                ))}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:'#8b5cf6' }} />
                  <span style={{ fontSize:11, color:'#64748b' }}>Ingresos</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:'rgba(248,113,113,0.4)' }} />
                  <span style={{ fontSize:11, color:'#64748b' }}>Gastos</span>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-title">Variacion mensual</div>
              <PctChange current={thisMonth.income || 0} previous={lastMonth.income} label="Ingresos vs mes anterior" />
              <PctChange current={thisMonth.income || 0} previous={threeMonthsAgo.income} label="Ingresos vs hace 3 meses" />
              <PctChange current={thisMonth.expenses || 0} previous={lastMonth.expenses} label="Gastos vs mes anterior" />
              <PctChange current={thisMonth.net || 0} previous={lastMonth.net} label="Ganancia neta vs mes anterior" />
            </div>
          </>
        )}

        {tab === 'annual' && currentYear && (
          <>
            <div className="cards-grid" style={{ marginBottom:24 }}>
              {[
                ['Ingresos totales', currentYear.total, '#34d399'],
                ['Promedio mensual', Math.round(currentYear.total / Math.max(currentYear.months.length, 1)), '#a78bfa'],
                ['Mejor mes', Math.max(...currentYear.months.map(m => m.income)), '#fbbf24'],
              ].map(([label, val, color]) => (
                <div key={label} className="card">
                  <div className="card-label">{label} {currentYear.year}</div>
                  <div className="card-value" style={{ color }}>₡{val.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="section-title">Ingresos por mes — {currentYear.year}</div>
              <div style={{ overflowX:'auto' }}>
                <table className="table" style={{ minWidth:600 }}>
                  <thead>
                    <tr>
                      {['Mes','Ingresos','Gastos','Ganancia neta','% del total'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {currentYear.months.map((m, i) => {
                      const pct = currentYear.total > 0 ? ((m.income / currentYear.total) * 100).toFixed(1) : 0
                      const isBest = m.income === Math.max(...currentYear.months.map(x => x.income))
                      return (
                        <tr key={i} style={{ background: isBest ? 'rgba(52,211,153,0.04)' : 'none' }}>
                          <td style={{ fontWeight: isBest ? 600 : 400 }}>
                            {m.month} {isBest && <span style={{ fontSize:10, color:'#34d399', marginLeft:4 }}>★ mejor</span>}
                          </td>
                          <td style={{ color:'#34d399', fontWeight:500 }}>₡{m.income.toLocaleString()}</td>
                          <td style={{ color:'#f87171' }}>₡{m.expenses.toLocaleString()}</td>
                          <td style={{ color: m.net >= 0 ? '#34d399' : '#f87171', fontWeight:500 }}>₡{m.net.toLocaleString()}</td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ flex:1, height:6, background:'#1a1a1a', borderRadius:3 }}>
                                <div style={{ width:`${pct}%`, height:'100%', background:'var(--gym-primary)', borderRadius:3 }} />
                              </div>
                              <span style={{ fontSize:11, color:'#64748b', minWidth:32, fontFamily:'DM Mono,monospace' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'compare' && currentYear && previousYear && (
          <>
            <div className="cards-grid" style={{ marginBottom:24 }}>
              {[
                ['Total ' + previousYear.year, previousYear.total, '#64748b'],
                ['Total ' + currentYear.year, currentYear.total, '#34d399'],
                ['Diferencia', currentYear.total - previousYear.total, (currentYear.total - previousYear.total) >= 0 ? '#34d399' : '#f87171'],
              ].map(([label, val, color]) => (
                <div key={label} className="card">
                  <div className="card-label">{label}</div>
                  <div className="card-value" style={{ color }}>
                    {typeof val === 'number' && val > 0 ? '+' : ''}₡{val.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="section">
              <div className="section-title">Comparacion mes a mes</div>
              <div style={{ overflowX:'auto' }}>
                <table className="table" style={{ minWidth:500 }}>
                  <thead>
                    <tr>
                      {['Mes', previousYear.year + '', currentYear.year + '', 'Cambio'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHS.map((month, i) => {
                      const prev = previousYear.months.find(m => m.month_num === i + 1)
                      const curr = currentYear.months.find(m => m.month_num === i + 1)
                      if (!prev && !curr) return null
                      const prevInc = prev?.income || 0
                      const currInc = curr?.income || 0
                      const diff = currInc - prevInc
                      const pct = prevInc > 0 ? Math.round((diff / prevInc) * 100) : null
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight:500 }}>{month}</td>
                          <td style={{ color:'#64748b' }}>₡{prevInc.toLocaleString()}</td>
                          <td style={{ color:'#34d399' }}>₡{currInc.toLocaleString()}</td>
                          <td>
                            {pct !== null ? (
                              <span style={{ fontSize:12, padding:'2px 8px', borderRadius:20, background: diff >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: diff >= 0 ? '#34d399' : '#f87171' }}>
                                {diff >= 0 ? '+' : ''}{pct}%
                              </span>
                            ) : <span style={{ color:'#475569', fontSize:12 }}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'compare' && (!currentYear || !previousYear) && (
          <div className="section">
            <p style={{ color:'#64748b', fontSize:13 }}>No hay suficientes datos para comparar anos. Necesitas datos de al menos 2 anos.</p>
          </div>
        )}
      </div>
    </div>
  )
}
