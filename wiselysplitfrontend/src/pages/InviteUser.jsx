//InviteUser.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextInput from '../components/TextInput'
import { UserPlusIcon, EnvelopeIcon } from '@heroicons/react/24/solid'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function InviteUser() {
    const navigate = useNavigate()
    const { userId } = useAuth()
    const [query, setQuery] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    // clear firstLogin flag (since user is already onboarding)
    setFirstLogin(false)

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!query.trim()) {
        setMessage('Please enter a username or email.')
        return
        }
        if (!userId) {
        setMessage('Error: user ID not available.')
        return
        }

        setLoading(true)
        setMessage('')

        try {
        const res = await api.post('/invite/send', {
            senderId: userId,
            target: query.trim()
        })
        setResult({ success: true, text: res.data.message })
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
        <AuthLayout
        title='Invite your friends'
        subtitle='Find your friends and start sharing expenses together!'
        >
        <button
            type='button'
            onClick={() => navigate(-1)}
            className='absolute top-4 left-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300'
        >
            ← Back
        </button>

        <form onSubmit={handleInvite} className='flex flex-col gap-4'>
            <TextInput
            id='search'
            label='Search user'
            placeholder='Enter username or email'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            />

            <button
            type='submit'
            disabled={loading}
            className='w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50'
            >
            {loading ? 'Sending...' : 'Send Invite'}
            </button>
        </form>

        {/* Display Result */}
        {result && (
            <div
            className={`mt-6 p-3 rounded-xl text-center font-medium ${
                result.success
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
            >
            {result.text}
            </div>
        )}

        {localStorage.getItem('firstLogin') && (
            <button
                onClick={() => navigate('/dashboard')}
                className='mt-6 w-full bg-gray-200 text-gray-700 rounded-xl py-2 hover:bg-gray-300'
            >
                Skip for now
            </button>
            )}
        </AuthLayout>
    )
}