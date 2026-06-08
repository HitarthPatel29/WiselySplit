import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DollarSlashMark } from '../Logo'
import GlowPill from './GlowPill'
import PrimaryButton from '../IO/PrimaryButton'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm dark:shadow-[0_4px_24px_rgba(16,185,129,0.12)] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="WiselySplit home">
          <GlowPill padding="px-3 py-2">
            <DollarSlashMark size={32} />
          </GlowPill>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 min-h-[40px] sm:min-h-[44px] inline-flex items-center text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <PrimaryButton
            label="Sign Up"
            onClick={() => navigate('/signup')}
            ariaLabel="Sign Up"
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]"
          />
        </div>
      </nav>
    </header>
  )
}
