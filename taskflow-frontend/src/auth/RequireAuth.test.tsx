import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentUser } from '../data/auth'
import { AuthProvider } from './AuthContext'
import RequireAuth from './RequireAuth'

vi.mock('../data/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/auth')>()),
  fetchCurrentUser: vi.fn(),
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
})
