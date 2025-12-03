import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  groups = [],
  initialFilters = {}
}) {
  const [typeFilter, setTypeFilter] = useState(initialFilters.typeFilter || [])
  const [groupFilter, setGroupFilter] = useState(initialFilters.groupFilter || '')
  const [sort, setSort] = useState(initialFilters.sort || 'newest')
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')
  const [month, setMonth] = useState(initialFilters.month || '')

  // Update fields when modal opens with current filter values
  useEffect(() => {
    if (isOpen) {
      setTypeFilter(initialFilters.typeFilter || [])
      setGroupFilter(initialFilters.groupFilter || '')
      setSort(initialFilters.sort || 'newest')
      setStartDate(initialFilters.startDate || '')
      setEndDate(initialFilters.endDate || '')
      setMonth(initialFilters.month || '')
    }
  }, [isOpen, initialFilters])

  // Toggle expense type in the filter array
  const toggleTypeFilter = (item) => {
    setTypeFilter(prev => 
      prev.includes(item) 
        ? prev.filter(t => t !== item) 
        : [...prev, item]
    )
  }

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

        {/* Expense Type (multi-select) */}
        <div className='mb-4'>
          <p className='font-medium mb-2'>Expense Type {typeFilter.length > 0 && <span className='text-sm text-gray-500'>({typeFilter.length} selected)</span>}</p>
          <div className='flex flex-wrap gap-2'>

            {['Work', 'Food', 'Travel', 'Personal', 'Utilities', 'Entertainment', 'Other'].map(item => (
              <button
                key={item}
                onClick={() => toggleTypeFilter(item)}
                className={
                  'px-4 py-1 rounded-full border text-sm transition-colors ' +
                  (typeFilter.includes(item)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700')
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
                  : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200')
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
                  : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200')
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
              onChange={e => {
                setStartDate(e.target.value)
                setMonth('') // Clear month filter when date range is manually changed
              }}
            />
            <input
              type='date'
              className='border rounded-lg px-3 py-2 w-1/2'
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value)
                setMonth('') // Clear month filter when date range is manually changed
              }}
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

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <button
            className='flex-1 border border-gray-300 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
            onClick={() => {
              setTypeFilter([])
              setGroupFilter('')
              setSort('newest')
              setStartDate('')
              setEndDate('')
              setMonth('')
            }}
          >
            Clear All
          </button>
          <button
            className='flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors'
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

    </div>
  )
}