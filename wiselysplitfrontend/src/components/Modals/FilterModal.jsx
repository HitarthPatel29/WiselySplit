import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'

export default function FilterModal({
  isOpen,
  onClose,
  onApply,
  groups = [],
  initialFilters = {}
}) {
  const modalRef = useRef(null)
  const [typeFilter, setTypeFilter] = useState(initialFilters.typeFilter || [])
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.categoryFilter || [])
  const [groupFilter, setGroupFilter] = useState(initialFilters.groupFilter || '')
  const [sort, setSort] = useState(initialFilters.sort || 'newest')
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')
  const [month, setMonth] = useState(initialFilters.month || '')

  // Update fields when modal opens with current filter values
  useEffect(() => {
    if (isOpen) {
      setTypeFilter(initialFilters.typeFilter || [])
      setCategoryFilter(initialFilters.categoryFilter || [])
      setGroupFilter(initialFilters.groupFilter || '')
      setSort(initialFilters.sort || 'newest')
      setStartDate(initialFilters.startDate || '')
      setEndDate(initialFilters.endDate || '')
      setMonth(initialFilters.month || '')
    }
  }, [isOpen, initialFilters])

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      if (firstElement) {
        firstElement.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Toggle expense type in the filter array
  const toggleTypeFilter = (item) => {
    setTypeFilter(prev =>
      prev.includes(item)
        ? prev.filter(t => t !== item)
        : [...prev, item]
    )
  }

  // Toggle category (Personal / Shared / Settlements) in the filter array
  const toggleCategoryFilter = (item) => {
    setCategoryFilter(prev =>
      prev.includes(item)
        ? prev.filter(c => c !== item)
        : [...prev, item]
    )
  }

  if (!isOpen) return null

  return (
    <div 
      className='fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4'
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        className='bg-gray-100 dark:bg-gray-800 w-full max-w-md rounded-xl p-6 shadow-2xl shadow-black relative animate-fadeIn'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className='flex justify-between items-center mb-6'>
          <h2 id="filter-modal-title" className='text-xl font-bold'>Filter</h2>
          <button
            onClick={onClose}
            className='p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400'
            aria-label='Close filter modal'
          >
            <XMarkIcon className='w-6 h-6' aria-hidden="true" />
          </button>
        </div>

        {/* Expense Type (multi-select) */}
        <fieldset className='mb-4'>
          <legend className='font-medium mb-2'>
            Expense Type {typeFilter.length > 0 && (
              <span className='text-sm text-gray-500 dark:text-gray-400'>({typeFilter.length} selected)</span>
            )}
          </legend>
          <div className='flex flex-wrap gap-2' role="group" aria-label="Expense type filters">
            {['Work', 'Food', 'Travel', 'Personal', 'Utilities', 'Entertainment', 'Other'].map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleTypeFilter(item)}
                aria-pressed={typeFilter.includes(item)}
                className={
                  'px-4 py-1 rounded-full border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ' +
                  (typeFilter.includes(item)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700')
                }
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Personal / Shared / Settlements */}
        <fieldset className='mb-4'>
          <legend className='font-medium mb-2'>
            Show {categoryFilter.length > 0 && (
              <span className='text-sm text-gray-500 dark:text-gray-400'>({categoryFilter.length} selected)</span>
            )}
          </legend>
          <div className='flex flex-wrap gap-2' role="group" aria-label="Expense category filters">
            {[
              { value: 'personal', label: 'Personal' },
              { value: 'shared', label: 'Shared' },
              { value: 'settlements', label: 'Settlements' },
              { value: 'income', label: 'Income' },
              { value: 'transfer', label: 'Transfers' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleCategoryFilter(value)}
                aria-pressed={categoryFilter.includes(value)}
                className={
                  'px-4 py-1 rounded-full border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ' +
                  (categoryFilter.includes(value)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Group Dropdown */}
        <div className='mb-4'>
          <label htmlFor="group-filter" className='font-medium mb-2 block'>By Group:</label>
          <select
            id="group-filter"
            className='w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400'
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            aria-label="Filter by group"
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
        <fieldset className='mb-4'>
          <legend className='font-medium mb-2'>Sort By</legend>
          <div className='flex gap-3' role="radiogroup" aria-label="Sort order">
            <button
              type="button"
              onClick={() => setSort('newest')}
              role="radio"
              aria-checked={sort === 'newest'}
              aria-label="Sort by newest first"
              className={
                'px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-400 ' +
                (sort === 'newest'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700')
              }
            >
              Newest
            </button>

            <button
              type="button"
              onClick={() => setSort('oldest')}
              role="radio"
              aria-checked={sort === 'oldest'}
              aria-label="Sort by oldest first"
              className={
                'px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-400 ' +
                (sort === 'oldest'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700')
              }
            >
              Oldest
            </button>
          </div>
        </fieldset>

        {/* Date Range */}
        <div className='mb-4'>
          <p className='font-medium mb-2'>Date Range</p>
          <div className='flex gap-3'>
            <label htmlFor="start-date" className="sr-only">Start date</label>
            <input
              id="start-date"
              type='date'
              className='border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-emerald-400'
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value)
                setMonth('') // Clear month filter when date range is manually changed
              }}
              aria-label="Start date for filter"
            />
            <label htmlFor="end-date" className="sr-only">End date</label>
            <input
              id="end-date"
              type='date'
              className='border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 w-1/2 focus:outline-none focus:ring-2 focus:ring-emerald-400'
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value)
                setMonth('') // Clear month filter when date range is manually changed
              }}
              aria-label="End date for filter"
            />
          </div>
        </div>

        {/* Month Filter */}
        <div className='mb-6'>
          <label htmlFor="month-filter" className='font-medium mb-2 block'>By Month</label>
          <select
            id="month-filter"
            className='w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400'
            value={month}
            onChange={e => setMonth(e.target.value)}
            aria-label="Filter by month"
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
            type="button"
            className='flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400'
            onClick={() => {
              setTypeFilter([])
              setCategoryFilter([])
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
            type="button"
            className='flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400'
            onClick={() =>
              onApply({
                typeFilter,
                categoryFilter,
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