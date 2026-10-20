import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/hero.png'
import {
  registerUser,
  RegistrationError,
  type RegisteredUser,
  type RegisterFieldErrors,
} from '../data/auth'
import './RegisterPage.css'

/** Mirrors the API's validation rules so most mistakes are caught locally. */
function validate(
  name: string,
  email: string,
  password: string,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {}
  const trimmedName = name.trim()
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (password.length < 8 || password.length > 128) {
    errors.password = 'Password must be between 8 and 128 characters.'
  }
  return errors
}

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const [createdUser, setCreatedUser] = useState<RegisteredUser | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const clientErrors = validate(name, email, password)
    setFieldErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const user = await registerUser({ name, email, password })
      setCreatedUser(user)
    } catch (error) {
      if (error instanceof RegistrationError) {
        setFormError(error.message)
        setFieldErrors(error.fieldErrors)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (createdUser) {
    return (
      <main className="register-page">
        <Link to="/" className="register-brand">
          <img src={logo} alt="" width="34" height="34" />
          <span>TaskFlow</span>
        </Link>
        <div className="register-card">
          <h1>Welcome aboard, {createdUser.name}!</h1>
          <p className="register-success-text">
            Your account for <strong>{createdUser.email}</strong> has been
            created. You can now log in.
          </p>
          <Link to="/login" className="btn btn-primary register-submit">
            Go to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="register-page">
      <Link to="/" className="register-brand">
        <img src={logo} alt="" width="34" height="34" />
        <span>TaskFlow</span>
      </Link>
      <form className="register-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="register-subtitle">
          Start organizing your projects in minutes.
        </p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="form-field">
          <label htmlFor="register-name">Name</label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="register-name-error" className="field-error">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? 'register-email-error' : undefined
            }
          />
          {fieldErrors.email && (
            <p id="register-email-error" className="field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? 'register-password-error' : undefined
            }
          />
          {fieldErrors.password && (
            <p id="register-password-error" className="field-error">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary register-submit"
          disabled={submitting}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="register-alt">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  )
}

export default RegisterPage
