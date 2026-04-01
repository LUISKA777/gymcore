import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

export default function Finances() {
  const [payments, setPayments] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([API.get('/payments'), API.get('/dashboard/plans')])
      .then(([p, pl]) => { setPayments(p.data); setPlans(pl.data) })
      .finally(() => setLoading(false))
  }, [])

  const savePlan = async () => {
    if (!planForm.name || !planForm.price || !planForm.duration_days) return
    setSaving(true)
    try {
      const res = await API.post('/dashboard/plans', planForm)
      setPlans(prev => [...prev, res.data])
      setShowPlanModal(false); setPlanForm({})
    } catch {}
    setSaving(false)
  }

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="page-title" style={{ marginBottom:0 }}>Finanzas</div>
          <button className="btn btn-purple" onClick={() => setShowPlanModal(true)}>+ Plan membresía</button>
        </div>

        <div className="cards-grid" style={{ marginBottom:24 }}>
          <div className="card">
            <div className="card-label">Total cobrado</div>
            <div className="card-value" style={{ color:'#34d399' }}>₡{totalIncome.toLocaleString()}</div>
            <div className="card-sub">{payments.length} pagos registrados</div>
          </div>
          <div className="card">
            <div className="card-label">Planes activos</div>
            <div className="card-value" style={{ color:'#a78bfa' }}>{plans.length}</div>
            <div className="card-sub">tipos de membresía</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div className="section">
            <div className="section-title">Planes de membresía</div>
            {plans.map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{p.duration_days} días</div>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:'#34d399' }}>₡{p.price.toLocaleString()}</div>
              </div>
            ))}
            {!plans.length && <p style={{ color:'#64748b', fontSize:13 }}>Sin planes. Agregá uno.</p>}
          </div>

          <div className="section">
            <div className="section-title">Pagos recientes</div>
            {loading ? <div className="loading">Cargando...</div> : payments.slice(0,10).map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{p.clients?.name}</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{p.membership_plans?.name} · {new Date(p.paid_at).toLocaleDateString('es-CR')}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:600, color:'#34d399' }}>₡{p.amount.toLocaleString()}</div>
              </div>
            ))}
            {!payments.length && <p style={{ color:'#64748b', fontSize:13 }}>Sin pagos registrados</p>}
          </div>
        </div>

        {showPlanModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:400 }}>
              <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>Nuevo plan de membresía</h3>
              <div style={{ marginBottom:14 }}>
                <label className="label">Nombre del plan</label>
                <input className="input" placeholder="Mensual, Trimestral..." value={planForm.name || ''} onChange={e => setPlanForm({...planForm, name: e.target.value})} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="label">Precio (₡)</label>
                <input className="input" type="number" placeholder="15000" value={planForm.price || ''} onChange={e => setPlanForm({...planForm, price: parseInt(e.target.value)})} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label className="label">Duración (días)</label>
                <input className="input" type="number" placeholder="30" value={planForm.duration_days || ''} onChange={e => setPlanForm({...planForm, duration_days: parseInt(e.target.value)})} />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button className="btn btn-ghost" onClick={() => setShowPlanModal(false)} style={{ flex:1 }}>Cancelar</button>
                <button className="btn btn-purple" onClick={savePlan} disabled={saving} style={{ flex:2 }}>
                  {saving ? 'Guardando...' : 'Guardar plan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
