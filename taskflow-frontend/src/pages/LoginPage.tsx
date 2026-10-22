import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/hero.png'
import { LoginError, type LoginFieldErrors } from '../data/auth'
import { useAuth } from '../auth/AuthContext'
import './LoginPage.css'

function validate(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (password.length === 0) {
    errors.password = 'Enter your password.'
  }
  return errors
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where RequireAuth sent us from, so login returns the user there.
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/dashboard'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const clientErrors = validate(email, password)
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof LoginError) {
        setFormError(error.message)
        setFieldErrors(error.fieldErrors)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <Link to="/" className="login-brand">
        <img src={logo} alt="" width="34" height="34" />
        <span>TaskFlow</span>
      </Link>
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="login-subtitle">Log in to pick up where you left off.</p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? 'login-password-error' : undefined
            }
          />
          {fieldErrors.password && (
            <p id="login-password-error" className="field-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary login-submit"
          disabled={submitting}
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="login-alt">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </main>
  )
}

export default LoginPage
