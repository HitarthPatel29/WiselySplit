// src/components/form/PersonalExpenseFields.jsx
// Second card for personal expense: wallet selection only

import React from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'

const selectClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 pr-9 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 appearance-none cursor-pointer'

export default function PersonalExpenseFields({ expense, wallets = [], onWalletChange }) {
  const walletId = expense?.walletId ?? ''
  const hasWallets = Array.isArray(wallets) && wallets.length > 0

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="p-4 flex flex-col gap-4">
        {hasWallets ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select wallet
            </label>
            <div className="relative">
              <select
                name="walletId"
                value={walletId === null ? '' : walletId}
                onChange={(e) => {
                  const val = e.target.value
                  onWalletChange(val === '' ? null : (Number(val) || val))
                }}
                required
                className={selectClass}
                aria-required="true"
              >
                <option value="">Choose a wallet...</option>
                {wallets.map((w) => {
                  const id = w.walletId ?? w.id
                  const name = w.walletName ?? w.name ?? `Wallet ${id}`
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  )
                })}
              </select>
              <ChevronDownIcon
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none"
                aria-hidden
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-100 dark:bg-gray-700/50 px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
            You don&apos;t have any wallets yet. This expense will be saved without a wallet.
            You can add wallets from the Personal Expenses screen.
          </div>
        )}
      </div>
    </div>
  )
}
