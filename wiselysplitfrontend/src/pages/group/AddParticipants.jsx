import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { UserPlusIcon } from '@heroicons/react/24/solid'
import api from '../../api'
import BackButton from '../../components/IO/BackButton.jsx'

export default function AddParticipants() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId } = useAuth()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      setResult({ success: false, text: 'Please enter a username or email.' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log('✅ Sent group invite:', { groupId: id, senderId: userId, target: query.trim() })
      const res = await api.post(`/groups/${id}/invite`, {
        senderId: userId,
        target: query.trim()
      })
      setResult({ success: true, text: res.data.message })
      setQuery('')
    } catch (err) {
      console.error(err)
      setResult({
        success: false,
        text: err.response?.data?.error || 'Failed to send invite.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Add Participants</h1>
      </div>

      <main className='max-w-md md:max-w-xl mx-auto px-6 py-10'>
        <form onSubmit={handleInvite} className='flex flex-col gap-5'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Search by Username or Email:
            </label>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                name='query'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Enter username or email'
                className='flex-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
              />
              <button
                type='submit'
                disabled={loading}
                className='flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl p-2 transition disabled:opacity-60'
              >
                <UserPlusIcon className='w-6 h-6' />
                Invite
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {result && (
            <div
              className={`p-3 rounded-xl text-center font-medium ${
                result.success
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {result.text}
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
