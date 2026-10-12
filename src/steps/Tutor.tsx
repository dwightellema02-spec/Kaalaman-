import { useState } from 'react'
import { supabase } from '../auth'

type Msg = { role: 'user' | 'assistant'; content: string }
type TutorStep = { prompt: string; explanation?: string; options?: string[] }

// "Ask tutor" chat for one step. Talks to the `tutor` Supabase function,
// which holds the AI key and caps daily use.
export function Tutor({ step, answer }: { step: TutorStep; answer: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !text.trim() || busy) return
    const next = [...messages, { role: 'user' as const, content: text.trim() }]
    setMessages(next)
    setText('')
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.functions.invoke('tutor', { body: { step, answer, messages: next } })
    setBusy(false)
    if (error || data?.error) {
      // Function errors carry their message in the JSON body.
      const body = error && 'context' in error ? await (error.context as Response).json().catch(() => null) : null
      setError(data?.error ?? body?.error ?? 'The tutor is unavailable right now.')
      return
    }
    setMessages([...next, { role: 'assistant', content: data.reply }])
  }

  if (!open) {
    return (
      <button className="tutor-toggle" onClick={() => setOpen(true)}>
        💬 Ask tutor
      </button>
    )
  }

  return (
    <aside className="tutor" aria-label="AI tutor">
      <div className="tutor-head">
        <strong>Tutor</strong>
        <button className="close" onClick={() => setOpen(false)} aria-label="Close tutor">✕</button>
      </div>
      {!supabase ? (
        <p className="muted small">The tutor turns on once real accounts are connected.</p>
      ) : (
        <>
          <div className="tutor-log">
            {messages.length === 0 && <p className="muted small">Stuck? Ask anything about this step. I’ll help you get there yourself.</p>}
            {messages.map((m, i) => (
              <p key={i} className={`bubble ${m.role}`}>{m.content}</p>
            ))}
            {busy && <p className="bubble assistant muted">Thinking…</p>}
            {error && <p className="form-message">{error}</p>}
          </div>
          <form className="tutor-form" onSubmit={send}>
            <input id="tutor-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Why does this work?" autoFocus />
            <button className="btn primary small" disabled={busy || !text.trim()}>Send</button>
          </form>
        </>
      )}
    </aside>
  )
}
