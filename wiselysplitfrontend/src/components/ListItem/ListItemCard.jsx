// src/components/ListItem/ListItemCard.jsx
import React from 'react'

export default function ListItemCard({ 
  avatar, 
  name, 
  username, 
  amount, 
  status, // 'owe' | 'owed' | 'neutral'
  onClick 
}) {
  const colorClass = 
    status === 'owed' ? 'text-emerald-600' : 
    status === 'owe' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'

  const label = 
    status === 'owed' ? `Owes you $${amount}` :
    status === 'owe' ? `You owe $${amount}` :
    'Settled'

  return (
    <div
      onClick={onClick}
      className='flex items-center justify-between p-3 border border-gray-300 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-gray-100 transition cursor-pointer'
    >
      <div className='flex items-center gap-3'>
        <img
          src={avatar || 'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'}
          alt={name}
          className='w-10 h-10 rounded-full object-cover'
        />
        <div>
          <p className='font-medium text-gray-900 dark:text-gray-100 leading-tight'>{name}</p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>@{username}</p>
        </div>
      </div>
      <p className={`font-semibold ${colorClass}`}>{label}</p>
    </div>
  )
}