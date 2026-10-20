import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchFeatures, type Feature } from '../data/features'
import AuthPlaceholderPage from './AuthPlaceholderPage'
import LandingPage from './LandingPage'

vi.mock('../data/features', () => ({
  fetchFeatures: vi.fn(),
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
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.mocked(fetchFeatures).mockResolvedValue(TEST_FEATURES)
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

  it('links to the login and registration pages', () => {
    renderLanding()

    const loginLinks = screen.getAllByRole('link', { name: /log in/i })
    expect(loginLinks.length).toBeGreaterThan(0)
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

    await user.click(screen.getAllByRole('link', { name: /log in/i })[0])

    expect(
      screen.getByRole('heading', { name: /log in/i }),
    ).toBeInTheDocument()
  })
})
