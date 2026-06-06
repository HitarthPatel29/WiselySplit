import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import GlowPill from './GlowPill'

export default function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-brand-navy py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <GlowPill padding="px-4 py-2">
              <Logo size={24} onDarkBackground={true} />
            </GlowPill>
            <p className="text-brand-slate text-sm text-center md:text-left">
              Created by <a href="https://github.com/HitarthPatel29" className="text-emerald-500 hover:text-emerald-600 transition-colors">Hitarth Patel</a>
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer">
            <Link to="/login" className="text-sm text-brand-slate hover:text-brand-emerald transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm text-brand-slate hover:text-brand-emerald transition-colors">
              Sign Up
            </Link>
            <span className="text-sm text-brand-slate/60 cursor-default">Privacy</span>
            <span className="text-sm text-brand-slate/60 cursor-default">Terms</span>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-brand-slate/50">
          © {year} WiselySplit. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
