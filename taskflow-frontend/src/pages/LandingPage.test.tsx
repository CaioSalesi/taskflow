import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { fetchCurrentUser, logoutUser } from '../data/auth'
import { fetchFeatures, type Feature } from '../data/features'
import AuthPlaceholderPage from './AuthPlaceholderPage'
import LandingPage from './LandingPage'

vi.mock('../data/features', () => ({
  fetchFeatures: vi.fn(),
}))

vi.mock('../data/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/auth')>()),
  fetchCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
}))

const TEST_FEATURES: Feature[] = [
  {
    id: 'dashboard',
    icon: 'dashboard',
    title: 'Dashboard',
    description: 'See everything in one place.',
  },
  {
    id: 'projects',
    icon: 'board',
    title: 'Project Management',
    description: 'Organize work on Kanban boards.',
  },
  {
    id: 'permissions',
    icon: 'shield',
    title: 'Permissions Management',
    description: 'Role-based access control.',
  },
]

function renderLanding() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={<AuthPlaceholderPage title="Log in" description="Soon." />}
          />
          <Route
            path="/register"
            element={
              <AuthPlaceholderPage title="Create your account" description="Soon." />
            }
          />
          <Route path="/dashboard" element={<div>Dashboard stub</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.mocked(fetchFeatures).mockResolvedValue(TEST_FEATURES)
    vi.mocked(fetchCurrentUser).mockReset()
    vi.mocked(fetchCurrentUser).mockResolvedValue(null)
    vi.mocked(logoutUser).mockReset()
    vi.mocked(logoutUser).mockResolvedValue()
  })

  it('displays the platform name and description', () => {
    renderLanding()

    expect(
      screen.getByRole('link', { name: /taskflow/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /organize any project/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/collaborative project management platform/i),
    ).toBeInTheDocument()
  })

  it('shows a loading state while features are being fetched', () => {
    // A promise that never resolves keeps the page in its loading state.
    vi.mocked(fetchFeatures).mockReturnValue(new Promise(() => {}))
    renderLanding()

    const featuresSection = document.getElementById('features')
    expect(featuresSection).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(/loading features/i)).toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('renders the main features once loading finishes', async () => {
    renderLanding()

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Project Management')).toBeInTheDocument()
    expect(screen.getByText('Permissions Management')).toBeInTheDocument()

    expect(document.getElementById('features')).toHaveAttribute(
      'aria-busy',
      'false',
    )
    expect(screen.queryByText(/loading features/i)).not.toBeInTheDocument()
  })

  it('links to the login and registration pages when logged out', async () => {
    renderLanding()

    // The header buttons appear once the session check resolves.
    const loginLinks = await screen.findAllByRole('link', { name: /log in/i })
    expect(loginLinks.length).toBeGreaterThan(1)
    loginLinks.forEach((link) => expect(link).toHaveAttribute('href', '/login'))

    const signUpLinks = screen.getAllByRole('link', { name: /sign up/i })
    expect(signUpLinks.length).toBeGreaterThan(0)
    signUpLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/register'),
    )
    expect(
      screen.getByRole('link', { name: /get started/i }),
    ).toHaveAttribute('href', '/register')
  })

  it('navigates to the registration page when clicking the main call to action', async () => {
    const user = userEvent.setup()
    renderLanding()

    await user.click(screen.getByRole('link', { name: /get started/i }))

    expect(
      screen.getByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument()
  })

  it('navigates to the login page from the header', async () => {
    const user = userEvent.setup()
    renderLanding()

    await user.click((await screen.findAllByRole('link', { name: /log in/i }))[0])

    expect(
      screen.getByRole('heading', { name: /log in/i }),
    ).toBeInTheDocument()
  })

  describe('when a user is logged in', () => {
    beforeEach(() => {
      vi.mocked(fetchCurrentUser).mockResolvedValue({
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      })
    })

    it('shows the user name instead of the login and signup buttons', async () => {
      renderLanding()

      expect(
        await screen.findByRole('button', { name: /ada lovelace/i }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: /log in/i }),
      ).not.toBeInTheDocument()

      // Header and footer swap signup for the logged-in destinations (the
      // "Sign up" link inside the how-it-works copy stays).
      const header = screen.getByRole('banner')
      expect(
        within(header).queryByRole('link', { name: /sign up/i }),
      ).not.toBeInTheDocument()
      const footer = screen.getByRole('contentinfo')
      expect(
        within(footer).queryByRole('link', { name: /sign up/i }),
      ).not.toBeInTheDocument()
      expect(
        within(footer).getByRole('link', { name: /dashboard/i }),
      ).toHaveAttribute('href', '/dashboard')

      expect(
        screen.getByRole('link', { name: /go to your dashboard/i }),
      ).toHaveAttribute('href', '/dashboard')
    })

    it('opens a menu with the main destinations when clicking the name', async () => {
      const user = userEvent.setup()
      renderLanding()

      await user.click(
        await screen.findByRole('button', { name: /ada lovelace/i }),
      )

      const dashboardItem = screen.getByRole('menuitem', { name: /dashboard/i })
      expect(dashboardItem).toHaveAttribute('href', '/dashboard')
      expect(
        screen.getByRole('menuitem', { name: /log out/i }),
      ).toBeInTheDocument()

      await user.click(dashboardItem)
      expect(screen.getByText(/dashboard stub/i)).toBeInTheDocument()
    })

    it('logs out from the menu and shows the login buttons again', async () => {
      const user = userEvent.setup()
      renderLanding()

      await user.click(
        await screen.findByRole('button', { name: /ada lovelace/i }),
      )
      await user.click(screen.getByRole('menuitem', { name: /log out/i }))

      expect(logoutUser).toHaveBeenCalled()
      expect(
        await screen.findAllByRole('link', { name: /log in/i }),
      ).not.toHaveLength(0)
      expect(
        screen.queryByRole('button', { name: /ada lovelace/i }),
      ).not.toBeInTheDocument()
    })
  })
})
