// src/components/ListItem/ExpenseItemCard.jsx
import React from 'react'

export default function ExpenseItemCard({
  date,
  title,
  subtitle,
  amount,
  type, // 'lent' | 'owe' | 'settle' | 'personal'
  highlight = false,
  onClick,
}) {
  const isSettle = type === 'settle'
  const isPersonal = type === 'personal'
  const wrapperStyles = isSettle
    ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800'
    : isPersonal
        ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30'
        : highlight
            ? 'bg-emerald-50 hover:bg-emerald-100 border-gray-300 dark:border-gray-700'
            : 'bg-white dark:bg-gray-800 hover:shadow-sm border-gray-300 dark:border-gray-700'

  const amountLabel =
    type === 'lent'
      ? `you lent $${amount}`
      : type === 'owe'
        ? `you owe $${amount}`
        : type === 'settle'
          ? `settled $${amount}`
          : type === 'personal'
            ? `$${amount}`
            : `$${amount}`

  const amountColor =
    type === 'lent'
      ? 'text-emerald-600'
      : type === 'owe'
        ? 'text-red-500'
        : type === 'settle'
          ? 'text-emerald-700 dark:text-emerald-300'
          : type === 'personal'
            ? 'text-indigo-700 dark:text-indigo-300'
            : 'text-gray-500 dark:text-gray-400'

  return (
    <button
      onClick={onClick}
      className={`w-full flex cursor-pointer items-center justify-between rounded-xl border shadow-sm hover:shadow-md hover:border-gray-100 dark:hover:border-gray-600 px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${wrapperStyles}`}
      aria-label={`${title}. ${amountLabel}${date ? ` on ${date}` : ''}${subtitle ? `. ${subtitle}` : ''}`}
    >
      {/* Left Section: Date + Info */}
      <div className='flex items-start gap-3 flex-1'>
        {/* Date */}
        {date && (
          <div className='text-sm font-semibold w-12 text-center leading-tight' aria-hidden="true">
            {date?.split(' ')[0]} <br />
            <span className='text-base font-normal'>{date?.split(' ')[1]}</span>
          </div>
        )}

        {/* Title + Subtitle */}
        <div className="text-left flex-1 min-w-0">
          <p className='font-medium text-gray-900 dark:text-gray-100 truncate'>{title}</p>
          {subtitle && (
            <p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Section: Amount */}
      <p className={`font-semibold ${amountColor}`} aria-hidden="true">{amountLabel}</p>
    </button>
  )
}