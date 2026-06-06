import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Logo from '../Logo'
import GlowPill from './GlowPill'
import { LANDING_NAV_LINKS } from '../../constants/landingFeatures'
import PrimaryButton from '../IO/PrimaryButton'

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleNavClick = (id) => {
    setMenuOpen(false)
    scrollToSection(id)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-navy/80 backdrop-blur-lg shadow-[0_4px_24px_rgba(16,185,129,0.12)] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="WiselySplit home">
          <GlowPill padding="px-4 py-2">
            <Logo size={32} onDarkBackground={true} />
          </GlowPill>
        </Link>

        {/* <div className="hidden lg:flex items-center gap-6">
          {LANDING_NAV_LINKS.slice(0, 5).map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleNavClick(link.id)}
              className="text-sm text-brand-slate hover:text-brand-emerald transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div> */}

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-brand-slate hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <PrimaryButton
            label="Get Started"
            onClick={() => navigate('/signup')}
            ariaLabel="Get Started"
          />
        </div>

        <button
          type="button"
          className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-0 top-[60px] bg-brand-navy/95 backdrop-blur-xl md:hidden z-40"
          >
            <div className="flex flex-col p-6 gap-2">
              {LANDING_NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="text-left py-3 px-4 rounded-lg text-brand-slate hover:text-white hover:bg-brand-emerald/10 transition-colors min-h-[44px]"
                >
                  {link.label}
                </button>
              ))}
              <hr className="border-brand-emerald/10 my-2" />
              <Link
                to="/login"
                className="py-3 px-4 rounded-lg text-brand-slate hover:text-white min-h-[44px] flex items-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="py-3 px-4 rounded-full bg-brand-emerald text-brand-navy font-semibold text-center min-h-[44px] flex items-center justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
