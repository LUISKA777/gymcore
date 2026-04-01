import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Finances from './pages/Finances'
import Expenses from './pages/Expenses'
import Diagnosis from './pages/Diagnosis'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color:'#a78bfa', padding:40, fontFamily:'monospace' }}>Cargando...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/clientes/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
          <Route path="/finanzas" element={<PrivateRoute><Finances /></PrivateRoute>} />
          <Route path="/gastos" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/diagnostico" element={<PrivateRoute><Diagnosis /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
