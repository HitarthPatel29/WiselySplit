import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import ListItemCard from '../../components/ListItem/ListItemCard.jsx'
import PrimaryButton from '../../components/IO/PrimaryButton.jsx'
import BackButton from '../../components/IO/BackButton.jsx'
import Header from '../../components/Header.jsx'

export default function GroupsList() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get(`/groups/${userId}`)
        setGroups(res.data || [])
        console.log('Fetched groups:', res.data)
        if (!res.data || res.data.length === 0)
          setMessage('No groups found.')
      } catch (err) {
        setMessage('Failed to load groups.')
        console.error(err)
      }
      finally {
        setLoading(false)
      }
    }
    if (userId) fetchGroups()
  }, [userId])

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
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
      <div className='flex justify-center'>
        <header className='w-full max-w-2xl px-4 flex flex-col'>
          <h1 className='text-gray-600 dark:text-gray-400 text-2xl font-bold mb-1'>Shared Expense Groups</h1>
        </header>
      </div>
      {/* Search + Create Group */}
      <div className='flex justify-center w-full mb-6'>
        <div className='flex items-center gap-3 w-full max-w-2xl px-4'>
          <label htmlFor="group-search" className="sr-only">Search groups</label>
          <input
            id="group-search"
            type='text'
            placeholder='Search groups...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search groups by name or type"
            className='flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          />
          <PrimaryButton 
            label='Create Group' 
            onClick={() => navigate('/groups/create')}
            ariaLabel="Create a new group"
          />
        </div>
      </div>

      {/* List */}
      <main className='flex justify-center' aria-label="Groups list">
        <div className='w-full max-w-2xl px-4 space-y-3 pb-10' role="list">
          {filtered.map((g) => (
            <div key={g.groupId} role="listitem">
              <ListItemCard
                avatar={g.ProfilePicture || g.profilePicture || g.avatar}
                name={g.name}
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
