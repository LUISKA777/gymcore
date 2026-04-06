import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Landing() {
  const navigate = useNavigate()
  const [color, setColor] = useState('#8b5cf6')

  useEffect(() => {
    const saved = localStorage.getItem('gc_color')
    if (saved) setColor(saved)
  }, [])

  const features = [
    { icon: '👤', title: 'Clientes', desc: 'Registrá cada cliente con sus datos, medidas y progreso físico. Sabé quién está al día y quién tiene la membresía vencida.' },
    { icon: '₡', title: 'Finanzas', desc: 'Controlá ingresos, gastos y ganancia real del gym. Sabé exactamente cuánto estás ganando cada mes.' },
    { icon: '📊', title: 'Reportes', desc: 'Comparativas mensuales y anuales con gráficas. Tomá decisiones basadas en datos reales del negocio.' },
    { icon: '🛒', title: 'Ventas', desc: 'Vendé proteínas, accesorios y suplementos desde el sistema. Efectivo o SINPE, con recibo automático.' },
    { icon: '📦', title: 'Inventario', desc: 'Controlá el stock de tus productos con alertas cuando se estén agotando.' },
    { icon: '⚡', title: 'Diagnóstico', desc: 'El sistema te avisa quién está por vencer, quiénes son los morosos y te da recomendaciones para mejorar.' },
    { icon: '👥', title: 'Roles', desc: 'El dueño tiene acceso completo. El empleado solo ve lo que necesita. Cada quien en su lugar.' },
    { icon: '📱', title: 'Desde el celular', desc: 'Funciona en cualquier dispositivo. Tu gym en la palma de tu mano, desde cualquier lugar.' },
  ]

  const benefits = [
    { for: 'Dueño', color: '#8b5cf6', items: ['Ve cuánto gana el gym en tiempo real', 'Controlá gastos vs ingresos', 'Sabé qué clientes no han pagado', 'Proyección del próximo mes', 'Reportes comparativos anuales', 'PIN privado para tu acceso'] },
    { for: 'Empleado', color: '#34d399', items: ['Lista completa de clientes', 'Registrar medidas y avances', 'Hacer ventas de productos', 'Notificar clientes por WhatsApp', 'Ver diagnóstico del gym', 'Sin acceso a datos financieros'] },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#080808', color:'#f1f5f9', fontFamily:'Inter,sans-serif' }}>

      {/* Nav */}
      <div style={{ padding:'16px 32px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'rgba(8,8,8,0.95)', backdropFilter:'blur(10px)', zIndex:100 }}>
        <div style={{ fontSize:20, fontWeight:700, color }}>GymCore</div>
        <button onClick={() => navigate('/login')}
          style={{ background: color, color:'#fff', border:'none', borderRadius:8, padding:'9px 20px', cursor:'pointer', fontSize:13, fontWeight:500 }}>
          Iniciar sesión
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding:'80px 32px', textAlign:'center', maxWidth:700, margin:'0 auto', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ fontSize:11, letterSpacing:3, color, fontFamily:'DM Mono,monospace', textTransform:'uppercase', marginBottom:16 }}>Sistema de gestión para gyms</div>
        <h1 style={{ fontSize:48, fontWeight:700, lineHeight:1.1, marginBottom:20, color:'#f1f5f9' }}>
          Administrá tu gym<br/><span style={{ color }}>sin complicaciones</span>
        </h1>
        <p style={{ fontSize:17, color:'#94a3b8', lineHeight:1.7, marginBottom:36 }}>
          GymCore es el sistema todo en uno para gyms. Controlá clientes, cobros, inventario y finanzas desde cualquier dispositivo. Enfocate en entrenar — nosotros nos encargamos del resto.
        </p>
        <button onClick={() => navigate('/login')}
          style={{ background: color, color:'#fff', border:'none', borderRadius:10, padding:'14px 32px', cursor:'pointer', fontSize:15, fontWeight:600, marginRight:12 }}>
          Empezar ahora
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:1, background:'rgba(255,255,255,0.04)', margin:'0 32px', borderRadius:16, overflow:'hidden', marginBottom:80 }}>
        {[['Todo en uno','Sin apps extras'],['Multi-rol','Dueño y empleado'],['Tiempo real','Datos al instante'],['Desde el celular','iOS y Android']].map(([val,label]) => (
          <div key={val} style={{ padding:'24px', background:'#0d0d0d', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700, color, marginBottom:4 }}>{val}</div>
            <div style={{ fontSize:12, color:'#475569' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding:'0 32px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:11, letterSpacing:3, color, fontFamily:'DM Mono,monospace', textTransform:'uppercase', marginBottom:12 }}>Funciones</div>
          <h2 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9' }}>Todo lo que tu gym necesita</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {features.map(f => (
            <div key={f.title} style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'22px' }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:8, color:'#f1f5f9' }}>{f.title}</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div style={{ padding:'0 32px 80px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:11, letterSpacing:3, color, fontFamily:'DM Mono,monospace', textTransform:'uppercase', marginBottom:12 }}>Para quien es</div>
          <h2 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9' }}>Diseñado para todos en el gym</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {benefits.map(b => (
            <div key={b.for} style={{ background:'#111', border:`1px solid ${b.color}22`, borderRadius:16, padding:'28px' }}>
              <div style={{ fontSize:13, fontWeight:600, color: b.color, fontFamily:'DM Mono,monospace', letterSpacing:2, textTransform:'uppercase', marginBottom:20 }}>Para el {b.for}</div>
              {b.items.map(item => (
                <div key={item} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: b.color, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'#94a3b8' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'60px 32px 80px', textAlign:'center', background:'#0d0d0d', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize:28, fontWeight:700, color:'#f1f5f9', marginBottom:12 }}>Listo para empezar?</h2>
        <p style={{ fontSize:15, color:'#64748b', marginBottom:28 }}>Ingresá al sistema y comenzá a gestionar tu gym hoy.</p>
        <button onClick={() => navigate('/login')}
          style={{ background: color, color:'#fff', border:'none', borderRadius:10, padding:'14px 32px', cursor:'pointer', fontSize:15, fontWeight:600 }}>
          Entrar al sistema
        </button>
      </div>

      <div style={{ padding:'20px 32px', textAlign:'center', fontSize:11, color:'#334155', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        GymCore — Sistema de gestión para gyms
      </div>
    </div>
  )
}
