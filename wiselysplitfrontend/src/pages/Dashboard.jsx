// Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
      </div>

      {/* Main Dashboard content */}
      <div className="text-gray-600">
        <p>Welcome to your WiselySplit dashboard.</p>
        <p>From here you can view pending invites, manage groups, and more.</p>
      </div>
    </div>
  )
}