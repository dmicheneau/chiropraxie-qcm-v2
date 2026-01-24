import { useEffect, Suspense, lazy, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { useSettingsStore } from '@/stores'
import Onboarding from '@/components/onboarding/Onboarding'

// Lazy load pages for better initial bundle size
const HomePage = lazy(() => import('./pages/Home'))
const QuizPage = lazy(() => import('./pages/Quiz'))
const StatsPage = lazy(() => import('./pages/Stats'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const ImportPage = lazy(() => import('./pages/Import'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-base-content/70">Chargement...</p>
      </div>
    </div>
  )
}

function App() {
  const { loadSettings, theme, hasSeenOnboarding, markOnboardingComplete } = useSettingsStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load settings and apply theme on mount
    const initApp = async () => {
      await loadSettings()
      setIsLoading(false)
    }
    initApp()
  }, [loadSettings])

  useEffect(() => {
    // Apply theme whenever it changes
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Show loading state while settings are being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  // Show onboarding on first launch
  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={markOnboardingComplete} />
  }

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/import" element={<ImportPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}

export default App
