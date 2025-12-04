// src/components/ListItem/ExpenseItemCard.jsx
import React from 'react'

export default function ExpenseItemCard({
  date,
  title,
  subtitle,
  amount,
  type, // 'lent' | 'owe' | 'settle'
  highlight = false,
  onClick,
}) {
  const isSettle = type === 'settle'
  const wrapperStyles = isSettle
    ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800'
    : highlight
        ? 'bg-emerald-50 hover:bg-emerald-100'
        : 'bg-white dark:bg-gray-800 hover:shadow-sm'

  const amountLabel =
    type === 'lent'
      ? `you lent $${amount}`
      : type === 'owe'
        ? `you owe $${amount}`
        : type === 'settle'
          ? `settled $${amount}`
          : `$${amount}`

  const amountColor =
    type === 'lent'
      ? 'text-emerald-600'
      : type === 'owe'
        ? 'text-red-500'
        : type === 'settle'
          ? 'text-emerald-700 dark:text-emerald-300'
          : 'text-gray-500 dark:text-gray-400'

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-2 transition ${wrapperStyles}`}
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
      <p className={`font-semibold ${amountColor}`}>{amountLabel}</p>
    </div>
  )
}