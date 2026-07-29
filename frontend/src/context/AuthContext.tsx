import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api, { getErrorMessage } from '../services/api'
import { AuthResponse, Role, User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function loadStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function persistAuth(data: AuthResponse) {
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  const user: User = {
    userId: data.userId,
    name: data.name,
    email: data.email,
    role: data.role
  }
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(loadStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  // On mount, validate the stored token against the backend rather than
  // trusting localStorage blindly. If the token is stale (e.g. the user
  // no longer exists after a database reset) or expired, clear the
  // session instead of leaving the UI in a false "logged in" state.
  useEffect(() => {
    const token = localStorage.getItem('accessToken')

    if (!token) {
      setIsLoading(false)
      return
    }

    api
      .get<User>('/auth/me')
      .then(({ data }) => {
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      setUser(persistAuth(data))
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password })
      setUser(persistAuth(data))
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user]
  )

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
