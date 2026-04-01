import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

export default function Diagnosis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const sendWhatsApp = (client) => {
    const num = client.whatsapp_number
    if (!num) return alert('Este cliente no tiene WhatsApp registrado')
    const msg = `¡Hola ${client.name}! 💪 Tu membresía venció. ¡Renovála hoy y seguí entrenando fuerte! 🏋️ Contáctanos para más info.`
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Analizando...</div></div></div>

  const d = data || {}
  const diag = d.diagnosis || {}

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-title">Diagnóstico del negocio</div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
          <div className="card" style={{ borderColor: diag.high_overdue ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{diag.high_overdue ? '⚠' : '✓'}</div>
            <div style={{ fontSize:14, fontWeight:500, color: diag.high_overdue ? '#f87171' : '#34d399', marginBottom:4 }}>
              {diag.high_overdue ? 'Alta morosidad' : 'Morosidad normal'}
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>
              {d.overdue_clients || 0} clientes morosos de {d.active_clients || 0} activos
            </div>
          </div>

          <div className="card" style={{ borderColor: diag.low_retention ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{diag.low_retention ? '↓' : '↑'}</div>
            <div style={{ fontSize:14, fontWeight:500, color: diag.low_retention ? '#fbbf24' : '#34d399', marginBottom:4 }}>
              {diag.low_retention ? 'Riesgo de pérdida' : 'Buena retención'}
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>
              {d.expiring_soon?.length || 0} clientes vencen esta semana
            </div>
          </div>

          <div className="card" style={{ borderColor: diag.income_growing ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{diag.income_growing ? '↑' : '↓'}</div>
            <div style={{ fontSize:14, fontWeight:500, color: diag.income_growing ? '#34d399' : '#f87171', marginBottom:4 }}>
              {diag.income_growing ? 'Ingresos en alza' : 'Ingresos a la baja'}
            </div>
            <div style={{ fontSize:12, color:'#64748b' }}>
              ₡{(d.income_this_month || 0).toLocaleString()} este mes vs ₡{(d.income_last_month || 0).toLocaleString()} anterior
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="section">
            <div className="section-title">Lista de morosos</div>
            {!d.overdue_list?.length
              ? <p style={{ color:'#64748b', fontSize:13 }}>No hay clientes morosos 🎉</p>
              : d.overdue_list.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div className="avatar" style={{ background:'rgba(248,113,113,0.1)', color:'#f87171' }}>{c.name.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#f87171' }}>Venció: {c.membership_end}</div>
                  </div>
                  <button className="btn btn-green" style={{ fontSize:11, padding:'5px 10px' }} onClick={() => sendWhatsApp(c)}>WhatsApp</button>
                </div>
              ))
            }
          </div>

          <div className="section">
            <div className="section-title">Recomendaciones</div>
            {diag.high_overdue && (
              <div style={{ background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#f87171', marginBottom:4 }}>Reducir morosidad</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Enviá recordatorios de WhatsApp a los morosos y ofrecé facilidades de pago.</div>
              </div>
            )}
            {diag.low_retention && (
              <div style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#fbbf24', marginBottom:4 }}>Mejorar retención</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Contactá a los clientes que están por vencer antes de que se vayan.</div>
              </div>
            )}
            {!diag.income_growing && (
              <div style={{ background:'rgba(248,113,113,0.05)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:8, padding:12, marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#f87171', marginBottom:4 }}>Ingresos cayendo</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Revisá los gastos y buscá nuevos clientes para revertir la tendencia.</div>
              </div>
            )}
            {!diag.high_overdue && !diag.low_retention && diag.income_growing && (
              <div style={{ background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:8, padding:12 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'#34d399', marginBottom:4 }}>Todo en orden 🎉</div>
                <div style={{ fontSize:12, color:'#64748b' }}>Tu gym está funcionando bien. Seguí así.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
