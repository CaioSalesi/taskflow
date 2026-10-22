import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/hero.png'
import { useAuth } from '../auth/AuthContext'
import './DashboardPage.css'

/**
 * Minimal authenticated home. Rendered behind RequireAuth, so a user is
 * always present. Task management will land here in a future feature.
 */
function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="dashboard-brand">
          <img src={logo} alt="" width="34" height="34" />
          <span>TaskFlow</span>
        </Link>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </header>
      <section className="dashboard-content">
        <h1>Welcome back, {user?.name}!</h1>
        <p>
          You're logged in as <strong>{user?.email}</strong>. Your tasks and
          projects will live here soon.
        </p>
      </section>
    </main>
  )
}

export default DashboardPage
