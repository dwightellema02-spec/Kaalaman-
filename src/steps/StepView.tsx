import { useState } from 'react'
import type { Step } from '../content/types'
import { VisualView } from './VisualView'

type Status = 'idle' | 'correct' | 'wrong' | 'revealed'

// One step of a lesson: the prompt, the interaction, and the check/feedback bar.
export function StepView({ step, onContinue }: { step: Step; onContinue: () => void }) {
  const [choice, setChoice] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [slider, setSlider] = useState(step.type === 'slider' ? step.start : 0)
  const [status, setStatus] = useState<Status>('idle')
  const [attempts, setAttempts] = useState(0)
  const locked = status === 'correct' || status === 'revealed'

  if (step.type === 'explain') {
    return (
      <>
        <div className="step-body">
          {step.title && <h2>{step.title}</h2>}
          <p className="prose">{step.body}</p>
          {step.visual && <VisualView visual={step.visual} />}
        </div>
        <footer className="check-bar">
          <button className="btn primary" onClick={onContinue} autoFocus>
            Continue
          </button>
        </footer>
      </>
    )
  }

  const canCheck =
    step.type === 'choice' ? choice !== null : step.type === 'number' ? text.trim() !== '' && !isNaN(Number(text)) : true

  function check() {
    let ok = false
    if (step.type === 'choice') ok = choice === step.answer
    if (step.type === 'number') ok = Math.abs(Number(text) - step.answer) <= (step.tolerance ?? 1e-9)
    if (step.type === 'slider') ok = slider === step.answer
    setStatus(ok ? 'correct' : 'wrong')
    if (!ok) setAttempts((n) => n + 1)
  }

  function reveal() {
    if (step.type === 'choice') setChoice(step.answer)
    if (step.type === 'number') setText(String(step.answer))
    if (step.type === 'slider') setSlider(step.answer)
    setStatus('revealed')
  }

  return (
    <>
      <div className="step-body">
        <h2 className="prompt">{step.prompt}</h2>

        {step.type === 'slider' ? (
          <>
            <VisualView visual={step.visual} value={slider} />
            <input
              type="range"
              className="slider"
              min={step.min}
              max={step.max}
              step={step.step}
              value={slider}
              disabled={locked}
              onChange={(e) => {
                setSlider(Number(e.target.value))
                if (status === 'wrong') setStatus('idle')
              }}
              aria-label="Adjust"
            />
          </>
        ) : (
          step.visual && <VisualView visual={step.visual} />
        )}

        {step.type === 'choice' && (
          <div className="options">
            {step.options.map((o, i) => (
              <button
                key={i}
                className={[
                  'option',
                  choice === i && 'selected',
                  locked && i === step.answer && 'right',
                  status === 'wrong' && choice === i && 'wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={locked}
                onClick={() => {
                  setChoice(i)
                  if (status === 'wrong') setStatus('idle')
                }}
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {step.type === 'number' && (
          <form
            className="number-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (canCheck && !locked) check()
            }}
          >
            <input
              className={`number-input ${status === 'wrong' ? 'wrong' : ''} ${locked ? 'right' : ''}`}
              inputMode="decimal"
              value={text}
              disabled={locked}
              placeholder="Your answer"
              onChange={(e) => {
                setText(e.target.value)
                if (status === 'wrong') setStatus('idle')
              }}
              autoFocus
            />
            {step.unit && <span className="unit">{step.unit}</span>}
          </form>
        )}
      </div>

      <footer className={`check-bar ${status}`}>
        {status === 'idle' && (
          <button className="btn primary" disabled={!canCheck} onClick={check}>
            Check
          </button>
        )}
        {status === 'wrong' && (
          <div className="feedback">
            <div>
              <strong>Not quite.</strong>
              {step.hint && <p>Hint: {step.hint}</p>}
            </div>
            <div className="feedback-actions">
              {attempts >= 2 && (
                <button className="btn ghost" onClick={reveal}>
                  Show answer
                </button>
              )}
              <button className="btn primary" onClick={() => setStatus('idle')}>
                Try again
              </button>
            </div>
          </div>
        )}
        {locked && (
          <div className="feedback">
            <div>
              <strong>{status === 'correct' ? 'Correct!' : 'Here’s how it works'}</strong>
              <p>{step.explanation}</p>
            </div>
            <button className="btn primary" onClick={onContinue} autoFocus>
              Continue
            </button>
          </div>
        )}
      </footer>
    </>
  )
}
