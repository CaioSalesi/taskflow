import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/hero.png'
import { fetchFeatures, type Feature } from '../data/features'
import './LandingPage.css'

const FEATURE_ICONS: Record<Feature['icon'], React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  board: (
    <>
      <rect x="3" y="3" width="5" height="14" rx="1.5" />
      <rect x="10" y="3" width="5" height="10" rx="1.5" />
      <rect x="17" y="3" width="4" height="18" rx="1.5" />
    </>
  ),
  shield: (
    <path d="M12 2l8 3.5v5.2c0 5-3.4 9.3-8 11.3-4.6-2-8-6.3-8-11.3V5.5L12 2zm-1.2 13.5l5.4-5.4-1.4-1.4-4 4-1.8-1.8-1.4 1.4 3.2 3.2z" />
  ),
  task: (
    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm5.8 13.2l7-7-1.6-1.6-5.4 5.4-2.4-2.4-1.6 1.6 4 4z" />
  ),
  search: (
    <path d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z" />
  ),
  comment: (
    <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 1-2zm3 5v2h10V8H7zm0 4v2h7v-2H7z" />
  ),
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <article className="feature-card">
      <span className="feature-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          {FEATURE_ICONS[feature.icon]}
        </svg>
      </span>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </article>
  )
}

function FeatureCardSkeleton() {
  return (
    <div className="feature-card feature-card-skeleton" aria-hidden="true">
      <span className="skeleton skeleton-icon" />
      <span className="skeleton skeleton-title" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line" />
      <span className="skeleton skeleton-line short" />
    </div>
  )
}

const BOARD_PREVIEW = [
  {
    column: 'To do',
    cards: [
      { label: 'design', title: 'Landing page hero' },
      { label: 'backend', title: 'Permissions API' },
      { label: 'frontend', title: 'Task search filters' },
    ],
  },
  {
    column: 'In progress',
    cards: [
      { label: 'frontend', title: 'Kanban drag & drop' },
      { label: 'backend', title: 'Comment threads' },
    ],
  },
  {
    column: 'Done',
    cards: [
      { label: 'infra', title: 'CI/CD pipeline' },
      { label: 'design', title: 'Brand colors' },
      { label: 'backend', title: 'Auth endpoints' },
    ],
  },
]

function LandingPage() {
  const [features, setFeatures] = useState<Feature[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchFeatures().then((data) => {
      if (!cancelled) setFeatures(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const isLoading = features === null

  return (
    <div className="landing">
      <header className="site-header">
        <Link to="/" className="brand">
          <img src={logo} alt="" width="34" height="34" />
          <span>TaskFlow</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="header-actions">
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary">
            Sign up
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-badge">Project management, simplified</p>
            <h1>
              Organize any project, <em>task by task</em>
            </h1>
            <p className="hero-description">
              TaskFlow is a collaborative project management platform. Plan
              projects on Kanban boards, create and track tasks, manage team
              permissions, and keep every conversation next to the work —
              all in one place.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get started — it's free
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Log in
              </Link>
            </div>
          </div>

          <div className="board-preview" aria-hidden="true">
            {BOARD_PREVIEW.map(({ column, cards }) => (
              <div className="board-column" key={column}>
                <p className="board-column-title">{column}</p>
                {cards.map(({ label, title }) => (
                  <div className="board-card" key={title}>
                    <span className={`board-label label-${label}`}>
                      {label}
                    </span>
                    <p>{title}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="features"
          aria-busy={isLoading}
          aria-live="polite"
        >
          <div className="section-heading">
            <h2>Everything your team needs to ship</h2>
            <p>
              From the first idea to the final review, TaskFlow keeps work
              visible and teams in sync.
            </p>
          </div>
          <div className="feature-grid">
            {isLoading
              ? Array.from({ length: 6 }, (_, i) => (
                  <FeatureCardSkeleton key={i} />
                ))
              : features.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
          </div>
          {isLoading && <p className="sr-only">Loading features…</p>}
        </section>

        <section id="how-it-works" className="how-it-works">
          <div className="section-heading">
            <h2>Up and running in three steps</h2>
          </div>
          <ol className="steps">
            <li>
              <span className="step-number">1</span>
              <h3>Create your account</h3>
              <p>
                <Link to="/register">Sign up</Link> in under a minute — no
                credit card required.
              </p>
            </li>
            <li>
              <span className="step-number">2</span>
              <h3>Set up a project</h3>
              <p>
                Create a board, invite your team, and assign roles with
                granular permissions.
              </p>
            </li>
            <li>
              <span className="step-number">3</span>
              <h3>Start flowing</h3>
              <p>
                Add tasks, move cards across columns, and comment right where
                the work happens.
              </p>
            </li>
          </ol>
        </section>

        <section className="cta-band">
          <h2>Ready to get your team flowing?</h2>
          <p>Join TaskFlow today and bring order to every project.</p>
          <Link to="/register" className="btn btn-lg cta-btn">
            Create your free account
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src={logo} alt="" width="26" height="26" />
          <span>TaskFlow</span>
        </div>
        <nav aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </nav>
        <p className="footer-copy">
          © {new Date().getFullYear()} TaskFlow. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
