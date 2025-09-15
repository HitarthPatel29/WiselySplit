import React from 'react'

export default function Divider({ text = 'or' }) {
  return (
    <div className='flex items-center gap-3 text-xs text-gray-500 my-3'>
      <div className='h-px flex-1 bg-gray-200' />
      <span className='uppercase tracking-wider'>{text}</span>
      <div className='h-px flex-1 bg-gray-200' />
    </div>
  )
}