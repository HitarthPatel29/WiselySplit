import React, { useState } from 'react'

export default function PasswordInput({ id, label, value, onChange, required = true }) {
  const [show, setShow] = useState(false)
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
    </div>
  )
}