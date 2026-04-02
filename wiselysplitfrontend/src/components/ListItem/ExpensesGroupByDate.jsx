import React from 'react'
import ExpenseItemCard from './ExpenseItemCard.jsx'

const formatGroupDate = (raw) => {
  if (!raw) return ''
  try {
    const d = new Date(raw + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return raw
  }
}

export default function ExpensesGroupByDate({ date, expenses }) {
  if (!expenses || expenses.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
        {formatGroupDate(date)}
      </h3>
      <div className="rounded-xl mx-1 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-500">
        {expenses.map((item, idx) => (
          <ExpenseItemCard
            key={item.expenseId}
            title={item.title}
            subtitle={item.subtitle}
            amount={item.amount}
            userBalance={item.userBalance}
            type={item.cardType}
            highlight={item.highlight}
            grouped
            isLast={idx === expenses.length - 1}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  )
}
