//InviteUser.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../../components/IO/TextInput'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'

export default function InviteUser() {
    const navigate = useNavigate()
    const { userId } = useAuth()
    const [query, setQuery] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    // clear firstLogin flag (since user is already onboarding)
    const [firstLogin, setFirstLogin] = useState(localStorage.getItem('firstLogin'))

    

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

    localStorage.setItem('firstLogin', 'false')

    return (
        <div className='min-h-screen'>
            <Header title='Invite Users' />
            <div className='flex justify-center px-4 py-8'>
                <div className='w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8 transition-colors duration-300 text-gray-900 dark:text-gray-100'>
                    <header>
                        <h1 className='text-2xl font-semibold text-center'>Invite your friends</h1>
                        <p className='mt-1 text-center text-gray-500 dark:text-gray-400 text-sm'>
                            Find your friends and start sharing expenses together!
                        </p>
                    </header>

                    <div className='mt-6' role='region' aria-label='Invite a user'>
                        {/* Screen reader announcements */}
                        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                          {loading && 'Sending invite, please wait'}
                          {result && result.success && 'Invite sent successfully'}
                          {result && !result.success && 'Failed to send invite'}
                        </div>

                        <form onSubmit={handleInvite} className='flex flex-col gap-4' aria-label="Send friend invite form">
                            <TextInput
                            id='search'
                            label='Search user'
                            placeholder='Enter username or email'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            required={true}
                            />

                            <button
                            type='submit'
                            disabled={loading}
                            aria-busy={loading}
                            className='w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50'
                            >
                            {loading ? 'Sending...' : 'Send Invite'}
                            </button>
                        </form>

                        {/* Display Result */}
                        {result && (
                            <div
                            role="alert"
                            aria-live="polite"
                            className={`mt-6 p-3 rounded-xl text-center font-medium ${
                                result.success
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}
                            >
                            {result.text}
                            </div>
                        )}

                        {firstLogin == 'true' && (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className='mt-6 w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                aria-label="Skip inviting friends and go to dashboard"
                            >
                                Skip for now
                            </button>
                        )}
                        {firstLogin == 'false' && (
                            <button
                                onClick={() => navigate(-1)}
                                className='mt-6 w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400'
                                aria-label="Cancel and go back"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}