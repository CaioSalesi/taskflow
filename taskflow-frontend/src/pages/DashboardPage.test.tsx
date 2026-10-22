import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import RequireAuth from '../auth/RequireAuth'
import { fetchCurrentUser, logoutUser } from '../data/auth'
import DashboardPage from './DashboardPage'

vi.mock('../data/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/auth')>()),
  fetchCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}))

function renderDashboard() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login page stub</div>} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(fetchCurrentUser).mockReset()
    vi.mocked(logoutUser).mockReset()
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    vi.mocked(logoutUser).mockResolvedValue()
  })

  it('greets the logged-in user', async () => {
    renderDashboard()

    expect(
      await screen.findByRole('heading', { name: /welcome back, ada lovelace/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/ada@example\.com/i)).toBeInTheDocument()
  })

  it('logs out and returns to the login page', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await user.click(await screen.findByRole('button', { name: /log out/i }))

    expect(logoutUser).toHaveBeenCalled()
    expect(await screen.findByText(/login page stub/i)).toBeInTheDocument()
  })
})
