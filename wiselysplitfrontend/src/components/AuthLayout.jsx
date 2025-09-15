import React from 'react'

export default function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div className='min-h-screen w-full bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='bg-white shadow-xl rounded-2xl p-6 sm:p-8'>
          <h1 className='text-2xl font-semibold text-center'>{title}</h1>
          {subtitle ? <p className='mt-1 text-center text-gray-500 text-sm'>{subtitle}</p> : null}
          <div className='mt-6'>{children}</div>
          {footer ? <div className='mt-6'>{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}