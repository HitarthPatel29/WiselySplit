// src/components/IO/PrimaryButton.jsx
import React from 'react'

export default function PrimaryButton({ label, onClick, color = 'emerald', disabled = false }) {
  const colorClass =
    color === 'emerald'
      ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'
      : color === 'blue'
      ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400'
      : 'bg-gray-300 hover:bg-gray-400 focus:ring-gray-400'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 ${colorClass}`}
    >
      {label}
    </button>
  )
}