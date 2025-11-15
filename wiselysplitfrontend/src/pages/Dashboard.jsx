// Dashboard.jsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header.jsx'

export default function Dashboard() {
  const { logout, userId } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('firstLogin') === 'true') {
      navigate('/invite')
    }
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard - {userId}</h1>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleLogout}
          className="rounded-xl bg-red-500 px-4 py-2 text-white font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Logout
        </button>

        <button
          onClick={() => navigate('/invite')}
          className="rounded-xl bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Invite
        </button>

        <button
          onClick={() => navigate('/dashboard/invites')}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          View Invites
        </button>

        {/* New button: navigate to Friends list */}
        <button
          onClick={() => navigate('/friends')}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-white font-semibold hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Friends
        </button>

        {/* Groups button */}
        <button
          onClick={() => navigate('/groups')}
          className="rounded-xl bg-purple-500 px-4 py-2 text-white font-semibold hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          Groups
        </button>

        {/* Edit Profile button */}
        <button
          onClick={() => navigate('/profile/edit')}
          className="rounded-xl bg-gray-200 px-4 py-2 text-gray-800 font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Edit Profile
        </button>
      </div>

      {/* Main Dashboard content */}
      <div className="text-gray-500 dark:text-gray-400">
        <p>Welcome to your WiselySplit dashboard.</p>
        <p>From here you can view pending invites, manage groups, and more.</p>
      </div>
    </div>
  )
}