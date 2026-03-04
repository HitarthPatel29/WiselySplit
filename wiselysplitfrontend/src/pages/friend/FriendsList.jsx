// src/pages/friend/FriendsList.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import ListItemCard from '../../components/ListItem/ListItemCard.jsx'
import PrimaryButton from '../../components/IO/PrimaryButton.jsx'
import Header from '../../components/Header.jsx'

export default function FriendsList() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [search, setSearch] = useState('')
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [overallNet, setOverallNet] = useState(0)

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get(`/friends/${userId}`)
        const list = res.data || []
        setFriends(res.data || []) 
        console.log('Fetched friends:', friends)
        console.log('API response data:', res.data)

        const totalNet = list.reduce(
          (sum, f) => sum + Number(f.netBalance || 0),
          0
        ).toFixed(2)
        console.log('Calculated overall net balance:', totalNet)
        setOverallNet(totalNet)

        if (!res.data || res.data.length === 0) setMessage('No Expenses Shared right now.')
      } catch (err) {
        console.error(err)
        setMessage(err.response?.data?.error || 'Failed to fetch friends.')
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchFriends()
  }, [userId])

  const filteredFriends = friends.filter(
    (f) =>
      (f.friendName || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.friendUsername || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className='min-h-screen'>
        <Header title='Friends List' />
        <div 
          className='p-6 text-gray-500 dark:text-gray-400'
          role="status"
          aria-live="polite"
          aria-label="Loading friends"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true"></div>
            <p className="sr-only">Loading friends...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <Header title='Friends List' />
      
      {/* Summary Card */}
      <div className='px-4 my-4'>
        <div
          role="status"
          aria-live="polite"
          aria-label={`Overall balance: ${overallNet > 0 ? `you are owed $${Math.abs(overallNet)}` : overallNet < 0 ? `you owe $${Math.abs(overallNet)}` : 'you are settled up'}`}
          className={`
            w-full max-w-2xl mx-auto relative overflow-hidden rounded-2xl p-5 shadow-sm border
            transition-all duration-300
            ${overallNet > 0
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-emerald-200/60 dark:border-emerald-800/50'
              : overallNet < 0
                ? 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 border-rose-200/60 dark:border-rose-800/50'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-900/50 border-gray-200 dark:border-gray-700'
            }
          `}
        >
          <div
            className={`absolute top-0 right-0 w-24 h-24 -translate-y-1/2 translate-x-1/2 rounded-full opacity-20 ${overallNet > 0 ? 'bg-emerald-400' : overallNet < 0 ? 'bg-rose-400' : 'bg-gray-400'}`}
            aria-hidden="true"
          />
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5'>
            {overallNet > 0 ? 'You are owed' : overallNet < 0 ? 'You owe' : 'All settled up'}
          </p>
          <p
            className={`
              text-2xl sm:text-3xl font-bold tabular-nums
              ${overallNet > 0
                ? 'text-emerald-700 dark:text-emerald-300'
                : overallNet < 0
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-gray-600 dark:text-gray-300'
              }
            `}
          >
            {overallNet !== 0 ? `$${Math.abs(overallNet)}` : 'Balanced'}
          </p>
        </div>
      </div>

      {/* Search + Add Friend + Add Expense */}
      <div className='flex justify-center w-full mb-6'>
        <div className='flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full max-w-2xl px-4'>

          {/* Search Bar — full width on mobile, flex-1 on larger screens */}
          <label htmlFor="friend-search" className="sr-only">Search friends</label>
          <input
            id="friend-search"
            type='text'
            placeholder='Search friends...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search friends by name or username"
            className='w-full sm:flex-1 sm:min-w-[200px] border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 
                      text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 
                      focus:ring-emerald-400'
          />

          {/* Buttons row — side by side on mobile, inline on larger screens */}
          <div className='flex gap-3 w-full sm:w-auto'>
            <button
              onClick={() => navigate(`/friends/0/add-expense`)}
              className='flex-1 sm:flex-none bg-emerald-200 text-emerald-700 
                        dark:text-emerald-700 dark:bg-emerald-200 font-semibold 
                        rounded-xl py-2 px-4 hover:bg-emerald-300 dark:hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400'
              aria-label="Add a new expense with a friend"
            >
              Add Expense
            </button>

            <PrimaryButton
              label='Add Friend'
              onClick={() => navigate('/invite')}
              className='flex-1 sm:flex-none whitespace-nowrap'
              ariaLabel="Send a friend invite"
            />
          </div>
          
        </div>
      </div>


      {/* List */}
      <main className='flex justify-center' aria-label="Friends list">
        <div className='w-full max-w-2xl px-4 space-y-3 pb-10' role="list">
          {filteredFriends.map((f) => (
            <div key={f.friendId} role="listitem">
              <ListItemCard
                avatar={f.profilePicture}
                name={f.friendName || ''}
                subtitle={f.friendUsername || ''}
                amount={Math.abs(f.netBalance)}
                status={f.netBalance > 0 ? 'lent' : f.netBalance < 0 ? 'owe' : 'neutral'}
                onClick={() => navigate(`/friends/${f.friendId}`)}
              />
            </div>
          ))}

          {filteredFriends.length === 0 && (
            <p 
              className='text-gray-500 dark:text-gray-400 text-center mt-10'
              role="status"
              aria-live="polite"
            >
              {message || 'No friends found.'}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
