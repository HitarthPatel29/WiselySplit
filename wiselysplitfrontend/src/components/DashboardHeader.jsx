// src/components/DashboardHeader.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  ChartBarIcon,
  CreditCardIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

export function Avatar({ user, size = 36, ring = true }) {
  const initials = getInitials(user?.name)
  const ringClass = ring ? 'ring-2 ring-white dark:ring-gray-700' : ''

  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt=""
        className={`rounded-full object-cover ${ringClass}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-emerald-500 text-white font-semibold ${ringClass}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  )
}

export default function DashboardHeader({ user, pendingInvites = 0 }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    function onPointer(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    logout()
    setOpen(false)
    navigate('/login')
  }

  const go = (path) => {
    navigate(path)
    setOpen(false)
  }

  const menuItems = [
    { icon: UserIcon, label: 'Edit Profile', path: '/profile/edit' },
    { icon: ChartBarIcon, label: 'Personal Summary', path: '/personalSummary' },
    { icon: CreditCardIcon, label: 'Personal Expenses', path: '/personalExpense' },
    { icon: EnvelopeIcon, label: 'View Invites', path: '/dashboard/invites', badge: pendingInvites },
    { icon: Cog6ToothIcon, label: 'Stripe Settings', path: '/stripe/connect' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-800/85 backdrop-blur-md transition-colors">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg px-1 py-1"
          aria-label="Go to Dashboard"
        >
          <Logo size={36} />
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate('/dashboard/invites')}
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label={`Notifications${pendingInvites > 0 ? ` (${pendingInvites} pending)` : ''}`}
          >
            <BellIcon
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-hidden="true"
            />
            {pendingInvites > 0 && (
              <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                {pendingInvites > 9 ? '9+' : pendingInvites}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              ref={triggerRef}
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:pr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label={`Account menu for ${user?.name || 'user'}`}
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <Avatar user={user} size={36} />
              <ChevronDownIcon
                className={`hidden sm:block w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  open ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {open && (
              <div
                ref={menuRef}
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-fadeIn z-50"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                  <Avatar user={user} size={44} ring={false} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user?.name || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                <ul className="py-1" role="none">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.path} role="none">
                        <button
                          role="menuitem"
                          onClick={() => go(item.path)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          <Icon
                            className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <div
                  className="border-t border-gray-200 dark:border-gray-700 py-1"
                  role="none"
                >
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <ArrowRightOnRectangleIcon
                      className="w-4 h-4 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
