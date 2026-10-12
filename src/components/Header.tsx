import { Link } from 'react-router-dom'
import { liveStreak, useAuth } from '../auth'

export function Header() {
  const { user, progress, signOut } = useAuth()
  return (
    <header className="site-header">
      <Link to="/" className="logo">
        <img src="./favicon.svg" alt="" width={28} height={28} />
        Kaalaman
      </Link>
      <nav>
        {user ? (
          <>
            <span className="stat" title="Day streak">🔥 {liveStreak(progress)}</span>
            <span className="stat" title="Experience points">⚡ {progress.xp}</span>
            <span className="who">{user.name}</span>
            <button className="btn ghost small" onClick={signOut}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost small">Log in</Link>
            <Link to="/signup" className="btn primary small">Sign up free</Link>
          </>
        )}
      </nav>
    </header>
  )
}
