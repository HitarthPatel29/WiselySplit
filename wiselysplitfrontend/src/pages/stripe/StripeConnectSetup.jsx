import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useNotification } from '../../context/NotificationContext'

export default function StripeConnectSetup() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { showSuccess } = useNotification()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [stripeAccountId, setStripeAccountId] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await api.get(`/users/${userId}`)
        const data = res.data || {}
        setUserEmail(data.email || '')
        
        // Check if user already has Stripe account
        if (data.stripeAccountId) {
          setStripeAccountId(data.stripeAccountId)
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err)
        setError('Failed to load user information')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUserInfo()
    }
  }, [userId])

  const handleConnectStripe = async () => {
    if (!userEmail) {
      setError('Email is required to connect Stripe account')
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const res = await api.post('/payments/connect/create', {
        userId,
        email: userEmail,
      })

      if (res.data?.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = res.data.onboardingUrl
      } else {
        setError('Failed to get Stripe onboarding URL')
      }
    } catch (err) {
      console.error('Failed to create Stripe Connect account:', err)
      setError(
        err.response?.data?.error ||
          'Failed to connect Stripe account. Please try again.'
      )
    } finally {
      setConnecting(false)
    }
  }

  const handleReturnFromStripe = async () => {
    // Check if account was successfully connected
    try {
      const res = await api.get(`/users/${userId}`)
      if (res.data?.stripeAccountId) {
        setStripeAccountId(res.data.stripeAccountId)
        showSuccess('Stripe account connected successfully!', { asSnackbar: true })
      }
    } catch (err) {
      console.error('Failed to verify Stripe connection:', err)
    }
  }

  // Check if returning from Stripe onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('return') === 'true') {
      handleReturnFromStripe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Stripe Connect" />
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Stripe Connect" />
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Connect Your Stripe Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect your Stripe account to receive payments from other users.
          </p>

          {stripeAccountId ? (
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    Stripe Account Connected
                  </p>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                    Account ID: {stripeAccountId.substring(0, 20)}...
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                You can now receive payments through Stripe. Other users can pay
                you directly using Stripe.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> You need to connect a Stripe account to
                  receive payments. This is a one-time setup process.
                </p>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                  <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This email will be used for your Stripe account
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={connecting || !userEmail}
                  className={`w-full rounded-xl py-3 font-semibold transition ${
                    connecting || !userEmail
                      ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {connecting ? 'Connecting...' : 'Connect Stripe Account'}
                </button>
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <p className="font-semibold">What happens next?</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>You'll be redirected to Stripe's secure onboarding page</li>
                  <li>Complete your account setup (takes 2-3 minutes)</li>
                  <li>You'll be redirected back to WiselySplit</li>
                  <li>You can then receive payments from other users</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {stripeAccountId ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

