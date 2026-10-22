import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reportSessionExpired } from '../data/api'
import { checkSession, fetchCurrentUser } from '../data/auth'
import { AuthProvider } from './AuthContext'
import RequireAuth from './RequireAuth'

vi.mock('../data/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/auth')>()),
  fetchCurrentUser: vi.fn(),
  checkSession: vi.fn(),
}))

function renderProtectedRoute() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login page stub</div>} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <div>Protected content</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentUser).mockReset()
    vi.mocked(checkSession).mockReset()
    vi.mocked(checkSession).mockResolvedValue('valid')
  })

  it('redirects unauthenticated users to the login page', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue(null)

    renderProtectedRoute()

    expect(await screen.findByText(/login page stub/i)).toBeInTheDocument()
    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument()
  })

  it('renders the protected content when a session exists', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })

    renderProtectedRoute()

    expect(await screen.findByText(/protected content/i)).toBeInTheDocument()
    expect(screen.queryByText(/login page stub/i)).not.toBeInTheDocument()
  })

  it('renders nothing while the session check is in flight', () => {
    // A promise that never resolves keeps the provider in its initializing state.
    vi.mocked(fetchCurrentUser).mockReturnValue(new Promise(() => {}))

    renderProtectedRoute()

    expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/login page stub/i)).not.toBeInTheDocument()
  })

  describe('session expiry while the app is open', () => {
    beforeEach(() => {
      vi.mocked(fetchCurrentUser).mockResolvedValue({
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      })
    })

    it('redirects to login when the session has expired on tab focus', async () => {
      vi.mocked(checkSession).mockResolvedValue('expired')
      renderProtectedRoute()
      expect(await screen.findByText(/protected content/i)).toBeInTheDocument()

      fireEvent(window, new Event('focus'))

      expect(await screen.findByText(/login page stub/i)).toBeInTheDocument()
      expect(
        screen.queryByText(/protected content/i),
      ).not.toBeInTheDocument()
    })

    it('stays logged in when the re-check cannot reach the server', async () => {
      vi.mocked(checkSession).mockResolvedValue('unknown')
      renderProtectedRoute()
      expect(await screen.findByText(/protected content/i)).toBeInTheDocument()

      fireEvent(window, new Event('focus'))

      await waitFor(() => expect(checkSession).toHaveBeenCalled())
      expect(screen.getByText(/protected content/i)).toBeInTheDocument()
      expect(screen.queryByText(/login page stub/i)).not.toBeInTheDocument()
    })

    it('redirects to login when an authenticated request reports a 401', async () => {
      renderProtectedRoute()
      expect(await screen.findByText(/protected content/i)).toBeInTheDocument()

      // What authFetch does when any API call answers 401.
      act(() => reportSessionExpired())

      expect(await screen.findByText(/login page stub/i)).toBeInTheDocument()
      expect(
        screen.queryByText(/protected content/i),
      ).not.toBeInTheDocument()
    })
  })
})
