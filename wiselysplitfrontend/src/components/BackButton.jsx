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
      className={`absolute top-4 left-4 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 ${className}`}
    >
      {label}
    </button>
  )
}