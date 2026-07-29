import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Role } from '../types'

export const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({
  children,
  roles
}) => {
  const { isAuthenticated, hasRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/eventos" replace />
  }

  return <>{children}</>
}
