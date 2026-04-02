import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Finances from './pages/Finances'
import Expenses from './pages/Expenses'
import Diagnosis from './pages/Diagnosis'
import GymProfile from './pages/GymProfile'
import SuperAdmin from './pages/SuperAdmin'

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ color:'#a78bfa', padding:40, fontFamily:'monospace' }}>Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin" element={<PrivateRoute adminOnly><SuperAdmin /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/clientes/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
          <Route path="/finanzas" element={<PrivateRoute><Finances /></PrivateRoute>} />
          <Route path="/gastos" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/diagnostico" element={<PrivateRoute><Diagnosis /></PrivateRoute>} />
          <Route path="/perfil-gym" element={<PrivateRoute><GymProfile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
