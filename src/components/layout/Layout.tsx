import { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Skip to content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-content focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Aller au contenu principal
      </a>
      
      <Header />
      
      <main 
        id="main-content"
        className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6"
        role="main"
        aria-label="Contenu principal"
        tabIndex={-1}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
