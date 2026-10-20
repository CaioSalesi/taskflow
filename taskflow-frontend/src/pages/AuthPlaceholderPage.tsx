import { Link } from 'react-router-dom'
import logo from '../assets/hero.png'
import './AuthPlaceholderPage.css'

interface AuthPlaceholderPageProps {
  title: string
  description: string
}

/**
 * Temporary stand-in for the login / registration pages so landing-page
 * links resolve to a real route. Replace with the actual auth forms.
 */
function AuthPlaceholderPage({ title, description }: AuthPlaceholderPageProps) {
  return (
    <main className="auth-placeholder">
      <Link to="/" className="brand auth-brand">
        <img src={logo} alt="" width="34" height="34" />
        <span>TaskFlow</span>
      </Link>
      <div className="auth-card">
        <h1>{title}</h1>
        <p>{description}</p>
        <Link to="/" className="btn btn-ghost">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}

export default AuthPlaceholderPage
