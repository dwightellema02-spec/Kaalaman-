import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { CoursePage } from './pages/CoursePage'
import { LessonPage } from './pages/LessonPage'
import { AuthPage } from './pages/AuthPage'

// Hash routing so deep links work on GitHub Pages without server rewrites.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/course/:courseId/:lessonId" element={<LessonPage />} />
          <Route
            path="*"
            element={
              <>
                <Header />
                <main className="page">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/course/:courseId" element={<CoursePage />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route path="/signup" element={<AuthPage mode="signup" />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
