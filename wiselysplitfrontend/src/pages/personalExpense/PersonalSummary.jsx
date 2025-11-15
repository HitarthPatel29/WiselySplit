// src/pages/summary/PersonalSummary.jsx
import React, { useMemo, useState } from 'react'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'

export default function PersonalSummary() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // all | lent | owe

  // Dummy data for now
  const expenses = useMemo(
    () => [
      {
        id: 1,
        date: 'Mar 01',
        title: 'Lunch with client',
        subtitle: 'You lent to Trish',
        amount: 45,
        type: 'lent',
      },
      {
        id: 2,
        date: 'Mar 02',
        title: 'Lunch with client',
        subtitle: 'You owe Jay M.',
        amount: 25,
        type: 'owe',
      },
      {
        id: 3,
        date: 'Mar 04',
        title: 'Lunch with client',
        subtitle: 'You lent to Jay M.',
        amount: 100,
        type: 'lent',
      },
      {
        id: 4,
        date: 'Mar 07',
        title: 'Lunch with client',
        subtitle: 'You owe Trish',
        amount: 15,
        type: 'owe',
      },
      {
        id: 5,
        date: 'Mar 10',
        title: 'Lunch with client',
        subtitle: 'You lent to Trish',
        amount: 150,
        type: 'lent',
      },
    ],
    []
  )

  const totalLent = useMemo(
    () =>
      expenses
        .filter((e) => e.type === 'lent')
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  const totalOwed = useMemo(
    () =>
      expenses
        .filter((e) => e.type === 'owe')
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  const filteredExpenses = expenses.filter((ex) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(search.toLowerCase()) ||
      ex.subtitle.toLowerCase().includes(search.toLowerCase())

    const matchesType = filterType === 'all' ? true : ex.type === filterType

    return matchesSearch && matchesType
  })

  const handleFilterClick = () => {
    // Simple cycle: all -> lent -> owe -> all
    setFilterType((prev) =>
      prev === 'all' ? 'lent' : prev === 'lent' ? 'owe' : 'all'
    )
  }

  const filterLabel =
    filterType === 'all'
      ? 'Filter: All'
      : filterType === 'lent'
      ? 'Filter: Lent'
      : 'Filter: Owe'

  return (
    <div className='min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100'>
      {/* Top header bar */}
      <div className='w-full text-center py-4 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Personal Summary</h1>
      </div>

      {/* Main content container */}
      <div className='max-w-4xl mx-auto px-4 py-5 sm:py-6'>
        {/* Page title (matches desktop screenshot) */}
        <h2 className='text-xl sm:text-2xl font-semibold mb-4'>
          Personal Summary
        </h2>

        {/* Search + Filter */}
        <div className='flex flex-col sm:flex-row sm:items-center gap-3 mb-4'>
          <input
            type='text'
            placeholder='Search...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='flex-1 border border-gray-300 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400'
          />

          <button
            type='button'
            onClick={handleFilterClick}
            className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700'
          >
            <span>Filter</span>
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              {filterLabel.replace('Filter: ', '')}
            </span>
          </button>
        </div>

        {/* Totals */}
        <div className='mb-6 text-sm sm:text-base'>
          <p className='font-semibold'>
            Total Amount Lent:{' '}
            <span className='text-emerald-600'>
              ${totalLent.toFixed(2)}
            </span>
          </p>
          <p className='font-semibold'>
            Total Amount Owed:{' '}
            <span className='text-red-500'>
              ${totalOwed.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Expenses heading */}
        <h3 className='text-lg font-semibold mb-2'>Expenses</h3>

        {/* Expense list */}
        <div className='flex flex-col gap-3 pb-10'>
          {filteredExpenses.map((ex) => (
            <ExpenseItemCard
              key={ex.id}
              date={ex.date} // 'Mar 01' → your ExpenseItemCard splits this into month/day
              title={ex.title}
              subtitle={ex.subtitle}
              amount={ex.amount}
              type={ex.type} // 'lent' | 'owe' → controls green/red text
              onClick={() => {}}
            />
          ))}

          {filteredExpenses.length === 0 && (
            <p className='text-gray-500 dark:text-gray-400 text-center mt-6'>
              No expenses found for this search/filter.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}