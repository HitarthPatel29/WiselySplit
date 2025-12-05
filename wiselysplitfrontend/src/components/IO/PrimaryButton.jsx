// src/components/IO/PrimaryButton.jsx
import React from 'react'

export default function PrimaryButton({ 
  label, 
  onClick, 
  color = 'emerald', 
  disabled = false,
  type = 'button',
  ariaLabel,
  ariaBusy,
  className = '',
  ...props
}) {
  const colorClass =
    color === 'emerald'
      ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'
      : color === 'blue'
      ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400'
      : 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-400'

  const baseClasses = 'px-4 py-2 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={ariaBusy}
      className={`${baseClasses} ${colorClass} ${className}`.trim()}
      {...props}
    >
      {label}
    </button>
  )
}