// src/components/ListItem/ExpenseItemCard.jsx
import React from 'react'

export default function ExpenseItemCard({
  date,
  title,
  subtitle,
  amount,
  type, // 'lent' | 'owe'
  highlight = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`flex justify-between items-center rounded-xl border border-gray-200 px-4 py-2 cursor-pointer transition
        ${highlight ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-white dark:bg-gray-800 hover:shadow-sm'}`}
    >
      {/* Left Section: Date + Info */}
      <div className='flex items-start gap-3'>
        {/* Date */}
        <div className='text-sm font-semibold w-12 text-center leading-tight'>
          {date?.split(' ')[0]} <br />
          <span className='text-base font-normal'>{date?.split(' ')[1]}</span>
        </div>

        {/* Title + Subtitle */}
        <div>
          <p className='font-medium'>{title}</p>
          {subtitle && <p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>}
        </div>
      </div>

      {/* Right Section: Amount */}
      <p
        className={`font-semibold ${
          type === 'lent' ? 'text-emerald-600' : type === 'owe' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {type === 'lent'
          ? `you lent $${amount}`
          : type === 'owe'
          ? `you owe $${amount}`
          : `$${amount}`}
      </p>
    </div>
  )
}