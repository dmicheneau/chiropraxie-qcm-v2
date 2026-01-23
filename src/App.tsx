import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { useSettingsStore } from '@/stores'
import HomePage from './pages/Home'
import QuizPage from './pages/Quiz'
import StatsPage from './pages/Stats'
import SettingsPage from './pages/Settings'
import ImportPage from './pages/Import'

function App() {
  const { loadSettings, theme } = useSettingsStore()

  useEffect(() => {
    // Load settings and apply theme on mount
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    // Apply theme whenever it changes
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/import" element={<ImportPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
