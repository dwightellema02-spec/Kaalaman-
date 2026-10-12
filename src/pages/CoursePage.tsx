import { Link, useParams } from 'react-router-dom'
import { findCourse } from '../content/courses'
import { useAuth } from '../auth'

export function CoursePage() {
  const course = findCourse(useParams().courseId ?? '')
  const { user, progress } = useAuth()
  if (!course) return <p>Course not found. <Link to="/">Back to courses</Link></p>

  // Like Brilliant, a lesson opens once the one before it is finished.
  const unlocked = (i: number) => i === 0 || progress.completed.includes(course.lessons[i - 1].id)

  return (
    <section className="course">
      <Link to="/" className="back">← All courses</Link>
      <span className="eyebrow">{course.branch} · {course.level}</span>
      <h1>{course.title}</h1>
      <p className="muted">{course.blurb}</p>

      <ol className="path" style={{ '--accent': course.color } as React.CSSProperties}>
        {course.lessons.map((l, i) => {
          const done = progress.completed.includes(l.id)
          const open = unlocked(i)
          const target = user ? `/course/${course.id}/${l.id}` : '/signup'
          return (
            <li key={l.id} className={`node ${done ? 'done' : open ? 'open' : 'locked'}`}>
              {open ? (
                <Link to={target} className="node-dot" aria-label={l.title}>{done ? '✓' : i + 1}</Link>
              ) : (
                <span className="node-dot">🔒</span>
              )}
              <span className="node-title">{l.title}</span>
              <span className="muted small">{l.steps.length} steps</span>
            </li>
          )
        })}
        {course.upcoming?.map((t) => (
          <li key={t} className="node locked">
            <span className="node-dot">·</span>
            <span className="node-title">{t}</span>
            <span className="muted small">Coming soon</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
