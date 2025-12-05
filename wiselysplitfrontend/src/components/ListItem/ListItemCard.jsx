// src/components/ListItem/ListItemCard.jsx
import React from 'react'

export default function ListItemCard({ 
  avatar, 
  name, 
  subtitle, 
  amount, 
  status, // 'owe' | 'lent' | 'neutral'
  onClick 
}) {
  const colorClass = 
    status === 'lent' ? 'text-emerald-600' : 
    status === 'owe' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
  const label = 
    status === 'lent' ? `Owes you $${amount}` :
    status === 'owe' ? `You owe $${amount}` :
    'Settled'
  console.log('ListItemCard - name:', name) // --- IGNORE ---
  return (
    <button
      onClick={onClick}
      className='w-full flex items-center justify-between p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md hover:border-gray-100 dark:hover:border-gray-600 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400'
      aria-label={`${name}. ${label}${subtitle ? `. ${subtitle}` : ''}`}
    >
      <div className='flex items-center gap-3'>
        <img
          src={avatar || 'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'}
          alt={`${name} avatar`}
          className='w-10 h-10 rounded-full object-cover'
          aria-hidden="true"
        />
        <div className="text-left">
          <p className='font-medium text-gray-900 dark:text-gray-100 leading-tight'>{name}</p>
          {subtitle && (
            <p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
          )}
        </div>
      </div>
      <p className={`font-semibold ${colorClass}`} aria-hidden="true">{label}</p>
    </button>
  )
}
