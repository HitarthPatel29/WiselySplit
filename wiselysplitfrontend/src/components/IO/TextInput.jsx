// src/components/IO/TextInput.jsx
import React from 'react'

export default function TextInput({ 
  id, 
  label, 
  type = 'text', 
  placeholder = '', 
  autoComplete, 
  value, 
  onChange, 
  required = true,
  error,
  ariaDescribedBy,
  ...props 
}) {
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className='flex flex-col gap-1'>
      <label 
        htmlFor={id} 
        className='text-sm font-medium text-gray-500 dark:text-gray-400'
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`block w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 ${
          error 
            ? 'border-red-500 dark:border-red-400' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      />
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}