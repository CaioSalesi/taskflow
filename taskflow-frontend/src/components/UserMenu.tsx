import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './UserMenu.css'

/**
 * Header menu for a logged-in user: their name, and on click a dropdown with
 * the main destinations (just the dashboard for now) plus log out.
 */
function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside the menu or pressing Escape.
  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!user) {
    return null
  }

  async function handleLogout() {
    setOpen(false)
    await logout()
  }

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="btn btn-ghost user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {user.name}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          width="16"
          height="16"
          aria-hidden="true"
          className={open ? 'user-menu-chevron open' : 'user-menu-chevron'}
        >
          <path d="M12 15.5l-6-6 1.4-1.4 4.6 4.6 4.6-4.6L18 9.5l-6 6z" />
        </svg>
      </button>
      {open && (
        <div className="user-menu-dropdown" role="menu" aria-label={user.name}>
          <Link
            to="/dashboard"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            className="user-menu-item user-menu-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
