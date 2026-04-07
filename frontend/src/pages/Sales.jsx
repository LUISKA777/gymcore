import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import API from '../api'
import { useAuth } from '../AuthContext'

export default function Sales() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState('efectivo')
  const [sinpeRef, setSinpeRef] = useState('')
  const [processing, setProcessing] = useState(false)
  const [summary, setSummary] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [tab, setTab] = useState('vender')

  useEffect(() => {
    Promise.all([
      API.get('/products/'),
      API.get('/sales/summary'),
      API.get('/sales/'),
    ]).then(([p, s, r]) => {
      setProducts(p.data)
      setSummary(s.data)
      setRecentSales(r.data.slice(0, 20))
    })
  }, [])

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        if (existing.qty >= product.stock) return prev
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { product_id: product.id, name: product.name, qty: 1, price: product.sell_price, stock: product.stock }]
    })
    setSearch('')
  }

  const updateQty = (productId, qty) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product_id !== productId)); return }
    const product = products.find(p => p.id === productId)
    if (qty > product?.stock) return
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, qty } : i))
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const confirmSale = async () => {
    if (!cart.length) return
    setProcessing(true)
    try {
      const res = await API.post('/sales/', {
        items: cart.map(i => ({ product_id: i.product_id, name: i.name, qty: i.qty, price: i.price })),
        total,
        payment_method: payment,
        sinpe_ref: sinpeRef || null,
        created_by: user?.name,
      })
      setReceipt({ ...res.data, items: cart, payment, sinpeRef })
      setCart([])
      setSinpeRef('')
      const [s, r, p] = await Promise.all([API.get('/sales/summary'), API.get('/sales/'), API.get('/products/')])
      setSummary(s.data)
      setRecentSales(r.data.slice(0, 20))
      setProducts(p.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al procesar venta')
    }
    setProcessing(false)
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  ).slice(0, 6)

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
        <div className="page-title">Ventas</div>

        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
          <button style={navStyle('vender')} onClick={() => setTab('vender')}>Nueva venta</button>
          <button style={navStyle('historial')} onClick={() => setTab('historial')}>Historial</button>
        </div>

        {tab === 'vender' && (
          <>
            <div className="cards-grid" style={{ marginBottom:24 }}>
              <div className="card">
                <div className="card-label">Ventas hoy</div>
                <div className="card-value" style={{ color:'var(--gym-primary)' }}>{summary?.today_count || 0}</div>
              </div>
              <div className="card">
                <div className="card-label">Total hoy</div>
                <div className="card-value" style={{ color:'#34d399' }}>₡{(summary?.today_total || 0).toLocaleString()}</div>
              </div>
              <div className="card">
                <div className="card-label">Efectivo</div>
                <div className="card-value" style={{ color:'#fbbf24' }}>₡{(summary?.today_efectivo || 0).toLocaleString()}</div>
              </div>
              <div className="card">
                <div className="card-label">SINPE</div>
                <div className="card-value" style={{ color:'#60a5fa' }}>₡{(summary?.today_sinpe || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20 }}>
              <div>
                <div className="section">
                  <div className="section-title">Buscar producto</div>
                  <input className="input" placeholder="Nombre del producto..." value={search}
                    onChange={e => setSearch(e.target.value)} style={{ marginBottom:14 }} />
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
                    {(search ? filtered : products.filter(p => p.stock > 0).slice(0, 12)).map(p => (
                      <div key={p.id} onClick={() => addToCart(p)}
                        style={{ background:'#0a0a0a', border:'1px solid var(--border)', borderRadius:10, padding:12, cursor:'pointer', transition:'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gym-primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{p.name}</div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:14, fontWeight:600, color:'#34d399' }}>₡{p.sell_price?.toLocaleString()}</span>
                          <span style={{ fontSize:11, color:'#64748b' }}>x{p.stock}</span>
                        </div>
                      </div>
                    ))}
                    {!products.filter(p => p.stock > 0).length && <p style={{ color:'#64748b', fontSize:13 }}>Sin productos con stock</p>}
                  </div>
                </div>
              </div>

              <div className="section" style={{ height:'fit-content' }}>
                <div className="section-title">Carrito</div>
                {!cart.length
                  ? <p style={{ color:'#64748b', fontSize:13, marginBottom:16 }}>Selecciona productos</p>
                  : cart.map(item => (
                    <div key={item.product_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{item.name}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>₡{item.price?.toLocaleString()} c/u</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button onClick={() => updateQty(item.product_id, item.qty - 1)}
                          style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'#0a0a0a', color:'#f1f5f9', cursor:'pointer', fontSize:16 }}>−</button>
                        <span style={{ minWidth:24, textAlign:'center', fontSize:14, fontWeight:500 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.product_id, item.qty + 1)}
                          style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'#0a0a0a', color:'#f1f5f9', cursor:'pointer', fontSize:16 }}>+</button>
                      </div>
                      <div style={{ minWidth:70, textAlign:'right', fontSize:13, fontWeight:600, color:'#34d399' }}>
                        ₡{(item.price * item.qty).toLocaleString()}
                      </div>
                    </div>
                  ))
                }

                <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700, color:'#f1f5f9', marginBottom:16 }}>
                    <span>Total</span>
                    <span style={{ color:'#34d399' }}>₡{total.toLocaleString()}</span>
                  </div>

                  <div style={{ marginBottom:12 }}>
                    <label className="label">Metodo de pago</label>
                    <div style={{ display:'flex', gap:8 }}>
                      {['efectivo','sinpe'].map(m => (
                        <button key={m} onClick={() => setPayment(m)}
                          style={{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:500, textTransform:'uppercase', fontFamily:'DM Mono,monospace',
                            background: payment === m ? 'var(--gym-primary)' : '#1a1a1a',
                            color: payment === m ? '#fff' : '#64748b' }}>
                          {m === 'efectivo' ? 'Efectivo' : 'SINPE'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {payment === 'sinpe' && (
                    <div style={{ marginBottom:12 }}>
                      <label className="label">Referencia SINPE</label>
                      <input className="input" placeholder="Ultimos 4 digitos" value={sinpeRef}
                        onChange={e => setSinpeRef(e.target.value)} />
                    </div>
                  )}

                  <button onClick={confirmSale} disabled={!cart.length || processing}
                    style={{ width:'100%', padding:'12px', background: cart.length ? 'var(--gym-primary)' : '#1a1a1a', color: cart.length ? '#fff' : '#64748b', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor: cart.length ? 'pointer' : 'default' }}>
                    {processing ? 'Procesando...' : 'Confirmar venta'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'historial' && (
          <div className="section">
            <div className="section-title">Ventas recientes</div>
            <table className="table">
              <thead>
                <tr>{['Fecha','Items','Total','Pago','Vendedor'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recentSales.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'#64748b' }}>{new Date(s.created_at).toLocaleString('es-CR')}</td>
                    <td style={{ fontSize:12 }}>{s.items?.length} producto(s)</td>
                    <td style={{ fontWeight:600, color:'#34d399' }}>₡{s.total?.toLocaleString()}</td>
                    <td>
                        <span className={`pill ${s.payment_method === 'sinpe' ? 'pill-blue' : 'pill-green'}`}>{s.payment_method}</span>
                         {s.sinpe_ref && <span style={{ fontSize:11, color:'#64748b', marginLeft:6 }}>#{s.sinpe_ref}</span>}
                    </td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{s.created_by || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recentSales.length && <div style={{ color:'#64748b', padding:20, textAlign:'center' }}>Sin ventas aun</div>}
          </div>
        )}
      </div>

      {receipt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, width:'100%', maxWidth:360 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:20, fontWeight:700, color:'#34d399' }}>Venta exitosa</div>
            </div>
            <div style={{ background:'#0a0a0a', borderRadius:10, padding:16, marginBottom:16 }}>
              {receipt.items?.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0' }}>
                  <span>{item.name} x{item.qty}</span>
                  <span style={{ color:'#34d399' }}>₡{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:16 }}>
                <span>Total</span>
                <span style={{ color:'#34d399' }}>₡{receipt.total?.toLocaleString()}</span>
              </div>
              <div style={{ marginTop:8, fontSize:12, color:'#64748b', textAlign:'center' }}>
                {receipt.payment === 'sinpe' ? `SINPE — ref: ${receipt.sinpeRef || '—'}` : 'Efectivo'}
              </div>
            </div>
            <button onClick={() => setReceipt(null)} className="btn btn-purple" style={{ width:'100%', padding:'12px' }}>
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
