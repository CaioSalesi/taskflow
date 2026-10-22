export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface RegisteredUser {
  id: string
  name: string
  email: string
}

export type RegisterFieldErrors = Partial<
  Record<'name' | 'email' | 'password', string>
>

export class RegistrationError extends Error {
  readonly fieldErrors: RegisterFieldErrors

  constructor(message: string, fieldErrors: RegisterFieldErrors = {}) {
    super(message)
    this.name = 'RegistrationError'
    this.fieldErrors = fieldErrors
  }
}

/** Shape of ASP.NET Core's ProblemDetails / ValidationProblemDetails. */
interface ProblemDetails {
  title?: string
  errors?: Record<string, string[]>
}

function toFieldErrors(errors: Record<string, string[]>): RegisterFieldErrors {
  const fieldErrors: RegisterFieldErrors = {}
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.toLowerCase()
    if (
      (field === 'name' || field === 'email' || field === 'password') &&
      messages.length > 0
    ) {
      fieldErrors[field] = messages[0]
    }
  }
  return fieldErrors
}

/**
 * Registers a new user via the TaskFlow API. In development the Vite dev
 * server proxies `/api` to the backend (see vite.config.ts).
 */
export async function registerUser(
  input: RegisterInput,
): Promise<RegisteredUser> {
  let response: Response
  try {
    response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new RegistrationError(
      'Could not reach the server. Please try again in a moment.',
    )
  }

  if (response.ok) {
    return (await response.json()) as RegisteredUser
  }

  const problem = (await response
    .json()
    .catch(() => null)) as ProblemDetails | null

  if (problem?.errors) {
    throw new RegistrationError(
      problem.title ?? 'Please fix the highlighted fields.',
      toFieldErrors(problem.errors),
    )
  }

  throw new RegistrationError(
    problem?.title ?? 'Something went wrong. Please try again.',
  )
}

/** The logged-in user, as returned by the login and current-user endpoints. */
export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface LoginInput {
  email: string
  password: string
}

export type LoginFieldErrors = Partial<Record<'email' | 'password', string>>

export class LoginError extends Error {
  readonly fieldErrors: LoginFieldErrors

  constructor(message: string, fieldErrors: LoginFieldErrors = {}) {
    super(message)
    this.name = 'LoginError'
    this.fieldErrors = fieldErrors
  }
}

function toLoginFieldErrors(errors: Record<string, string[]>): LoginFieldErrors {
  const fieldErrors: LoginFieldErrors = {}
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.toLowerCase()
    if ((field === 'email' || field === 'password') && messages.length > 0) {
      fieldErrors[field] = messages[0]
    }
  }
  return fieldErrors
}

/**
 * Logs a user in. On success the API sets an HttpOnly session cookie, which
 * the browser sends automatically on subsequent same-origin requests.
 */
export async function loginUser(input: LoginInput): Promise<AuthUser> {
  let response: Response
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new LoginError(
      'Could not reach the server. Please try again in a moment.',
    )
  }

  if (response.ok) {
    return (await response.json()) as AuthUser
  }

  const problem = (await response
    .json()
    .catch(() => null)) as ProblemDetails | null

  if (problem?.errors) {
    throw new LoginError(
      problem.title ?? 'Please fix the highlighted fields.',
      toLoginFieldErrors(problem.errors),
    )
  }

  throw new LoginError(
    problem?.title ?? 'Something went wrong. Please try again.',
  )
}

/** Ends the current session. Never throws — worst case the cookie expires. */
export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Ignore network failures; the client clears its state regardless.
  }
}

export type SessionStatus = 'valid' | 'expired' | 'unknown'

/**
 * Re-checks whether the session is still valid. Returns 'expired' only when
 * the server definitively rejects it (401/403) — network failures and server
 * errors return 'unknown', so a transient blip never logs the user out.
 */
export async function checkSession(): Promise<SessionStatus> {
  let response: Response
  try {
    response = await fetch('/api/auth/me')
  } catch {
    return 'unknown'
  }

  if (response.ok) {
    return 'valid'
  }
  if (response.status === 401 || response.status === 403) {
    return 'expired'
  }
  return 'unknown'
}

/**
 * Returns the currently logged-in user, or null when there is no valid
 * session (or the server cannot be reached).
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  let response: Response
  try {
    response = await fetch('/api/auth/me')
  } catch {
    return null
  }

  if (!response.ok) {
    return null
  }
  return (await response.json()) as AuthUser
}
