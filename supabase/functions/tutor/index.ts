// Kaalaman AI tutor. Runs as a Supabase Edge Function so the Anthropic API key
// never reaches the browser. Deploy: supabase functions deploy tutor
// Secrets: supabase secrets set ANTHROPIC_API_KEY=...
import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0'
import { createClient } from 'npm:@supabase/supabase-js@2.117.3'

const DAILY_LIMIT = 30 // tutor messages per learner per day, to cap spend

const SYSTEM = `You are the Kaalaman tutor, a patient math coach inside an interactive lesson.
The learner is working on one step. You get the step, its worked explanation, and what they answered.
Help them reach the answer themselves: ask a guiding question or give the next small idea, one at a time.
Do not state the final answer unless they have tried at least twice and ask for it directly.
Keep replies short (2-4 sentences), friendly, and in plain words. Use simple notation like 3/4 or x^2.
Reply in the language the learner writes in.`

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const anthropic = new Anthropic() // reads ANTHROPIC_API_KEY

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  // Act as the signed-in learner so row-level security applies.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return json({ error: 'Please sign in to use the tutor.' }, 401)

  const day = new Date().toISOString().slice(0, 10)
  const { data: usage } = await supabase.from('tutor_usage').select('count').eq('user_id', auth.user.id).eq('day', day).maybeSingle()
  const used = usage?.count ?? 0
  if (used >= DAILY_LIMIT) return json({ error: `You've used all ${DAILY_LIMIT} tutor messages for today. Come back tomorrow!` }, 429)
  await supabase.from('tutor_usage').upsert({ user_id: auth.user.id, day, count: used + 1 })

  const { step, answer, messages } = (await req.json()) as {
    step: { prompt: string; explanation?: string; options?: string[] }
    answer: string
    messages: { role: 'user' | 'assistant'; content: string }[]
  }
  const context = [
    `Step: ${step.prompt}`,
    step.options ? `Options: ${step.options.join(' | ')}` : '',
    step.explanation ? `Worked explanation (for you, not to paste): ${step.explanation}` : '',
    `Learner's current answer: ${answer || '(none yet)'}`,
  ].filter(Boolean).join('\n')

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: `${SYSTEM}\n\n${context}`,
      messages: messages.slice(-10),
    })
    if (response.stop_reason === 'refusal') return json({ reply: "I can't help with that one. Try asking about this step." })
    const reply = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('')
    return json({ reply })
  } catch (e) {
    console.error(e)
    return json({ error: 'The tutor is unavailable right now. Try again in a moment.' }, 502)
  }
})
