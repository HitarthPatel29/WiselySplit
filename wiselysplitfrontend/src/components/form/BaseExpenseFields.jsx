// src/components/form/BaseExpenseFields.jsx
// Common expense details: title, date, type, amount (Card 1)

import React, { useEffect, useRef, useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/solid'
import api from '../../api'
import IconCombobox from '../IO/IconCombobox'
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories'

// Shared styles so dropdowns blend with text fields
const inputClass =
  'w-full appearance-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'

export default function BaseExpenseFields({ expense, onChange, errors = {} }) {
  const [suggestion, setSuggestion] = useState(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const lastFetchedTitle = useRef('')

  // Debounced category suggestion lookup whenever the title changes.
  useEffect(() => {
    const raw = (expense?.title ?? '').trim()
    if (raw.length < 3) {
      setSuggestion(null)
      setSuggestLoading(false)
      return
    }
    if (raw === lastFetchedTitle.current) return

    setSuggestLoading(true)
    const handle = setTimeout(async () => {
      try {
        console.log('fetching suggestion for', raw)
        const { data } = await api.get('/classify/predict', { params: { title: raw } })
        lastFetchedTitle.current = raw
        console.log('data', data)
        if (data && data.category) {
          console.log('suggestion found', data)
          setSuggestion({ category: data.category, confidence: data.confidence ?? 0 })
          // Track what the model predicted so backend can detect confirmation vs override on save.
          onChange({ target: { name: 'predictedCategory', value: data.category } })
        } else {
          console.log('no suggestion found')
          setSuggestion(null)
        }
      } catch {
        setSuggestion(null)
      } finally {
        setSuggestLoading(false)
      }
    }, 800)

    return () => clearTimeout(handle)
    // onChange is intentionally omitted from deps to avoid re-firing on identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense?.title])

  // Apply suggestion: set the category dropdown to what the model proposed.
  const applySuggestion = () => {
    if (!suggestion) return
    onChange({ target: { name: 'category', value: suggestion.category } })
  }

  const currentCategory = expense?.category ?? expense?.expenseType ?? ''
  const showChip =
    suggestion &&
    suggestion.category &&
    suggestion.category.toLowerCase() !== String(currentCategory).toLowerCase()

  if (!expense) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="p-4 grid grid-cols-2 gap-2">
        <div className="col-span-2">
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

          {showChip && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <SparklesIcon className="w-3.5 h-3.5" aria-hidden />
                Suggested: {suggestion.category}
                {suggestion.confidence ? (
                  <span className="opacity-70">({Math.round(suggestion.confidence * 100)}%)</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={applySuggestion}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Apply
              </button>
            </div>
          )}
          {!showChip && suggestLoading && (expense?.title ?? '').trim().length >= 3 && (
            <p className="mt-2 text-xs italic text-gray-400 dark:text-gray-500" aria-live="polite">
              Looking up category suggestion...
            </p>
          )}
        </div>
        <div className="col-span-2">
          <IconCombobox
            label="Expense Category"
            name="category"
            value={expense.category ?? expense.expenseType ?? ''}
            onChange={onChange}
            options={EXPENSE_CATEGORIES}
            placeholder="Select a type"
            required
            error={errors.category}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300 font-semibold">$</span>
            <input
              type="number"
              name="amount"
              value={
                (expense.amount === undefined || expense.amount === null)
                  ? (expense.totalAmount === 0 || expense.totalAmount === '' ? '' : expense.totalAmount)
                  : (expense.amount === 0 || expense.amount === '' ? '' : expense.amount)
              }
              onChange={onChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`${inputClass} min-w-0 flex-1`}
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
    </div>
  )
}
