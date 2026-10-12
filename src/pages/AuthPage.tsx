import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { demoMode, useAuth } from '../auth'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { user, signIn, signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(mode === 'signup' ? await signUp(name.trim(), email, password) : await signIn(email, password))
    setBusy(false)
  }

  return (
    <section className="auth">
      <h1>{mode === 'signup' ? 'Create your free account' : 'Welcome back'}</h1>
      <form onSubmit={submit}>
        {mode === 'signup' && (
          <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        )}
        <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>
          Password
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="btn primary" disabled={busy}>{mode === 'signup' ? 'Sign up' : 'Log in'}</button>
      </form>
      <p className="muted small">
        {mode === 'signup' ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/signup">Sign up free</Link></>}
      </p>
      {demoMode && <p className="muted small demo-note">Preview mode: accounts are saved in this browser only.</p>}
    </section>
  )
}
