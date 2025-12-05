// src/components/Divider.jsx
import React from 'react'

export default function Divider({ text = 'or' }) {
  return (
    <div 
      className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 my-3'
      role="separator"
      aria-label={text}
    >
      <div className='h-px flex-1 bg-gray-200 dark:bg-gray-700' aria-hidden="true" />
      <span className='uppercase tracking-wider'>{text}</span>
      <div className='h-px flex-1 bg-gray-200 dark:bg-gray-700' aria-hidden="true" />
    </div>
  )
}