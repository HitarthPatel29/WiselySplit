import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import ListItemCard from '../../components/ListItem/ListItemCard.jsx'
import PrimaryButton from '../../components/IO/PrimaryButton.jsx'
import Header from '../../components/Header.jsx'

export default function GroupsList() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [overallNet, setOverallNet] = useState(0)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get(`/groups/${userId}`)
        const list = res.data || []
        setGroups(list)
        console.log('Fetched groups:', res.data)

        const totalNet = list.reduce((sum, g) => sum + Number(g.netBalance ?? 0), 0)
        setOverallNet(Number(totalNet.toFixed(2)))

        if (!res.data || res.data.length === 0)
          setMessage('No groups found.')
      } catch (err) {
        setMessage('Failed to load groups.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchGroups()
  }, [userId])

  const filtered = groups.filter(
    (g) =>
      g.groupName.toLowerCase().includes(search.toLowerCase()) ||
      (g.subtitle || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className='min-h-screen'>
        <Header title='Groups' />
        <div 
          className='flex items-center justify-center p-6'
          role="status"
          aria-live="polite"
          aria-label="Loading groups"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true"></div>
            <p className="sr-only">Loading groups...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <Header title='Groups' />

      {/* Summary Card */}
      <div className='px-4 my-4'>
        <div
          role="status"
          aria-live="polite"
          aria-label={`Overall balance: ${overallNet > 0 ? `you are owed $${Math.abs(overallNet)}` : overallNet < 0 ? `you owe $${Math.abs(overallNet)}` : 'you are settled up'}`}
          className={`
            w-full max-w-3xl mx-auto relative overflow-hidden rounded-2xl p-5 shadow-sm border
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

      {/* Search + Add Expense + Create Group */}
      <div className='flex justify-center w-full mb-6'>
        <div className='flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full max-w-3xl px-4'>

          <label htmlFor="group-search" className="sr-only">Search groups</label>
          <input
            id="group-search"
            type='text'
            placeholder='Search groups...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search groups by name or type"
            className='w-full sm:flex-1 sm:min-w-[200px] border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          />

          <div className='flex gap-3 w-full sm:w-auto'>
            <button
              onClick={() => (groups.length > 0 ? navigate(`/groups/${groups[0].groupId}/add-expense`) : navigate('/groups/create'))}
              className='flex-1 sm:flex-none bg-emerald-200 text-emerald-700 dark:text-emerald-700 dark:bg-emerald-200 font-semibold rounded-xl py-2 px-4 hover:bg-emerald-300 dark:hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400'
              aria-label="Add a new expense to a group"
            >
              Add Expense
            </button>

            <PrimaryButton
              label='Create Group'
              onClick={() => navigate('/groups/create')}
              className='flex-1 sm:flex-none whitespace-nowrap'
              ariaLabel="Create a new group"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <main className='flex justify-center' aria-label="Groups list">
        <div className='w-full max-w-3xl px-4 space-y-3 pb-10' role="list">
          {filtered.map((g) => (
            <div key={g.groupId} role="listitem">
              <ListItemCard
                avatar={g.ProfilePicture || g.profilePicture || g.avatar}
                name={g.groupName}
                subtitle={ g.type || g.groupType || ''}
                amount={g.amount || 0}
                status={g.status || 'neutral'}
                onClick={() => navigate(`/groups/${g.groupId}`)}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <p 
              className='text-gray-500 dark:text-gray-400 text-center mt-10'
              role="status"
              aria-live="polite"
            >
              {message || 'No groups found.'}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
