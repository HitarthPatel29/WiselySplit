import React from 'react'
import { CheckIcon } from '@heroicons/react/24/solid'
import { STEPS } from './constants'

export default function ImportStepBar({ current }) {
  return (
    <div className="mb-4 sm:mb-6">
      <p className="sr-only" aria-live="polite">
        Step {current + 1} of {STEPS.length}: {STEPS[current]}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:hidden">
        Step {current + 1} of {STEPS.length} · {STEPS[current]}
      </p>
      <ol className="flex items-center w-full" aria-label="Import progress">
        {STEPS.map((label, idx) => {
          const done = idx < current
          const active = idx === current
          return (
            <li key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-semibold border-2 transition-colors ${
                    done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : active
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> : idx + 1}
                </span>
                <span
                  className={`hidden sm:block mt-1 text-xs ${
                    active ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 sm:mx-2 ${done ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
