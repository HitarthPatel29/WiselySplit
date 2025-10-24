import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListItemCard from '../components/ListItemCard'
import PrimaryButton from '../components/PrimaryButton'
import BackButton from '../components/BackButton'

export default function GroupsList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Sample data (replace later with backend data)
  const groups = [
    { id: 1, name: 'Tech Innovators', subtitle: 'Shared Group', amount: 255, status: 'owed' },
    { id: 2, name: 'Artists', subtitle: 'Shared Group', amount: 255, status: 'owe' },
    { id: 3, name: 'Fitness Freaks', subtitle: 'Shared Group', amount: 255, status: 'owe' },
    { id: 4, name: 'Book Lovers', subtitle: 'Shared Group', amount: 255, status: 'owed' },
    { id: 5, name: 'Music Masters', subtitle: 'Shared Group', amount: 255, status: 'owed' },
    { id: 6, name: 'Foodies United', subtitle: 'Shared Group', amount: 255, status: 'owe' },
    { id: 7, name: 'Travel Buffs', subtitle: 'Shared Group', amount: 255, status: 'owe' },
  ]

  const filtered = groups.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase()) || (g.subtitle || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b border-gray-200'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Groups</h1>
      </div>

      <div className='flex justify-center'>
        <header className='w-full max-w-2xl px-4 flex flex-col'>
          <p className='text-gray-600 text-2xl font-bold mb-1'>Group Shared Expenses</p>
          <p className='text-gray-700 text-base font-bold mb-1'>
            Overall you are owed{' '}
            <span className='font-semibold text-emerald-600'>$9.4</span>
          </p>
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
            className='flex-1 border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          />
          <PrimaryButton label='Create Group' onClick={() => navigate('/groups/create')} />
        </div>
      </div>

      {/* List */}
      <div className='flex justify-center'>
        <div className='w-full max-w-2xl px-4 space-y-3 pb-10'>
          {filtered.map((g) => (
            <ListItemCard
              key={g.id}
              name={g.name}
              username={g.subtitle}
              amount={g.amount}
              status={g.status}
              onClick={() => navigate(`/groups/${g.id}`)}
            />
          ))}

          {filtered.length === 0 && (
            <p className='text-gray-500 text-center mt-10'>No groups found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
