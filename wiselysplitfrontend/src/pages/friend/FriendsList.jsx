// src/pages/friend/FriendsList.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import ListItemCard from '../../components/ListItem/ListItemCard.jsx'
import PrimaryButton from '../../components/IO/PrimaryButton.jsx'
import BackButton from '../../components/IO/BackButton.jsx'

export default function FriendsList() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [search, setSearch] = useState('')
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get(`/friends/${userId}`)
        setFriends(res.data || []) 
        console.log('Fetched friends:', friends)
        console.log('API response data:', res.data)
        if (!res.data || res.data.length === 0) setMessage('No friends right now.')
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
      (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.username || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className='p-6 text-gray-500'>Loading friends...</div>

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='w-full text-center py-4 border-b'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Friends</h1>
      </div>

      <div className='flex justify-center'>
        <header className='w-full max-w-2xl px-4 flex flex-col'>
          <p className='text-gray-600 dark:text-gray-400 text-2xl font-bold mb-1'>Individual Shared Expenses</p>
          <p className='text-gray-700 dark:text-gray-300 text-base font-bold mb-1'>
            Overall you are owed{' '}
            <span className='font-semibold text-emerald-600'>$9.4</span>
          </p>
        </header>
      </div>

      {/* Search + Add Friend */}
      <div className='flex justify-center w-full mb-6'>
        <div className='flex items-center gap-3 w-full max-w-2xl px-4'>
          <input
            type='text'
            placeholder='Search friends...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='flex-1 border border-gray-300 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          />
          <PrimaryButton label='Add Friend' onClick={() => navigate('/invite')} />
        </div>
      </div>

      {/* List */}
      <div className='flex justify-center'>
        <div className='w-full max-w-2xl px-4 space-y-3 pb-10'>
          {filteredFriends.map((f) => (
            <ListItemCard
              key={f.friendId || f.userId || f.id}
              avatar={f.profilePicture || f.ProfilePicture || f.avatar}
              name={f.name || f.friendName || ''}
              username={f.username || f.userName || ''}
              amount={f.amount || f.balance || 0}
              status={f.status || 'neutral'}
              onClick={() => navigate(`/friends/${f.friendId || f.userId || f.id}`)}
            />
          ))}

          {filteredFriends.length === 0 && (
            <p className='text-gray-500 dark:text-gray-400 text-center mt-10'>{message || 'No friends found.'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
