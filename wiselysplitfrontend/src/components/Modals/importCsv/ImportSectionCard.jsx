import React from 'react'

export default function ImportSectionCard({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm ${className}`.trim()}
    >
      {title && (
        <div className="px-4 pt-4 pb-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div className="p-4 flex flex-col gap-4">{children}</div>
    </div>
  )
}
