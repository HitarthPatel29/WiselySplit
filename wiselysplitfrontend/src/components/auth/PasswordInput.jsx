// src/components/auth/PasswordInput.jsx
import React, { useState, useEffect } from 'react'

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  required = true,
  showStrength = false,
  onStrengthChange // NEW
}) {
  const [show, setShow] = useState(false)
  const [criteria, setCriteria] = useState({
    upper: false,
    lower: false,
    digit: false,
    special: false,
    length: false
  })
  const [strength, setStrength] = useState(0)

  useEffect(() => {
    if (showStrength && value) {
      const checks = {
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        digit: /[0-9]/.test(value),
        special: /[^A-Za-z0-9]/.test(value),
        length: value.length >= 8
      }
      setCriteria(checks)
      const newStrength = Object.values(checks).filter(Boolean).length
      setStrength(newStrength)

      if (onStrengthChange) {
        onStrengthChange(newStrength, checks) 
      }
    } else {
      setCriteria({ upper: false, lower: false, digit: false, special: false, length: false })
      setStrength(0)
      if (onStrengthChange) onStrengthChange(0, {})
    }
  }, [value, showStrength])

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Not Good Enough', 'Strong']

  const strengthId = showStrength ? `${id}-strength` : undefined
  const criteriaId = showStrength ? `${id}-criteria` : undefined

  return (
    <div className='flex flex-col gap-1'>
      <label 
        htmlFor={id} 
        className='text-sm font-medium text-gray-500 dark:text-gray-400'
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <div className='relative'>
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          placeholder='••••••••'
          autoComplete={onChange?.name?.includes('password') ? 'new-password' : 'current-password'}
          value={value}
          onChange={onChange}
          required={required}
          aria-required={required}
          aria-describedby={[strengthId, criteriaId].filter(Boolean).join(' ') || undefined}
          className='block w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
        />
        <button
          type='button'
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow(s => !s)}
          className='absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400'
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      {showStrength && value && (
        <div className='mt-2' role="status" aria-live="polite">
          {/* Strength bar */}
          <div 
            className='w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'
            role="progressbar"
            aria-valuenow={strength}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-label={`Password strength: ${strengthLabels[strength - 1] || 'Too Short'}`}
          >
            <div
              className={`h-2 ${strengthColors[strength - 1] || 'bg-gray-300'}`}
              style={{ width: `${(strength / 5) * 100}%` }}
              aria-hidden="true"
            ></div>
          </div>
          <p 
            id={strengthId}
            className={`mt-1 text-xs font-medium ${strength > 4 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {strengthLabels[strength - 1] || 'Too Short'}
          </p>

          {/* Criteria list */}
          <ul 
            id={criteriaId}
            className='mt-2 text-xs space-y-1'
            aria-label="Password requirements"
          >
            <li className={criteria.upper ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              <span aria-hidden="true">✓</span> At least one uppercase letter
            </li>
            <li className={criteria.lower ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              <span aria-hidden="true">✓</span> At least one lowercase letter
            </li>
            <li className={criteria.digit ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              <span aria-hidden="true">✓</span> At least one digit
            </li>
            <li className={criteria.special ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              <span aria-hidden="true">✓</span> At least one special character
            </li>
            <li className={criteria.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              <span aria-hidden="true">✓</span> Minimum 8 characters
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}