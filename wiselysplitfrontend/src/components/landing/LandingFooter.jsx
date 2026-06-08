import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../Logo'
import GlowPill from './GlowPill'

export default function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <GlowPill padding="px-4 py-2">
              <Logo size={24} />
            </GlowPill>
            <p className="text-gray-600 dark:text-gray-200 text-sm text-center md:text-left">
              Created by <a href="https://github.com/HitarthPatel29" className="text-emerald-500 hover:text-emerald-600 transition-colors">Hitarth Patel</a>
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer">
            <Link to="/login" className="text-sm text-gray-600 hover:text-emerald-500 dark:text-gray-200 dark:hover:text-emerald-500 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm text-gray-600 hover:text-emerald-500 dark:text-gray-200 dark:hover:text-emerald-500 transition-colors">
              Sign Up
            </Link>
            <span className="text-sm text-gray-400 dark:text-gray-200/60 cursor-default">Privacy</span>
            <span className="text-sm text-gray-400 dark:text-gray-200/60 cursor-default">Terms</span>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-200/50">
          © {year} WiselySplit. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
