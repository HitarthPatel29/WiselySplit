import React, { useState, useEffect } from 'react'

export default function PasswordInput({ id, label, value, onChange, required = true, showStrength = false }) {
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
      setStrength(Object.values(checks).filter(Boolean).length)
    } else {
      setCriteria({ upper: false, lower: false, digit: false, special: false, length: false })
      setStrength(0)
    }
  }, [value, showStrength])

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className='flex flex-col gap-1'>
      <label htmlFor={id} className='text-sm font-medium text-gray-700'>{label}</label>
      <div className='relative'>
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          placeholder='••••••••'
          autoComplete='current-password'
          value={value}
          onChange={onChange}
          required={required}
          className='block w-full rounded-xl border border-gray-300 px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
        />
        <button
          type='button'
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow(s => !s)}
          className='absolute inset-y-0 right-2 my-auto h-8 rounded-md px-2 text-xs text-gray-600 hover:bg-gray-100'
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      {showStrength && value && (
        <div className='mt-2'>
          {/* Strength bar */}
          <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className={`h-2 ${strengthColors[strength - 1] || 'bg-gray-300'}`}
              style={{ width: `${(strength / 5) * 100}%` }}
            ></div>
          </div>
          <p className={`mt-1 text-xs font-medium ${strength >= 4 ? 'text-green-600' : 'text-gray-600'}`}>
            {strengthLabels[strength - 1] || 'Too Short'}
          </p>

          {/* Criteria list */}
          <ul className='mt-2 text-xs space-y-1'>
            <li className={criteria.upper ? 'text-green-600' : 'text-gray-500'}>✓ At least one uppercase letter</li>
            <li className={criteria.lower ? 'text-green-600' : 'text-gray-500'}>✓ At least one lowercase letter</li>
            <li className={criteria.digit ? 'text-green-600' : 'text-gray-500'}>✓ At least one digit</li>
            <li className={criteria.special ? 'text-green-600' : 'text-gray-500'}>✓ At least one special character</li>
            <li className={criteria.length ? 'text-green-600' : 'text-gray-500'}>✓ Minimum 8 characters</li>
          </ul>
        </div>
      )}
    </div>
  )
}