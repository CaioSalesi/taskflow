import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { fetchCurrentUser, LoginError, loginUser } from '../data/auth'
import LoginPage from './LoginPage'

vi.mock('../data/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/auth')>()),
  loginUser: vi.fn(),
  fetchCurrentUser: vi.fn(),
}))

function renderLogin(initialEntries: Array<string | object> = ['/login']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard stub</div>} />
          <Route path="/reports" element={<div>Reports stub</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { email = 'ada@example.com', password = 'secret-password' } = {},
) {
  if (email) await user.type(screen.getByLabelText(/email/i), email)
  if (password) await user.type(screen.getByLabelText(/password/i), password)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(loginUser).mockReset()
    vi.mocked(fetchCurrentUser).mockReset()
    vi.mocked(fetchCurrentUser).mockResolvedValue(null)
  })

  it('renders the login form', () => {
    renderLogin()

    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute(
      'href',
      '/register',
    )
  })

  it('logs the user in and navigates to the dashboard', async () => {
    const user = userEvent.setup()
    vi.mocked(loginUser).mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    renderLogin()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(loginUser).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'secret-password',
    })
    expect(await screen.findByText(/dashboard stub/i)).toBeInTheDocument()
  })

  it('returns the user to the page they were redirected from', async () => {
    const user = userEvent.setup()
    vi.mocked(loginUser).mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    renderLogin([
      { pathname: '/login', state: { from: { pathname: '/reports' } } },
    ])

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText(/reports stub/i)).toBeInTheDocument()
  })

  it('validates inputs locally before calling the API', async () => {
    const user = userEvent.setup()
    renderLogin()

    await fillForm(user, { email: 'not-an-email', password: '' })
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(loginUser).not.toHaveBeenCalled()
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument()
  })

  it('shows the generic error message on invalid credentials', async () => {
    const user = userEvent.setup()
    vi.mocked(loginUser).mockRejectedValue(
      new LoginError('Invalid email or password.'),
    )
    renderLogin()

    await fillForm(user, { password: 'wrong-password' })
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid email or password/i,
    )
    // Still on the login page.
    expect(
      screen.getByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument()
  })
})
