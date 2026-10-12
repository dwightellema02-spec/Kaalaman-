import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { findCourse } from '../content/courses'
import { LESSON_XP, liveStreak, useAuth } from '../auth'
import { StepView } from '../steps/StepView'

// Keyed by lesson so moving to another lesson starts fresh at step one.
export function LessonPage() {
  return <Lesson key={useParams().lessonId} />
}

function Lesson() {
  const { courseId = '', lessonId } = useParams()
  const course = findCourse(courseId)
  const lesson = course?.lessons.find((l) => l.id === lessonId)
  const { user, ready, progress, completeLesson } = useAuth()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [firstTime, setFirstTime] = useState(true)

  if (!ready) return null
  if (!user) return <Navigate to="/signup" replace />
  if (!course || !lesson) return <Navigate to="/" replace />

  const finished = index >= lesson.steps.length

  async function next() {
    if (index === lesson!.steps.length - 1) {
      setFirstTime(!progress.completed.includes(lesson!.id))
      await completeLesson(lesson!.id)
    }
    setIndex((i) => i + 1)
  }

  const nextLesson = course.lessons[course.lessons.indexOf(lesson) + 1]

  return (
    <div className="lesson" style={{ '--accent': course.color } as React.CSSProperties}>
      <div className="lesson-top">
        <Link to={`/course/${course.id}`} className="close" aria-label="Leave lesson">✕</Link>
        <div className="progress"><span style={{ width: `${(index / lesson.steps.length) * 100}%` }} /></div>
      </div>

      {finished ? (
        <div className="step-body done-screen">
          <div className="big-emoji">🎉</div>
          <h2>Lesson complete!</h2>
          <p className="muted">{lesson.title}</p>
          <div className="rewards">
            <span>⚡ +{firstTime ? LESSON_XP : LESSON_XP / 4} XP</span>
            <span>🔥 {liveStreak(progress)} day streak</span>
          </div>
          <div className="feedback-actions">
            <button className="btn ghost" onClick={() => navigate(`/course/${course.id}`)}>Back to course</button>
            {nextLesson && (
              <button className="btn primary" onClick={() => navigate(`/course/${course.id}/${nextLesson.id}`)}>
                Next lesson
              </button>
            )}
          </div>
        </div>
      ) : (
        <StepView key={`${lesson.id}-${index}`} step={lesson.steps[index]} onContinue={next} />
      )}
    </div>
  )
}
