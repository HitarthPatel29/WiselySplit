import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bars3Icon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Header({ title = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)

  // Check if we're on the Dashboard page
  const isDashboard = location.pathname === '/dashboard'

  const handleLogout = () => {
    localStorage.clear()
    logout()
    navigate('/login')
    setOpen(false)
  }

  const handleMenuClick = (path) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <div className='w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300 sticky top-0 z-40'>
      {/* Top Row */}
      <div className='flex items-center justify-between px-4 py-4'>
        {/* Left side - Back button and Logo (non-Dashboard) or spacer */}
        <div className='flex items-center gap-2'>
          {!isDashboard && (
            <>
              <button
                onClick={() => navigate(-1)}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400'
                aria-label='Go back to previous page'
              >
                <ArrowLeftIcon className='w-6 h-6 text-gray-700 dark:text-gray-300' aria-hidden="true" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className='flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-1 py-1'
                aria-label='Go to Dashboard'
              >
                <Logo size={32} />
              </button>
            </>
          )}
        </div>

        {/* Center - Logo (Dashboard) or Title */}
        <div className='flex items-center justify-center flex-1'>
          {isDashboard ? (
            <button
              onClick={() => navigate('/dashboard')}
              className='flex items-center gap-2 hover:opacity-80 transition-opacity rounded-lg px-1 py-1'
              aria-label='Go to Dashboard'
            >
              <Logo size={48} />
            </button>
          ) : (
            <h1 className='text-2xl font-bold text-center text-gray-900 dark:text-gray-100'>
              {title}
            </h1>
          )}
        </div>

        {/* Right side - Menu button */}
        <div className='w-20 flex items-center justify-end'>
          <button
            onClick={() => setOpen(true)}
            className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400'
            aria-label='Open navigation menu'
            aria-expanded={open}
            aria-controls="navigation-menu"
          >
            <Bars3Icon className='w-6 h-6 text-gray-700 dark:text-gray-300' aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Slide-In Menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 bg-black/40 z-50 transition-opacity'
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <nav 
            id="navigation-menu"
            className='fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out'
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Menu Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100'>Menu</h2>
              <button
                onClick={() => setOpen(false)}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400'
                aria-label='Close menu'
              >
                <XMarkIcon className='w-6 h-6 text-gray-700 dark:text-gray-300' aria-hidden="true" />
              </button>
            </div>

            {/* Menu Items */}
            <div className='flex-1 overflow-y-auto p-4'>
              <ul className='flex flex-col gap-2' role="list">
                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/dashboard')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400'
                  >
                    Dashboard
                  </button>
                </li>

                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/friends')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400'
                  >
                    Friends
                  </button>
                </li>

                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/groups')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400'
                  >
                    Groups
                  </button>
                </li>

                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/invite')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400'
                  >
                    Send Invite
                  </button>
                </li>

                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/dashboard/invites')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400'
                  >
                    View Invites
                  </button>
                </li>

                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/personalSummary')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-semibold hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400'
                  >
                    Personal Summary
                  </button>
                </li>

                <li role="listitem">
                  <button
                    onClick={() => handleMenuClick('/profile/edit')}
                    className='w-full text-left px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400'
                  >
                    Edit Profile
                  </button>
                </li>
              </ul>
            </div>

            {/* Menu Footer */}
            <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={handleLogout}
                className='w-full rounded-xl bg-red-500 px-4 py-3 text-white font-semibold hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400'
              >
                Logout
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  )
}