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
