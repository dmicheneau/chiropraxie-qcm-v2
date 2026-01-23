import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ClipboardList, BarChart3, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/quiz', icon: ClipboardList, label: t('nav.quiz') },
    { path: '/stats', icon: BarChart3, label: t('nav.stats') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="navbar bg-primary text-primary-content shadow-lg sticky top-0 z-50">
      <div className="container mx-auto">
        {/* Logo */}
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            {t('app.title')}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-none">
          <ul className="menu menu-horizontal px-1 gap-1">
            {navItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-2 ${
                    isActive(item.path) ? 'bg-primary-content/20 font-semibold' : ''
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex-none md:hidden">
          <button
            className="btn btn-ghost btn-square"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="absolute top-full left-0 right-0 bg-primary shadow-lg md:hidden">
          <ul className="menu p-4">
            {navItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 ${
                    isActive(item.path) ? 'bg-primary-content/20 font-semibold' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
