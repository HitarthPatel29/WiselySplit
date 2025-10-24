import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListItemCard from '../components/ListItemCard'
import PrimaryButton from '../components/PrimaryButton'
import BackButton from '../components/BackButton'

export default function FriendsList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Sample data (replace later with backend data)
  const friends = [
    { id: 1, name: 'Aurelia Voss', username: 'aurelia.v', amount: 255, status: 'owed' },
    { id: 2, name: 'Jaxon Lin', username: 'jaxon.l', amount: 200, status: 'owe' },
    { id: 3, name: 'Emery Kline', username: 'emery.k', amount: 350, status: 'owe' },
    { id: 4, name: 'Talia Wren', username: 'talia.v', amount: 100, status: 'owed' },
    { id: 5, name: 'Zane Harlow', username: 'zane.h', amount: 50, status: 'owe' },
    { id: 6, name: 'Rhea Sloan', username: 'rhea.s', amount: 300, status: 'owed' },
    { id: 7, name: 'Kieran Vale', username: 'kieran.v', amount: 45.6, status: 'owe' },
  ]

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      {/* Header */}
        <div className='w-full text-center py-5 border-b border-gray-200'>
            <BackButton />
            <h1 className='text-xl font-bold mb-1'>Friends</h1>
        </div>

        <div className='flex justify-center'>
            <header className='w-full max-w-2xl px-4 flex flex-col'>
            <p className='text-gray-600 text-2xl font-bold mb-1'>Individual Shared Expenses</p>
            <p className='text-gray-700 text-base font-bold mb-1'>
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
                className='flex-1 border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400'
            />
            <PrimaryButton label='Add Friend' onClick={() => navigate('/invite')} />
            </div>
        </div>

        {/* List */}
        <div className='flex justify-center'>
            <div className='w-full max-w-2xl px-4 space-y-3 pb-10'>
            {filteredFriends.map((f) => (
                <ListItemCard
                key={f.id}
                name={f.name}
                username={f.username}
                amount={f.amount}
                status={f.status}
                onClick={() => navigate(`/friends/${f.id}`)}
                />
            ))}

            {filteredFriends.length === 0 && (
                <p className='text-gray-500 text-center mt-10'>No friends found.</p>
            )}
            </div>
        </div>
        </div>
    )
}