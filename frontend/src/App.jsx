import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './pages/Login'
import RoleSelect from './pages/RoleSelect'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Finances from './pages/Finances'
import Expenses from './pages/Expenses'
import Diagnosis from './pages/Diagnosis'
import GymProfile from './pages/GymProfile'
import SuperAdmin from './pages/SuperAdmin'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'

function PrivateRoute({ children, ownerOnly }) {
  const { user, role, isOwner, loading } = useAuth()
  if (loading) return <div style={{ color:'#a78bfa', padding:40, fontFamily:'monospace' }}>Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (!role) return <Navigate to="/rol" />
  if (ownerOnly && !isOwner) return <Navigate to="/clientes" />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  if (user.role !== 'admin') return <Navigate to="/" />
  return children
}

function RoleRoute({ children }) {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" />
  if (role) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/rol" element={<RoleRoute><RoleSelect /></RoleRoute>} />
          <Route path="/super-admin" element={<AdminRoute><SuperAdmin /></AdminRoute>} />
          <Route path="/" element={<PrivateRoute ownerOnly><Dashboard /></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/clientes/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
          <Route path="/ventas" element={<PrivateRoute><Sales /></PrivateRoute>} />
          <Route path="/inventario" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/finanzas" element={<PrivateRoute ownerOnly><Finances /></PrivateRoute>} />
          <Route path="/gastos" element={<PrivateRoute ownerOnly><Expenses /></PrivateRoute>} />
          <Route path="/diagnostico" element={<PrivateRoute><Diagnosis /></PrivateRoute>} />
          <Route path="/perfil-gym" element={<PrivateRoute ownerOnly><GymProfile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
