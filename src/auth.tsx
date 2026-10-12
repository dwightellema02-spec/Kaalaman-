import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Accounts and progress. With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set,
// accounts are real (Supabase Auth + a `progress` table, see supabase/schema.sql).
// Without them the site runs in demo mode: accounts live in this browser only.

export type User = { id: string; email: string; name: string }
export type Progress = { completed: string[]; xp: number; streak: number; lastDay: string | null }

const emptyProgress: Progress = { completed: [], xp: 0, streak: 0, lastDay: null }
export const LESSON_XP = 20

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
export const demoMode = !supabase

// ---- Demo backend (localStorage) ----
type LocalUser = User & { passHash: string; progress: Progress }
const USERS = 'kaalaman.users'
const SESSION = 'kaalaman.session'

// Storage can be blocked (private windows, sandboxed previews); treat that as "nothing saved".
function session(email?: string | null) {
  try {
    if (email === undefined) return localStorage.getItem(SESSION)
    if (email === null) localStorage.removeItem(SESSION)
    else localStorage.setItem(SESSION, email)
  } catch {
    // ignore
  }
  return null
}

function readUsers(): Record<string, LocalUser> {
  try {
    return JSON.parse(localStorage.getItem(USERS) || '{}')
  } catch {
    return {}
  }
}
function writeUsers(users: Record<string, LocalUser>) {
  try {
    localStorage.setItem(USERS, JSON.stringify(users))
  } catch {
    // Storage blocked (private window): the account lasts for this visit only.
  }
}

async function hash(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---- Shared ----
const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
const yesterday = () => new Date(Date.now() - 86400000).toLocaleDateString('en-CA')

// The streak only counts if the learner finished a lesson today or yesterday.
export const liveStreak = (p: Progress) => (p.lastDay === today() || p.lastDay === yesterday() ? p.streak : 0)

function withLessonDone(p: Progress, lessonId: string): Progress {
  const first = !p.completed.includes(lessonId)
  const streak = p.lastDay === today() ? p.streak : p.lastDay === yesterday() ? p.streak + 1 : 1
  return {
    completed: first ? [...p.completed, lessonId] : p.completed,
    xp: p.xp + (first ? LESSON_XP : LESSON_XP / 4),
    streak,
    lastDay: today(),
  }
}

type AuthValue = {
  user: User | null
  progress: Progress
  ready: boolean
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  completeLesson: (lessonId: string) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [progress, setProgress] = useState<Progress>(emptyProgress)
  const [ready, setReady] = useState(false)

  async function load(u: User | null) {
    setUser(u)
    if (!u) setProgress(emptyProgress)
    else if (supabase) {
      const { data } = await supabase.from('progress').select('data').eq('user_id', u.id).maybeSingle()
      setProgress({ ...emptyProgress, ...(data?.data ?? {}) })
    } else setProgress(readUsers()[u.email]?.progress ?? emptyProgress)
    setReady(true)
  }

  useEffect(() => {
    if (supabase) {
      const toUser = (s: { user: { id: string; email?: string; user_metadata: { name?: string } } } | null) =>
        s ? { id: s.user.id, email: s.user.email ?? '', name: s.user.user_metadata.name ?? s.user.email ?? '' } : null
      supabase.auth.getSession().then(({ data }) => load(toUser(data.session)))
      const { data } = supabase.auth.onAuthStateChange((_e, s) => load(toUser(s)))
      return () => data.subscription.unsubscribe()
    }
    const email = session()
    const u = email ? readUsers()[email] : undefined
    load(u ? { id: u.id, email: u.email, name: u.name } : null)
  }, [])

  const value: AuthValue = {
    user,
    progress,
    ready,
    async signUp(name, email, password) {
      email = email.trim().toLowerCase()
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
        if (error) return error.message
        if (!data.session) return 'Check your email to confirm your account, then sign in.'
        return null
      }
      const users = readUsers()
      if (users[email]) return 'An account with this email already exists.'
      users[email] = { id: crypto.randomUUID(), email, name, passHash: await hash(password), progress: emptyProgress }
      writeUsers(users)
      session(email)
      await load({ id: users[email].id, email, name })
      return null
    },
    async signIn(email, password) {
      email = email.trim().toLowerCase()
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? error.message : null
      }
      const u = readUsers()[email]
      if (!u || u.passHash !== (await hash(password))) return 'Wrong email or password.'
      session(email)
      await load({ id: u.id, email, name: u.name })
      return null
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
      session(null)
      await load(null)
    },
    async completeLesson(lessonId) {
      if (!user) return
      const next = withLessonDone(progress, lessonId)
      setProgress(next)
      if (supabase) await supabase.from('progress').upsert({ user_id: user.id, data: next })
      else {
        const users = readUsers()
        users[user.email].progress = next
        writeUsers(users)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
