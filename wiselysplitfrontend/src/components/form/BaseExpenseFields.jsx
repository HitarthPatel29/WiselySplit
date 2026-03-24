// src/components/form/BaseExpenseFields.jsx
// Common expense details: title, date, type, amount (Card 1)

import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'

const EXPENSE_TYPES = [
  { value: '', label: 'Select a type' },
  { value: 'Work', label: 'Work' },
  { value: 'Food', label: 'Food' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Other', label: 'Other' },
]

// Shared styles so dropdowns blend with text fields
const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
const selectClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 pr-9 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 appearance-none cursor-pointer'

export default function BaseExpenseFields({ expense, onChange, errors = {} }) {
  if (!expense) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="p-4 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expense title
          </label>
          <input
            type="text"
            name="title"
            value={expense.title ?? ''}
            onChange={onChange}
            required
            placeholder="e.g. Lunch with client"
            className={inputClass}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-700 dark:text-gray-300 font-semibold">$</span>
              <input
                type="number"
                name="amount"
                value={expense.amount === 0 || expense.amount === '' ? '' : expense.amount}
                onChange={onChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className={inputClass}
                aria-invalid={!!errors.amount}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={expense.date ?? ''}
              onChange={onChange}
              required
              className={inputClass}
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expense type
          </label>
          <div className="relative">
            <select
              name="type"
              value={expense.type ?? ''}
              onChange={onChange}
              required
              className={selectClass}
              aria-invalid={!!errors.type}
            >
              {EXPENSE_TYPES.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none"
              aria-hidden
            />
          </div>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type}</p>
          )}
        </div>
      </div>
    </div>
  )
}
