// src/components/IO/TextInput.jsx
import React from 'react'

export default function TextInput({ id, label, type = 'text', placeholder = '', autoComplete, value, onChange, required = true }) {
  return (
    <div className='flex flex-col gap-1'>
      <label htmlFor={id} className='text-sm font-medium text-gray-500 dark:text-gray-400'>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        required={required}
        className='block w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
      />
    </div>
  )
}