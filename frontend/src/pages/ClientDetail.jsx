import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import API from '../api'

const FIELDS = [
  { key:'weight', label:'Peso (kg)', unit:'kg', lowerBetter:true },
  { key:'bicep', label:'Bíceps (cm)', unit:'cm', lowerBetter:false },
  { key:'chest', label:'Pecho (cm)', unit:'cm', lowerBetter:false },
  { key:'waist', label:'Cintura (cm)', unit:'cm', lowerBetter:true },
  { key:'hip', label:'Cadera (cm)', unit:'cm', lowerBetter:true },
  { key:'thigh', label:'Muslo (cm)', unit:'cm', lowerBetter:false },
  { key:'body_fat', label:'% Grasa', unit:'%', lowerBetter:true },
  { key:'muscle_mass', label:'Masa muscular (kg)', unit:'kg', lowerBetter:false },
]

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMeasForm, setShowMeasForm] = useState(false)
  const [measForm, setMeasForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState([])
  const [payForm, setPayForm] = useState({})
  const [showPayForm, setShowPayForm] = useState(false)

  useEffect(() => {
    Promise.all([
      API.get(`/clients/${id}/`),
      API.get(`/measurements/progress/${id}`),
      API.get('/dashboard/plans'),
    ]).then(([c, p, pl]) => {
      setClient(c.data)
      setProgress(p.data)
      setPlans(pl.data)
    }).finally(() => setLoading(false))
  }, [id])

  const [recommendations, setRecommendations] = useState(null)

  const getRecommendations = (goal, measForm, progress) => {
    const recs = []
    const goal_lower = (goal || '').toLowerCase()
    const isLoss = goal_lower.includes('perder') || goal_lower.includes('peso')
    const isMuscle = goal_lower.includes('músculo') || goal_lower.includes('musculo') || goal_lower.includes('ganar')
    const isPerformance = goal_lower.includes('rendimiento') || goal_lower.includes('deportivo')

    if (isLoss) {
      if (measForm.weight && progress?.progress?.weight) {
        const diff = measForm.weight - progress.progress.weight.last
        if (diff < 0) recs.push({ type:'success', msg:'Bajaste peso, vas por buen camino. Mantene la disciplina en la alimentacion.' })
        else if (diff > 0) recs.push({ type:'warning', msg:'Subiste un poco de peso. Revisá la alimentacion y aumenta el cardio.' })
        else recs.push({ type:'info', msg:'El peso se mantuvo. Seguí con el plan y sé consistente.' })
      }
      if (measForm.waist && progress?.progress?.waist) {
        const diff = measForm.waist - progress.progress.waist.last
        if (diff < 0) recs.push({ type:'success', msg:'La cintura bajó, señal de que estás perdiendo grasa abdominal.' })
        else if (diff > 0) recs.push({ type:'warning', msg:'La cintura subió. Reducí harinas y azúcares.' })
      }
      if (measForm.body_fat && progress?.progress?.body_fat) {
        const diff = measForm.body_fat - progress.progress.body_fat.last
        if (diff < 0) recs.push({ type:'success', msg:'El porcentaje de grasa bajó. Excelente progreso.' })
      }
      recs.push({ type:'info', msg:'Recomendacion: 3-4 dias de cardio por semana + deficit calorico moderado.' })
    }

    if (isMuscle) {
      if (measForm.weight && progress?.progress?.weight) {
        const diff = measForm.weight - progress.progress.weight.last
        if (diff > 0) recs.push({ type:'success', msg:'Subiste peso, buen progreso en masa. Asegurate que sea masa muscular.' })
        else if (diff < 0) recs.push({ type:'warning', msg:'Bajaste peso. Aumenta las calorias y proteina en la dieta.' })
      }
      if (measForm.muscle_mass && progress?.progress?.muscle_mass) {
        const diff = measForm.muscle_mass - progress.progress.muscle_mass.last
        if (diff > 0) recs.push({ type:'success', msg:'La masa muscular aumentó. Seguí con el entrenamiento de fuerza.' })
      }
      if (measForm.bicep && progress?.progress?.bicep) {
        const diff = measForm.bicep - progress.progress.bicep.last
        if (diff > 0) recs.push({ type:'success', msg:'Los brazos crecieron. El trabajo de bíceps está dando resultados.' })
      }
      recs.push({ type:'info', msg:'Recomendacion: 1.6-2g de proteína por kg de peso corporal al día.' })
    }

    if (isPerformance) {
      recs.push({ type:'info', msg:'Recomendacion: Enfocate en mejorar la técnica y aumentar progresivamente las cargas.' })
      if (measForm.body_fat) recs.push({ type:'info', msg:'Mantene el porcentaje de grasa bajo para mejor rendimiento deportivo.' })
    }

    if (!isLoss && !isMuscle && !isPerformance) {
      recs.push({ type:'info', msg:'Seguí con tu rutina actual. La consistencia es clave para ver resultados.' })
    }

    return recs
  }

  const saveMeasurement = async () => {
    setSaving(true)
    try {
      await API.post('/measurements/', { ...measForm, client_id: parseInt(id) })
      const p = await API.get(`/measurements/progress/${id}`)
      setProgress(p.data)
      const recs = getRecommendations(client.goal, measForm, p.data)
      setRecommendations(recs)
      setShowMeasForm(false); setMeasForm({})
    } catch {}
    setSaving(false)
  }

  const savePayment = async () => {
    if (!payForm.plan_id) return
    setSaving(true)
    try {
      const plan = plans.find(p => p.id === parseInt(payForm.plan_id))
      await API.post('/payments/', { client_id: parseInt(id), plan_id: parseInt(payForm.plan_id), amount: plan?.price || 0 })
      const c = await API.get(`/clients/${id}/`)
      setClient(c.data)
      setShowPayForm(false); setPayForm({})
    } catch {}
    setSaving(false)
  }

  const deleteClient = async () => {
    if (!confirm(`¿Eliminar a ${client.name}? Esta acción no se puede deshacer.`)) return
    try {
      await API.delete(`/clients/${id}/`)
      navigate('/clientes')
    } catch {}
  }

  if (loading) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Cargando...</div></div></div>
  if (!client) return <div className="layout"><Sidebar /><div className="main-content"><div className="loading">Cliente no encontrado</div></div></div>

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = client.membership_end && client.membership_end < today

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <button className="btn btn-ghost" onClick={() => navigate('/clientes')} style={{ marginBottom:16, fontSize:12 }}>← Volver</button>

        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
          <div className="avatar" style={{ width:56, height:56, fontSize:20 }}>{client.name.slice(0,2).toUpperCase()}</div>
          <div>
            <div style={{ fontSize:22, fontWeight:600, color:'#f1f5f9' }}>{client.name}</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>
              {client.age ? `${client.age} años · ` : ''}{client.goal || 'Sin objetivo'} · {client.months_as_client || 0} meses como cliente
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button className="btn btn-green" onClick={() => setShowPayForm(true)}>+ Pago membresía</button>
            <button className="btn btn-purple" onClick={() => setShowMeasForm(true)}>+ Avance</button>
            <button className="btn btn-red" onClick={deleteClient}>🗑️ Eliminar</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div className="section">
            <div className="section-title">Datos del cliente</div>
            {[
              ['Teléfono', client.phone],
              ['WhatsApp', client.whatsapp_number],
              ['Email', client.email],
              ['Peso inicial', client.weight ? `${client.weight} kg` : null],
              ['Altura', client.height ? `${client.height} cm` : null],
            ].map(([k,v]) => v ? (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
                <span style={{ color:'#64748b' }}>{k}</span>
                <span>{v}</span>
              </div>
            ) : null)}
          </div>

          <div className="section">
            <div className="section-title">Membresía</div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
              <span style={{ color:'#64748b' }}>Plan</span>
              <span>{client.membership_plans?.name || 'Sin plan'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
              <span style={{ color:'#64748b' }}>Inicio</span>
              <span>{client.membership_start || '—'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:13 }}>
              <span style={{ color:'#64748b' }}>Vencimiento</span>
              <span style={{ color: isOverdue ? '#f87171' : '#34d399' }}>{client.membership_end || '—'}</span>
            </div>
            {isOverdue && <div style={{ marginTop:12, background:'rgba(248,113,113,0.1)', color:'#f87171', borderRadius:8, padding:'8px 12px', fontSize:12 }}>⚠ Membresía vencida</div>}
          </div>
        </div>

        <div className="section">
          <div className="section-title">Progreso de medidas</div>
          {!progress?.progress
            ? <p style={{ color:'#64748b', fontSize:13 }}>Sin medidas registradas aún. Agregá el primer avance.</p>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12 }}>
                {FIELDS.map(f => {
                  const p = progress.progress[f.key]
                  if (!p) return null
                  return (
                    <div key={f.key} style={{ background:'#0a0a0a', borderRadius:10, padding:14 }}>
                      <div style={{ fontSize:10, color:'#64748b', marginBottom:6, fontFamily:'DM Mono,monospace', letterSpacing:1 }}>{f.label.toUpperCase()}</div>
                      <div style={{ fontSize:22, fontWeight:600, color: p.improved ? '#34d399' : '#f87171' }}>{p.last}{f.unit}</div>
                      <div style={{ fontSize:11, marginTop:4, color: p.improved ? '#34d399' : '#f87171' }}>
                        {p.diff > 0 ? '+' : ''}{p.diff}{f.unit} · {p.label}
                      </div>
                      <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>Inicial: {p.first}{f.unit}</div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>

        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="section" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div className="section-title" style={{ marginBottom:0 }}>Recomendaciones del avance</div>
              <button onClick={() => setRecommendations(null)} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18 }}>×</button>
            </div>
            {recommendations.map((r, i) => (
              <div key={i} style={{
                background: r.type === 'success' ? 'rgba(52,211,153,0.05)' : r.type === 'warning' ? 'rgba(251,191,36,0.05)' : 'rgba(96,165,250,0.05)',
                border: `1px solid ${r.type === 'success' ? 'rgba(52,211,153,0.2)' : r.type === 'warning' ? 'rgba(251,191,36,0.2)' : 'rgba(96,165,250,0.2)'}`,
                borderRadius:8, padding:'10px 14px', marginBottom:8, display:'flex', gap:10, alignItems:'flex-start'
              }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{r.type === 'success' ? '✓' : r.type === 'warning' ? '⚠' : 'ℹ'}</span>
                <span style={{ fontSize:13, color: r.type === 'success' ? '#34d399' : r.type === 'warning' ? '#fbbf24' : '#60a5fa', lineHeight:1.5 }}>{r.msg}</span>
              </div>
            ))}
          </div>
        )}

        {showMeasForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto' }}>
              <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>Registrar avance</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">Fecha</label>
                  <input className="input" type="date" value={measForm.date || new Date().toISOString().split('T')[0]} onChange={e => setMeasForm({...measForm, date: e.target.value})} />
                </div>
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input className="input" type="number" step="0.1" placeholder="0"
                      value={measForm[f.key] || ''} onChange={e => setMeasForm({...measForm, [f.key]: parseFloat(e.target.value)})} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label className="label">Notas</label>
                  <textarea className="input" placeholder="Observaciones del entrenador..." rows={2}
                    value={measForm.notes || ''} onChange={e => setMeasForm({...measForm, notes: e.target.value})} />
                </div>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:20 }}>
                <button className="btn btn-ghost" onClick={() => setShowMeasForm(false)} style={{ flex:1 }}>Cancelar</button>
                <button className="btn btn-purple" onClick={saveMeasurement} disabled={saving} style={{ flex:2 }}>
                  {saving ? 'Guardando...' : 'Guardar avance'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPayForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:400 }}>
              <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>Registrar pago de membresía</h3>
              <label className="label">Plan</label>
              <select className="input" style={{ marginBottom:20 }} value={payForm.plan_id || ''} onChange={e => setPayForm({...payForm, plan_id: e.target.value})}>
                <option value="">Seleccioná un plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₡{p.price.toLocaleString()} ({p.duration_days} días)</option>)}
              </select>
              <div style={{ display:'flex', gap:12 }}>
                <button className="btn btn-ghost" onClick={() => setShowPayForm(false)} style={{ flex:1 }}>Cancelar</button>
                <button className="btn btn-green" onClick={savePayment} disabled={saving} style={{ flex:2 }}>
                  {saving ? 'Procesando...' : 'Aprobar pago'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
