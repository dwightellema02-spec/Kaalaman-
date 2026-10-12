import { Link } from 'react-router-dom'
import { courses } from '../content/courses'
import type { Course } from '../content/types'
import { useAuth } from '../auth'

const levels: Course['level'][] = ['Foundational', 'Intermediate', 'Advanced']

export function Home() {
  const { user, progress } = useAuth()
  // The first unfinished playable lesson, in catalog order.
  const next = courses
    .flatMap((c) => c.lessons.map((l) => ({ course: c, lesson: l })))
    .find(({ lesson }) => !progress.completed.includes(lesson.id))

  return (
    <>
      {user ? (
        <section className="welcome">
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          {next ? (
            <Link to={`/course/${next.course.id}/${next.lesson.id}`} className="continue-card" style={{ borderColor: next.course.color }}>
              <span className="eyebrow">Continue · {next.course.title}</span>
              <strong>{next.lesson.title}</strong>
              <span className="btn primary small">Start lesson</span>
            </Link>
          ) : (
            <p className="muted">You’ve finished every lesson available so far. New lessons are on the way.</p>
          )}
        </section>
      ) : (
        <section className="hero">
          <h1>Learn math by doing.</h1>
          <p>Interactive lessons that build real understanding, from fractions to calculus. Free, for everyone who wants to learn.</p>
          <Link to="/signup" className="btn primary">Get started free</Link>
        </section>
      )}

      {levels.map((level) => (
        <section key={level} className="catalog">
          <h2>{level}</h2>
          <div className="cards">
            {courses
              .filter((c) => c.level === level)
              .map((c) => {
                const done = c.lessons.filter((l) => progress.completed.includes(l.id)).length
                const total = c.lessons.length + (c.upcoming?.length ?? 0)
                return (
                  <Link key={c.id} to={`/course/${c.id}`} className="card">
                    <span className="card-art" style={{ background: c.color }}>{c.title[0]}</span>
                    <span className="eyebrow">{c.branch}</span>
                    <strong>{c.title}</strong>
                    <span className="muted">{c.blurb}</span>
                    {c.lessons.length ? (
                      <span className="meter"><span style={{ width: `${(done / total) * 100}%`, background: c.color }} /></span>
                    ) : (
                      <span className="soon">Coming soon</span>
                    )}
                  </Link>
                )
              })}
          </div>
        </section>
      ))}
    </>
  )
}
