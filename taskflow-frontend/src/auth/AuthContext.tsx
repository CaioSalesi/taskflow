/* eslint-disable react-refresh/only-export-components -- context, provider and hook belong together */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  type AuthUser,
  type LoginInput,
} from '../data/auth'

export interface AuthContextValue {
  /** The logged-in user, or null when logged out. */
  user: AuthUser | null
  /** True while the initial session check (GET /api/auth/me) is in flight. */
  initializing: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Restore the session from the HttpOnly cookie on first load.
  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current)
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const loggedIn = await loginUser(input)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, initializing, login, logout }),
    [user, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
