import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import ListItemCard from '../../components/ListItem/ListItemCard.jsx'
import PrimaryButton from '../../components/IO/PrimaryButton.jsx'
import BackButton from '../../components/IO/BackButton.jsx'

export default function GroupsList() {
  const navigate = useNavigate()
  const { userId } = useAuth()
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
    }
    if (userId) fetchGroups()
  }, [userId])

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.subtitle || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b '>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Groups</h1>
      </div>
      <div className='flex justify-center'>
        <header className='w-full max-w-2xl px-4 flex flex-col'>
          <p className='text-gray-600 dark:text-gray-400 text-2xl font-bold mb-1'>Shared Expense Groups</p>
        </header>
      </div>
      {/* Search + Create Group */}
      <div className='flex justify-center w-full mb-6'>
        <div className='flex items-center gap-3 w-full max-w-2xl px-4'>
          <input
            type='text'
            placeholder='Search groups...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='flex-1 border border-gray-300 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          />
          <PrimaryButton label='Create Group' onClick={() => navigate('/groups/create')} />
        </div>
      </div>

      {/* List */}
      <div className='flex justify-center'>
        <div className='w-full max-w-2xl px-4 space-y-3 pb-10'>
          {filtered.map((g) => (
            <ListItemCard
              key={g.groupId}
              avatar={g.ProfilePicture || g.profilePicture || g.avatar}
              name={g.name}
              username={g.subtitle || g.groupType || ''}
              amount={g.amount || (g.overallStanding && g.overallStanding.amount) || 0}
              status={g.status || 'neutral'}
              onClick={() => navigate(`/groups/${g.groupId}`)}
            />
          ))}
          {filtered.length === 0 && (
            <p className='text-gray-500 dark:text-gray-400  text-center mt-10'>{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
