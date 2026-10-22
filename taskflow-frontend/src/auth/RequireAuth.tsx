import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Wraps a route that requires a logged-in user. Unauthenticated visitors are
 * redirected to /login, which sends them back here after a successful login.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  // Don't flash the login page while the session check is still running.
  if (initializing) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default RequireAuth
