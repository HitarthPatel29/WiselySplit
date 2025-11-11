// src/components/auth/AuthLayout.jsx
import React from 'react'

export default function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4 
                    bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 
                    transition-colors duration-300'>
      <div className='w-full max-w-md'>
        <div className='bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8 transition-colors duration-300'>
          <h1 className='text-2xl font-semibold text-center'>{title}</h1>
          {subtitle ? (
            <p className='mt-1 text-center text-gray-500 dark:text-gray-400 text-sm'>
              {subtitle}
            </p>
          ) : null}
          <div className='mt-6'>{children}</div>
          {footer ? <div className='mt-6'>{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}