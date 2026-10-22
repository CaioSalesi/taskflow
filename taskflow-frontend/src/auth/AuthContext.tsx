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
import { onSessionExpired } from '../data/api'
import {
  checkSession,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  type AuthUser,
  type LoginInput,
} from '../data/auth'

/** How often an open tab re-checks that its session is still valid. */
const SESSION_RECHECK_INTERVAL_MS = 5 * 60 * 1000

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

  // Any authenticated request answered with 401 (via authFetch) logs out
  // immediately — protected routes then redirect to /login.
  useEffect(() => onSessionExpired(() => setUser(null)), [])

  // An open tab notices the fixed session expiry without a reload: re-check
  // when the tab regains focus/visibility and periodically while it stays
  // open. Only a definitive 'expired' logs out — network blips don't.
  useEffect(() => {
    if (!user) return

    let checking = false
    async function revalidate() {
      if (checking || document.visibilityState === 'hidden') return
      checking = true
      try {
        if ((await checkSession()) === 'expired') {
          setUser(null)
        }
      } finally {
        checking = false
      }
    }

    window.addEventListener('focus', revalidate)
    document.addEventListener('visibilitychange', revalidate)
    const interval = window.setInterval(revalidate, SESSION_RECHECK_INTERVAL_MS)
    return () => {
      window.removeEventListener('focus', revalidate)
      document.removeEventListener('visibilitychange', revalidate)
      window.clearInterval(interval)
    }
  }, [user])

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
