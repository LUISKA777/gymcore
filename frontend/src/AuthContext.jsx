import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRoleState] = useState(null) // 'owner' | 'employee'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('gc_user')
    const savedRole = sessionStorage.getItem('gc_role')
    if (saved) setUser(JSON.parse(saved))
    if (savedRole) setRoleState(savedRole)
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('gc_token', token)
    localStorage.setItem('gc_user', JSON.stringify(userData))
    setUser(userData)
    setRoleState(null)
    sessionStorage.removeItem('gc_role')
  }

  const setRole = (r) => {
    sessionStorage.setItem('gc_role', r)
    setRoleState(r)
  }

  const logout = () => {
    localStorage.removeItem('gc_token')
    localStorage.removeItem('gc_user')
    sessionStorage.removeItem('gc_role')
    setUser(null)
    setRoleState(null)
  }

  const isOwner = role === 'owner'
  const isEmployee = role === 'employee'

  return (
    <AuthContext.Provider value={{ user, role, setRole, login, logout, loading, isOwner, isEmployee }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
