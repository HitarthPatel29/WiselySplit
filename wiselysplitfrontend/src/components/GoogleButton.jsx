import React from 'react'

export default function GoogleButton({ label = 'Sign in with Google' }) {
  return (
    <button type='button' className='w-full rounded-xl border border-gray-300 bg-white py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400'>
      <span className='inline-flex items-center justify-center gap-2'>
        <svg aria-hidden='true' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 533.5 544.3' className='h-4 w-4'>
          <path fill='#4285F4' d='M533.5 278.4a320 320 0 0 0-4.7-55.4H272v105h147.3a126 126 0 0 1-54.7 82.6l88.4 68.7c51.6-47.6 80.5-117.8 80.5-200.9z'/>
          <path fill='#34A853' d='M272 544.3c73.1 0 134.5-24.1 179.3-65.8l-88.4-68.7c-24.6 16.5-56.3 26.1-90.9 26.1-69.8 0-128.9-47.1-150.1-110.3l-91.9 71.1C68.4 480.1 163.5 544.3 272 544.3z'/>
          <path fill='#FBBC05' d='M121.9 325.6a179.5 179.5 0 0 1 0-106.9l-91.9-71.1a272 272 0 0 0 0 249.1l91.9-71.1z'/>
          <path fill='#EA4335' d='M272 107.7c39.8 0 75.6 13.7 103.7 40.6l77.7-77.7C406.3 25.3 345 0 272 0 163.5 0 68.4 64.2 39 157.2l91.9 71.5C143.1 154.8 202.2 107.7 272 107.7z'/>
        </svg>
        <span>{label}</span>
      </span>
    </button>
  )
}