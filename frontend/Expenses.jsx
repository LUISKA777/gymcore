import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'

const CATEGORIES = ['Luz', 'Alquiler', 'Empleados', 'Equipos', 'Mantenimiento', 'Marketing', 'Limpieza', 'Internet', 'Otros']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    API.get('/expenses').then(r => setExpenses(r.data)).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!form.category || !form.amount) return
    setSaving(true)
    try {
      const res = await API.post('/expenses', form)
      setExpenses(prev => [res.data, ...prev])
      setModal(false); setForm({})
    } catch {}
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await API.delete(`/expenses/${id}`)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  })).filter(x => x.total > 0)

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="page-title" style={{ marginBottom:0 }}>Gastos</div>
          <button className="btn btn-purple" onClick={() => { setForm({}); setModal(true) }}>+ Agregar gasto</button>
        </div>

        <div className="cards-grid" style={{ marginBottom:24 }}>
          <div className="card">
            <div className="card-label">Total gastos</div>
            <div className="card-value" style={{ color:'#f87171' }}>₡{total.toLocaleString()}</div>
            <div className="card-sub">{expenses.length} registros</div>
          </div>
          {byCategory.slice(0,3).map(c => (
            <div key={c.cat} className="card">
              <div className="card-label">{c.cat}</div>
              <div className="card-value" style={{ color:'#fbbf24' }}>₡{c.total.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {loading ? <div className="loading">Cargando...</div> : (
          <div className="section">
            <table className="table">
              <thead>
                <tr>{['Categoría','Descripción','Fecha','Monto',''].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td><span className="pill pill-amber">{e.category}</span></td>
                    <td style={{ color:'#94a3b8' }}>{e.description || '—'}</td>
                    <td style={{ fontFamily:'DM Mono,monospace', fontSize:12, color:'#64748b' }}>{e.expense_date}</td>
                    <td style={{ fontWeight:600, color:'#f87171' }}>₡{e.amount.toLocaleString()}</td>
                    <td>
                      <button className="btn btn-red" style={{ fontSize:11, padding:'4px 10px' }} onClick={() => del(e.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!expenses.length && <div style={{ color:'#64748b', padding:20, textAlign:'center' }}>Sin gastos registrados</div>}
          </div>
        )}

        {modal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:400 }}>
              <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>Nuevo gasto</h3>
              <div style={{ marginBottom:14 }}>
                <label className="label">Categoría</label>
                <select className="input" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Seleccioná una categoría</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="label">Descripción (opcional)</label>
                <input className="input" placeholder="Ej: Factura eléctrica abril" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="label">Monto (₡)</label>
                <input className="input" type="number" placeholder="25000" value={form.amount || ''} onChange={e => setForm({...form, amount: parseInt(e.target.value)})} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label className="label">Fecha</label>
                <input className="input" type="date" value={form.expense_date || new Date().toISOString().split('T')[0]} onChange={e => setForm({...form, expense_date: e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)} style={{ flex:1 }}>Cancelar</button>
                <button className="btn btn-purple" onClick={save} disabled={saving} style={{ flex:2 }}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
