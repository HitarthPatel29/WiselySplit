import React, { useState } from 'react'
import { DocumentArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/solid'

export default function ImportFileDropzone({
  fileInputRef,
  onChange,
  fileName,
  rowCount,
  parseError,
  maxRows,
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onChange({ target: { files: [file] } })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const openPicker = () => fileInputRef.current?.click()

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onChange}
        className="sr-only"
        aria-label="Choose CSV file"
      />
      <button
        type="button"
        onClick={openPicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
      >
        <DocumentArrowUpIcon className="w-10 h-10 mx-auto text-emerald-500 mb-2" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Choose file or drag here
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          CSV with header row · up to {maxRows} rows
        </p>
      </button>

      {fileName && !parseError && (
        <div
          className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2"
          role="status"
        >
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-emerald-800 dark:text-emerald-200 min-w-0">
            <span className="font-medium break-all">{fileName}</span>
            <span className="block text-emerald-700 dark:text-emerald-300">
              {rowCount} row{rowCount === 1 ? '' : 's'} detected
            </span>
          </div>
        </div>
      )}

      {parseError && (
        <div
          className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
          role="alert"
        >
          {parseError}
        </div>
      )}
    </div>
  )
}
