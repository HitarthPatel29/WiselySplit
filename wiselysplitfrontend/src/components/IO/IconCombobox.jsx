// src/components/IO/IconCombobox.jsx
// Reusable dropdown that shows a leading icon (or avatar) next to the selected
// label and each option. Mirrors the native <select> contract by emitting a
// synthetic change event { target: { name, value } } so existing onChange
// handlers continue to work as drop-in replacements.

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'

const triggerClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 flex items-center gap-3 text-left cursor-pointer min-h-[42px]'

function OptionIcon({ option, size = 'sm' }) {
  // Larger circle (options list) gets an inset icon; smaller circle (trigger)
  // lets the icon fill so it stays legible at button height.
  const iconClass = size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'
  const { imageUrl, Icon } = option
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="w-full h-full object-cover" />
  }
  if (Icon) {
    return <Icon className={`${iconClass} text-gray-500 dark:text-gray-400`} aria-hidden />
  }
  return null
}

export default function IconCombobox({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  required = false,
  error,
  ariaLabel,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  const handleSelect = (opt) => {
    onChange?.({ target: { name, value: String(opt.value) } })
    setOpen(false)
  }

  const accessibleLabel = ariaLabel ?? label

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden>
              *
            </span>
          )}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={accessibleLabel}
        aria-invalid={!!error}
        className={`${triggerClass} ${
          error ? 'border-red-500 dark:border-red-400' : ''
        }`}
      >
        {selected ? (
          <>
            <span className="flex-shrink-0 w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <OptionIcon option={selected} size="sm" />
            </span>
            <span className="flex-1 truncate">
              {selected.label}
              {selected.suffix ? ` ${selected.suffix}` : ''}
            </span>
          </>
        ) : (
          <span className="flex-1 truncate text-gray-500 dark:text-gray-400">
            {placeholder}
          </span>
        )}
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open && options.length > 0 && (
        <ul
          role="listbox"
          aria-label={accessibleLabel}
          className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-h-56 overflow-auto py-1"
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <li
                key={opt.value === '' ? 'empty' : opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <OptionIcon option={opt} size="lg" />
                </span>
                <span className="truncate">
                  {opt.label}
                  {opt.suffix ? ` ${opt.suffix}` : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
