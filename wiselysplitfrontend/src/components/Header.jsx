import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/IO/BackButton'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'

export default function Header({ title = '' }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className='w-full border-b relative'>
      {/* Top Row */}
      <div className='flex items-center justify-between px-4 py-4'>
        <BackButton />

        <h1 className='text-lg font-bold text-center flex-1'>
          {title}
        </h1>

        {/* Burger Icon */}
        <button
          onClick={() => setOpen(true)}
          className='p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700'
        >
          <Bars3Icon className='w-6 h-6' />
        </button>
      </div>

      {/* Slide-In Menu */}
      {open && (
        <div className='fixed inset-0 bg-black/40 z-50 flex justify-end'>
          <div className='w-64 h-full shadow-lg p-5 flex flex-col animate-slideLeft'>

            {/* Close button */}
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-bold'>Menu</h2>
              <button
                onClick={() => setOpen(false)}
                className='p-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'
              >
                <XMarkIcon className='w-6 h-6' />
              </button>
            </div>

            {/* Buttons */}
            <div className='flex flex-col gap-3'>

              <button
                onClick={handleLogout}
                className='rounded-xl bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600'
              >
                Logout
              </button>

              <button
                onClick={() => navigate('/invite')}
                className='rounded-xl bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600'
              >
                Invite
              </button>

              <button
                onClick={() => navigate('/dashboard/invites')}
                className='rounded-xl bg-emerald-500 px-4 py-2 text-white font-semibold hover:bg-emerald-600'
              >
                View Invites
              </button>

              <button
                onClick={() => navigate('/friends')}
                className='rounded-xl bg-indigo-500 px-4 py-2 text-white font-semibold hover:bg-indigo-600'
              >
                Friends
              </button>

              <button
                onClick={() => navigate('/groups')}
                className='rounded-xl bg-purple-500 px-4 py-2 text-white font-semibold hover:bg-purple-600'
              >
                Groups
              </button>

              <button
                onClick={() => navigate('/profile/edit')}
                className='rounded-xl bg-gray-200 px-4 py-2 text-gray-800 font-semibold hover:bg-gray-300'
              >
                Edit Profile
              </button>

              <button
                onClick={() => navigate('/personalSummary')}
                className='rounded-xl bg-yellow-500 px-4 py-2 text-gray-800 font-semibold hover:bg-yellow-600'
              >
                Personal Summary
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}