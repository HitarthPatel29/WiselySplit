// src/components/IO/BackButton.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ to, onClick, className = '', label = '← Back', type = 'button' }) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    if (onClick) return onClick(e)
    if (to) return navigate(to)
    navigate(-1)
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      className={`absolute top-4 left-4 rounded-lg bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
      aria-label={typeof label === 'string' && label !== '← Back' ? label : 'Go back to previous page'}
    >
      {label}
    </button>
  )
}