import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  groups = []
}) {
  const [typeFilter, setTypeFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [month, setMonth] = useState('')

  // Reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setTypeFilter('')
      setGroupFilter('')
      setSort('newest')
      setStartDate('')
      setEndDate('')
      setMonth('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4'>

      <div className='bg-gray-100 dark:bg-gray-800 w-full max-w-md rounded-xl p-6 shadow-2xl shadow-black relative animate-fadeIn'>

        {/* Close Button */}
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-bold'>Filter</h2>
          <button
            onClick={onClose}
            className='p-1 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'
          >
            <XMarkIcon className='w-6 h-6' />
          </button>
        </div>

        {/* Expense Type */}
        <div className='mb-4'>
          <p className='font-medium mb-2'>Expense Type</p>
          <div className='flex flex-wrap gap-2'>

            {['Wifi', 'Food', 'Travel', 'Home'].map(item => (
              <button
                key={item}
                onClick={() => setTypeFilter(item)}
                className={
                  'px-4 py-1 rounded-full border text-sm ' +
                  (typeFilter === item
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100')
                }
              >
                {item}
              </button>
            ))}

          </div>
        </div>

        {/* Group Dropdown */}
        <div className='mb-4'>
          <p className='font-medium mb-2'>By Group:</p>

          <select
            className='w-full border rounded-lg px-3 py-2'
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
          >
            <option value=''>All Groups</option>

            {groups.map(g => (
              <option key={g.groupId} value={g.groupId}>
                {g.groupName}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className='mb-4'>
          <p className='font-medium mb-2'>Sort By</p>
          <div className='flex gap-3'>
            <button
              onClick={() => setSort('newest')}
              className={
                'px-4 py-2 rounded-lg border ' +
                (sort === 'newest'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'border-gray-300 text-gray-700')
              }
            >
              Newest
            </button>

            <button
              onClick={() => setSort('oldest')}
              className={
                'px-4 py-2 rounded-lg border ' +
                (sort === 'oldest'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'border-gray-300 text-gray-700')
              }
            >
              Oldest
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className='mb-4'>
          <p className='font-medium mb-2'>Date Range</p>
          <div className='flex gap-3'>
            <input
              type='date'
              className='border rounded-lg px-3 py-2 w-1/2'
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <input
              type='date'
              className='border rounded-lg px-3 py-2 w-1/2'
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Month Filter */}
        <div className='mb-6'>
          <p className='font-medium mb-2'>By Month</p>
          <select
            className='w-full border rounded-lg px-3 py-2'
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            <option value=''>Select Month</option>
            <option>January</option>
            <option>February</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>August</option>
            <option>September</option>
            <option>October</option>
            <option>November</option>
            <option>December</option>
          </select>
        </div>

        {/* Apply Filter */}
        <button
          className='w-full bg-green-500 text-white py-2 rounded-lg font-medium'
          onClick={() =>
            onApply({
              typeFilter,
              groupFilter,
              sort,
              startDate,
              endDate,
              month
            })
          }
        >
          Apply Filter
        </button>

      </div>

    </div>
  )
}