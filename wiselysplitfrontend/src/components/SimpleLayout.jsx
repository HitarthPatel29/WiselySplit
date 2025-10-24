import React from 'react'

export default function SimpleLayout({ title, subtitle, children }) {
  return (
    <div className='min-h-screen bg-gray-50 text-gray-800'>
      <header className='w-full bg-white shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{title}</h1>
          {subtitle && <p className='text-gray-600 text-sm'>{subtitle}</p>}
        </div>
      </header>

      <main className='p-6 max-w-5xl mx-auto'>{children}</main>
    </div>
  )
}