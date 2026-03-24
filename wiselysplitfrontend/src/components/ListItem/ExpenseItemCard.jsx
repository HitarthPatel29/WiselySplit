// src/components/ListItem/ExpenseItemCard.jsx
import React from 'react'

export default function ExpenseItemCard({
  date,
  title,
  subtitle,
  amount,
  lentAmount,
  type, // 'lent' | 'owe' | 'settle' | 'personal' | 'income' | 'transfer' | 'group'
  highlight = false,
  onClick,
}) {
  const isSettle = type === 'settle'
  const isPersonal = type === 'personal'
  const isIncome = type === 'income'
  const isTransfer = type === 'transfer'
  const isGroup = type === 'group'

  const wrapperStyles = isSettle
    ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800'
    : isIncome
      ? 'bg-green-50/80 border-green-200 dark:bg-green-900/20 dark:border-green-700 hover:bg-green-100/80 dark:hover:bg-green-900/30'
      : isTransfer
        ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 hover:bg-amber-100/80 dark:hover:bg-amber-900/30'
        : isPersonal
          ? 'bg-indigo-50/50 border-indigo-200 dark:bg-gray-800 dark:border-indigo-700 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30'
          : isGroup
            ? 'bg-white dark:bg-gray-800 hover:shadow-sm border-gray-300 dark:border-gray-700'
            : highlight
              ? 'bg-emerald-50 hover:bg-emerald-100 border-gray-300 dark:border-gray-700'
              : 'bg-white dark:bg-gray-800 hover:shadow-sm border-gray-300 dark:border-gray-700'

  let topLabel, topColor, bottomLabel, bottomColor
  if (type === 'lent') {
    topLabel = 'You Lent'
    topColor = 'text-emerald-600'
    bottomLabel = `$${amount}`
    bottomColor = 'text-emerald-600'
  } else if (type === 'owe') {
    topLabel = 'You Owe'
    topColor = 'text-red-500'
    bottomLabel = `$${amount}`
    bottomColor = 'text-red-500'
  } else if (type === 'settle') {
    topLabel = 'Settled'
    topColor = 'text-emerald-700 dark:text-emerald-300'
    bottomLabel = `$${amount}`
    bottomColor = 'text-emerald-700 dark:text-emerald-300'
  } else if (type === 'income') {
    topLabel = 'Income'
    topColor = 'text-green-600 dark:text-green-400'
    bottomLabel = `+$${amount}`
    bottomColor = 'text-green-600 dark:text-green-400'
  } else if (type === 'transfer') {
    topLabel = 'Transfer'
    topColor = 'text-amber-600 dark:text-amber-400'
    bottomLabel = `$${amount}`
    bottomColor = 'text-amber-600 dark:text-amber-400'
  } else if (type === 'personal') {
    topLabel = 'Spent'
    topColor = 'text-indigo-600 dark:text-indigo-400'
    bottomLabel = `$${amount}`
    bottomColor = 'text-indigo-600 dark:text-indigo-400'
  } else if (type === 'group') {
    topLabel = `You Lent $${lentAmount}`
    topColor = 'text-emerald-600'
    bottomLabel = `Paid $${amount}`
    bottomColor = 'text-red-500'
  } else {
    topLabel = ''
    topColor = 'text-gray-500 dark:text-gray-400'
    bottomLabel = `$${amount}`
    bottomColor = 'text-gray-500 dark:text-gray-400'
  }

  const ariaAmount = type === 'group'
    ? `you lent $${lentAmount}, paid $${amount}`
    : `${topLabel} $${lentAmount}`

  return (
    <button
      onClick={onClick}
      className={`w-full flex cursor-pointer items-center justify-between rounded-xl border shadow-sm hover:shadow-md hover:border-gray-100 dark:hover:border-gray-600 px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${wrapperStyles}`}
      aria-label={`${title}. ${ariaAmount}${date ? ` on ${date}` : ''}${subtitle ? `. ${subtitle}` : ''}`}
    >
      {/* Left Section: Date + Info */}
      <div className='flex items-start gap-3 flex-1'>
        {date && (
          <div className='text-sm font-semibold w-12 text-center leading-tight' aria-hidden="true">
            {date?.split(' ')[0]} <br />
            <span className='text-base font-normal'>{date?.split(' ')[1]}</span>
          </div>
        )}
        <div className="text-left flex-1 min-w-0">
          <p className='font-medium text-gray-900 dark:text-gray-100 truncate'>{title}</p>
          {subtitle && (
            <p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Section: Amount (stacked) */}
      <div className="flex flex-col items-end shrink-0" aria-hidden="true">
        {topLabel && <p className={`text-xs ${topColor}`}>{topLabel}</p>}
        <p className={`font-semibold ${bottomColor}`}>{bottomLabel}</p>
      </div>
    </button>
  )
}