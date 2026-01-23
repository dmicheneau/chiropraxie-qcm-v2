import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ClipboardList, BarChart3, Settings } from 'lucide-react'

export default function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()

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
    <nav className="btm-nav btm-nav-md md:hidden bg-base-100 border-t border-base-300">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={isActive(item.path) ? 'active text-primary' : 'text-base-content'}
        >
          <item.icon size={20} />
          <span className="btm-nav-label text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
