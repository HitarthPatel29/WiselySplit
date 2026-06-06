import React from 'react'

function TypeBadge({ kind }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
        kind === 'expense'
          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      }`}
    >
      {kind}
    </span>
  )
}

function cardBg(kind) {
  return kind === 'expense'
    ? 'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
    : 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
}

export default function ImportReviewList({ entries, keyOf, isIncluded, toggleEntry }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-6">
        No valid rows to import.
      </p>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <ul className="sm:hidden flex flex-col gap-2 max-h-64 overflow-y-auto">
        {entries.map((entry) => (
          <li
            key={keyOf(entry)}
            className={`flex items-center gap-3 rounded-xl border p-3 ${cardBg(entry.kind)}`}
          >
            <input
              type="checkbox"
              checked={isIncluded(entry)}
              onChange={() => toggleEntry(entry)}
              aria-label={`Include ${entry.title}`}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{entry.date}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                ${entry.amount.toFixed(2)}
              </span>
              <TypeBadge kind={entry.kind} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden sm:block max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 text-left">
            <tr>
              <th className="p-2 w-8" scope="col">
                <span className="sr-only">Include</span>
              </th>
              <th className="p-2" scope="col">Title</th>
              <th className="p-2" scope="col">Date</th>
              <th className="p-2 text-right" scope="col">Amount</th>
              <th className="p-2" scope="col">Type</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={keyOf(entry)} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={isIncluded(entry)}
                    onChange={() => toggleEntry(entry)}
                    aria-label={`Include ${entry.title}`}
                  />
                </td>
                <td className="p-2 text-gray-900 dark:text-gray-100">{entry.title}</td>
                <td className="p-2 text-gray-600 dark:text-gray-400">{entry.date}</td>
                <td className="p-2 text-right tabular-nums">${entry.amount.toFixed(2)}</td>
                <td className="p-2">
                  <TypeBadge kind={entry.kind} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
