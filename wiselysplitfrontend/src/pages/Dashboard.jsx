// Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Header from '../components/Header.jsx'
import api from '../api'
import {
  UserGroupIcon,
  UserIcon,
  EnvelopeIcon,
  CreditCardIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid'

export default function Dashboard() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [stripeAccountId, setStripeAccountId] = useState(null)

  useEffect(() => {
    if (localStorage.getItem('firstLogin') === 'true') {
      navigate('/invite')
    }
  }, [navigate])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return
      try {
        const res = await api.get(`/users/${userId}`)
        const data = res.data || {}
        setUserData(data)
        if (data.stripeAccountId) {
          setStripeAccountId(data.stripeAccountId)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  const quickActions = [
    {
      title: 'Friends',
      description: 'Manage your friends',
      icon: UserIcon,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      onClick: () => navigate('/friends'),
    },
    {
      title: 'Groups',
      description: 'View and manage groups',
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      onClick: () => navigate('/groups'),
    },
    {
      title: 'Invites',
      description: 'View pending invites',
      icon: EnvelopeIcon,
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600',
      onClick: () => navigate('/dashboard/invites'),
    },
    {
      title: 'Send Invite',
      description: 'Invite a new friend',
      icon: EnvelopeIcon,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      onClick: () => navigate('/invite'),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" />
        <div 
          className="flex items-center justify-center p-6"
          role="status"
          aria-live="polite"
          aria-label="Loading dashboard"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true"></div>
            <p className="sr-only">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header title="Dashboard" />

      <main 
        id="main-content"
        className="max-w-4xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Welcome Section */}
        <section 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
          aria-labelledby="welcome-heading"
        >
          <h1 
            id="welcome-heading"
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Welcome {userData?.name ? `, ${userData.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your shared expenses, groups, and settlements all in one place.
          </p>
        </section>

        {/* Quick Actions Grid */}
        <section aria-labelledby="quick-actions-heading">
          <h2 
            id="quick-actions-heading"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" role="list">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div key={index} role="listitem" className="h-full">
                  <button
                    onClick={action.onClick}
                    className={`${action.color} ${action.hoverColor} w-full h-full min-h-[120px] rounded-xl p-4 text-white transition-all transform hover:scale-105 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 flex flex-col items-center justify-center`}
                    aria-label={`${action.title}: ${action.description}`}
                  >
                    <Icon className="w-8 h-8 mb-2" aria-hidden="true" />
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs opacity-90 mt-1 text-center">{action.description}</p>
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Stripe Payment Section */}
        <section 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          aria-labelledby="stripe-heading"
        >
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl" aria-hidden="true">
                <CreditCardIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 
                  id="stripe-heading"
                  className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1"
                >
                  Stripe Payments
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transfer money securely with Stripe
                </p>
              </div>
              {stripeAccountId && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400" role="status" aria-label="Stripe account connected">
                  <CheckCircleIcon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}
            </div>

            {/* How it works section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4" role="region" aria-labelledby="stripe-how-it-works">
              <div className="flex items-start gap-3 mb-3">
                <InformationCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <h3 
                    id="stripe-how-it-works"
                    className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2"
                  >
                    How to transfer money with Stripe
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400" role="list">
                    <li className="flex gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400" aria-hidden="true">1.</span>
                      <span>
                        When settling up with a friend or in a group, choose "Stripe" as your payment method.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400" aria-hidden="true">2.</span>
                      <span>
                        Enter the amount you want to send and complete the secure checkout process.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400" aria-hidden="true">3.</span>
                      <span>
                        The recipient must have a connected Stripe account to receive payments.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400" aria-hidden="true">4.</span>
                      <span>
                        Payments are processed securely and funds are transferred directly to the recipient's account.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Stripe Connect Section */}
            {!stripeAccountId ? (
              <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  <strong>Connect your Stripe account</strong> to receive payments from other users. This is a one-time setup that takes just a few minutes.
                </p>
                <button
                  onClick={() => navigate('/stripe/connect')}
                  className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
                  aria-label="Connect your Stripe account"
                >
                  Connect Stripe Account
                  <ArrowRightIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Your Stripe account is connected
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                      Account ID: {stripeAccountId.substring(0, 20)}...
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/stripe/connect')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="Manage Stripe account settings"
                  >
                    Manage
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Additional Actions */}
        <section 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          aria-labelledby="account-settings-heading"
        >
          <h2 
            id="account-settings-heading"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
          >
            Account Settings
          </h2>
          <div className="space-y-3" role="list">
            <div role="listitem">
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
                aria-label="Edit your profile"
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Edit Profile</span>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </button>
            </div>
            <div role="listitem">
              <button
                onClick={() => navigate('/personalSummary')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
                aria-label="View your personal expense summary"
              >
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Personal Summary</span>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}