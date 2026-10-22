type SessionExpiredListener = () => void

const sessionExpiredListeners = new Set<SessionExpiredListener>()

/**
 * Subscribes to session-expiry reports. Returns an unsubscribe function.
 * The auth context uses this to clear its state the moment any authenticated
 * request hits a dead session, so protected routes redirect to /login.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

/** Notifies subscribers that the server rejected the session with a 401. */
export function reportSessionExpired(): void {
  for (const listener of [...sessionExpiredListeners]) {
    listener()
  }
}

/**
 * fetch for endpoints that require a logged-in user. A 401 response reports
 * the expired session, so callers don't each re-implement that handling —
 * use this instead of bare fetch for every future authenticated API call.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init)
  if (response.status === 401) {
    reportSessionExpired()
  }
  return response
}
