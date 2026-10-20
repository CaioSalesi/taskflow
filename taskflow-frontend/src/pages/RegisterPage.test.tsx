import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerUser, RegistrationError } from '../data/auth'
import RegisterPage from './RegisterPage'

vi.mock('../data/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/auth')>()),
  registerUser: vi.fn(),
}))

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <RegisterPage />
    </MemoryRouter>,
  )
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  { name = 'Ada Lovelace', email = 'ada@example.com', password = 'secret-password' } = {},
) {
  if (name) await user.type(screen.getByLabelText(/name/i), name)
  if (email) await user.type(screen.getByLabelText(/email/i), email)
  if (password) await user.type(screen.getByLabelText(/password/i), password)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.mocked(registerUser).mockReset()
  })

  it('renders the registration form', () => {
    renderRegister()

    expect(
      screen.getByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeInTheDocument()
  })

  it('registers the user and shows a success message', async () => {
    const user = userEvent.setup()
    vi.mocked(registerUser).mockResolvedValue({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    renderRegister()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(registerUser).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret-password',
    })
    expect(
      await screen.findByRole('heading', { name: /welcome aboard/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('validates inputs locally before calling the API', async () => {
    const user = userEvent.setup()
    renderRegister()

    await fillForm(user, { name: 'A', email: 'not-an-email', password: 'short' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(registerUser).not.toHaveBeenCalled()
    expect(
      screen.getByText(/name must be between 2 and 100 characters/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(
      screen.getByText(/password must be between 8 and 128 characters/i),
    ).toBeInTheDocument()
  })

  it('shows an error when the email is already registered', async () => {
    const user = userEvent.setup()
    vi.mocked(registerUser).mockRejectedValue(
      new RegistrationError('Email already registered.'),
    )
    renderRegister()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /email already registered/i,
    )
  })

  it('shows field errors returned by the API', async () => {
    const user = userEvent.setup()
    vi.mocked(registerUser).mockRejectedValue(
      new RegistrationError('One or more validation errors occurred.', {
        email: 'The Email field is not a valid e-mail address.',
      }),
    )
    renderRegister()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText(/not a valid e-mail address/i),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
})
