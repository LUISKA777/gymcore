import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

const PlanModal = ({ title, onClose, onSave, saving, form, setForm, type }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
    <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:400 }}>
      <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>{title}</h3>
      <div style={{ marginBottom:14 }}>
        <label className="label">Nombre</label>
        <input className="input" placeholder={type === 'matricula' ? 'Matricula estandar...' : 'Mensual, Trimestral...'} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
      </div>
      <div style={{ marginBottom:14 }}>
        <label className="label">Precio (₡)</label>
        <input className="input" type="number" placeholder="15000" value={form.price || ''} onChange={e => setForm({...form, price: parseInt(e.target.value)})} />
      </div>
      {type === 'membresia' && (
        <div style={{ marginBottom:20 }}>
          <label className="label">Duracion (dias)</label>
          <input className="input" type="number" placeholder="30" value={form.duration_days || ''} onChange={e => setForm({...form, duration_days: parseInt(e.target.value)})} />
        </div>
      )}
      <div style={{ display:'flex', gap:12 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
        <button className="btn btn-purple" onClick={onSave} disabled={saving} style={{ flex:2 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  </div>
)

export default function Finances() {
  const [payments, setPayments] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'membresia' | 'matricula'
  const [planForm, setPlanForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([API.get('/payments/'), API.get('/dashboard/plans')])
      .then(([p, pl]) => { setPayments(p.data); setPlans(pl.data) })
      .finally(() => setLoading(false))
  }, [])

  const savePlan = async () => {
    if (!planForm.name || !planForm.price) return
    if (modal === 'membresia' && !planForm.duration_days) return
    setSaving(true)
    try {
      const data = { ...planForm, type: modal, duration_days: planForm.duration_days || 0 }
      const res = await API.post('/dashboard/plans', data)
      setPlans(prev => [...prev, res.data])
      setModal(null); setPlanForm({})
    } catch {}
    setSaving(false)
  }

  const deletePlan = async (id) => {
    if (!confirm('Eliminar este plan?')) return
    try {
      await API.patch(`/dashboard/plans/${id}`, { active: false })
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch {}
  }

  const membresias = plans.filter(p => p.type !== 'matricula')
  const matriculas = plans.filter(p => p.type === 'matricula')
  const totalIncome = payments.reduce((s, p) => s + p.amount, 0)

  const PlanList = ({ items, type }) => (
    <div>
      {items.map(p => (
        <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:500 }}>{p.name}</div>
            {p.duration_days > 0 && <div style={{ fontSize:11, color:'#64748b' }}>{p.duration_days} dias</div>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#34d399' }}>₡{p.price.toLocaleString()}</div>
            <button className="btn btn-red" style={{ fontSize:11, padding:'4px 8px' }} onClick={() => deletePlan(p.id)}>✕</button>
          </div>
        </div>
      ))}
      {!items.length && <p style={{ color:'#64748b', fontSize:13 }}>Sin {type === 'matricula' ? 'matriculas' : 'planes'}. Agrega uno.</p>}
    </div>
  )

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="page-title" style={{ marginBottom:0 }}>Finanzas</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => { setPlanForm({ type:'matricula' }); setModal('matricula') }}>+ Matricula</button>
            <button className="btn btn-purple" onClick={() => { setPlanForm({ type:'membresia' }); setModal('membresia') }}>+ Plan membresia</button>
          </div>
        </div>

        <div className="cards-grid" style={{ marginBottom:24 }}>
          <div className="card">
            <div className="card-label">Total cobrado</div>
            <div className="card-value" style={{ color:'#34d399' }}>₡{totalIncome.toLocaleString()}</div>
            <div className="card-sub">{payments.length} pagos</div>
          </div>
          <div className="card">
            <div className="card-label">Planes activos</div>
            <div className="card-value" style={{ color:'var(--gym-primary)' }}>{membresias.length}</div>
          </div>
          <div className="card">
            <div className="card-label">Tipos de matricula</div>
            <div className="card-value" style={{ color:'#fbbf24' }}>{matriculas.length}</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div className="section">
            <div className="section-title">Planes de membresia</div>
            <PlanList items={membresias} type="membresia" />
          </div>
          <div className="section">
            <div className="section-title">Matriculas</div>
            <PlanList items={matriculas} type="matricula" />
          </div>
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

      {modal && (
        <PlanModal
          title={modal === 'matricula' ? 'Nueva matricula' : 'Nuevo plan de membresia'}
          type={modal}
          onClose={() => setModal(null)}
          onSave={savePlan}
          saving={saving}
          form={planForm}
          setForm={setPlanForm}
        />
      )}
    </div>
  )
}
