import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'
import { useAuth } from '../AuthContext'

const CATEGORIES = ['General', 'Proteinas', 'Suplementos', 'Ropa', 'Accesorios', 'Bebidas', 'Snacks', 'Otros']

const Modal = ({ title, onClose, onSave, saving, error, children }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
    <div style={{ background:'#161616', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
      <h3 style={{ fontSize:18, fontWeight:600, color:'#f1f5f9', marginBottom:20 }}>{title}</h3>
      {error && <div style={{ background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>{error}</div>}
      {children}
      <div style={{ display:'flex', gap:12, marginTop:20 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
        <button className="btn btn-purple" onClick={onSave} disabled={saving} style={{ flex:2 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
)

export default function Inventory() {
  const { isOwner } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    API.get('/products/').then(r => setProducts(r.data)).finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setForm({ category: 'General', stock: 0, buy_price: 0 }); setEditProduct(null); setError(''); setModal(true) }
  const openEdit = (p) => { setForm({...p}); setEditProduct(p); setError(''); setModal(true) }

  const save = async () => {
    if (!form.name || !form.sell_price) return setError('Nombre y precio de venta son obligatorios')
    setSaving(true)
    try {
      if (editProduct) {
        const res = await API.patch(`/products/${editProduct.id}/`, form)
        setProducts(prev => prev.map(p => p.id === editProduct.id ? res.data : p))
      } else {
        const res = await API.post('/products/', form)
        setProducts(prev => [...prev, res.data])
      }
      setModal(false); setForm({})
    } catch (e) { setError(e.response?.data?.detail || 'Error al guardar') }
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Eliminar este producto?')) return
    await API.delete(`/products/${id}/`)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
  const totalValue = products.reduce((s, p) => s + (p.sell_price * p.stock), 0)

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div className="page-title" style={{ marginBottom:0 }}>Inventario</div>
          <button className="btn btn-purple" onClick={openAdd}>+ Agregar producto</button>
        </div>

        <div className="cards-grid" style={{ marginBottom:24 }}>
          <div className="card">
            <div className="card-label">Productos</div>
            <div className="card-value" style={{ color:'var(--gym-primary)' }}>{products.length}</div>
          </div>
          <div className="card">
            <div className="card-label">Valor inventario</div>
            <div className="card-value" style={{ color:'#34d399' }}>₡{totalValue.toLocaleString()}</div>
          </div>
          <div className="card">
            <div className="card-label">Stock bajo</div>
            <div className="card-value" style={{ color:'#f87171' }}>{products.filter(p => p.stock <= 3).length}</div>
            <div className="card-sub">menos de 3 unidades</div>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <input className="input" placeholder="Buscar producto..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ maxWidth:300 }} />
        </div>

        {loading ? <div className="loading">Cargando...</div> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
            {filtered.map(p => (
              <div key={p.id} style={{ background:'var(--bg3)', border:`1px solid ${p.stock <= 3 ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`, borderRadius:12, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:'#f1f5f9', marginBottom:2 }}>{p.name}</div>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(139,92,246,0.1)', color:'var(--gym-primary)', fontFamily:'DM Mono,monospace' }}>{p.category}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:16, fontWeight:600, color:'#34d399' }}>₡{p.sell_price?.toLocaleString()}</div>
                    <div style={{ fontSize:11, color:'#64748b' }}>costo: ₡{p.buy_price?.toLocaleString()}</div>
                  </div>
                </div>

                {p.description && <div style={{ fontSize:12, color:'#64748b', marginBottom:10 }}>{p.description}</div>}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontSize:12, color: p.stock <= 3 ? '#f87171' : '#94a3b8' }}>
                    Stock: <strong style={{ color: p.stock <= 3 ? '#f87171' : '#f1f5f9' }}>{p.stock}</strong>
                  </span>
                  {p.stock <= 3 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(248,113,113,0.1)', color:'#f87171' }}>Stock bajo</span>}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:11, padding:'6px' }} onClick={() => openEdit(p)}>Editar</button>
                  {isOwner && <button className="btn btn-red" style={{ fontSize:11, padding:'6px 10px' }} onClick={() => del(p.id)}>Eliminar</button>}
                </div>
              </div>
            ))}
            {!filtered.length && <div style={{ gridColumn:'1/-1', color:'#64748b', padding:40, textAlign:'center' }}>Sin productos</div>}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editProduct ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModal(false)} onSave={save} saving={saving} error={error}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Nombre *</label>
              <input className="input" placeholder="Proteina whey..." value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label className="label">Descripcion</label>
              <input className="input" placeholder="Descripcion opcional" value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div>
              <label className="label">Precio de venta (₡) *</label>
              <input className="input" type="number" placeholder="0" value={form.sell_price || ''} onChange={e => setForm({...form, sell_price: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="label">Precio de costo (₡)</label>
              <input className="input" type="number" placeholder="0" value={form.buy_price || ''} onChange={e => setForm({...form, buy_price: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input className="input" type="number" placeholder="0" value={form.stock || ''} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category || 'General'} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1', background:'#0a0a0a', borderRadius:10, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: form.alert_enabled ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#f1f5f9' }}>Alerta de stock bajo</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>Notificar en diagnostico cuando el stock baje</div>
                </div>
                <div onClick={() => setForm({...form, alert_enabled: !form.alert_enabled})}
                  style={{ width:44, height:24, borderRadius:12, background: form.alert_enabled ? 'var(--gym-primary)' : '#2a2a2a', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: form.alert_enabled ? 23 : 3, transition:'left 0.2s' }} />
                </div>
              </div>
              {form.alert_enabled && (
                <div>
                  <label className="label">Avisar cuando el stock llegue a</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input className="input" type="number" min="1" placeholder="5" value={form.alert_threshold || ''} onChange={e => setForm({...form, alert_threshold: parseInt(e.target.value)})} style={{ maxWidth:100 }} />
                    <span style={{ fontSize:13, color:'#64748b' }}>unidades o menos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
