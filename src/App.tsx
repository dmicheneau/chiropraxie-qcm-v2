import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home'

function App() {
  useEffect(() => {
    // Appliquer le thème par défaut
    document.documentElement.setAttribute('data-theme', 'toulouse')
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
