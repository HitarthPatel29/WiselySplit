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
    status === 'owe' ? 'text-red-500' : 'text-gray-500'

  const label = 
    status === 'owed' ? `Owes you $${amount}` :
    status === 'owe' ? `You owe $${amount}` :
    'Settled'

  return (
    <div
      onClick={onClick}
      className='flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer'
    >
      <div className='flex items-center gap-3'>
        <img
          src={avatar || 'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'}
          alt={name}
          className='w-10 h-10 rounded-full object-cover'
        />
        <div>
          <p className='font-medium text-gray-900 leading-tight'>{name}</p>
          <p className='text-sm text-gray-500'>@{username}</p>
        </div>
      </div>
      <p className={`font-semibold ${colorClass}`}>{label}</p>
    </div>
  )
}