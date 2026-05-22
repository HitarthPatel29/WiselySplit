// src/components/form/SharedExpenseFields.jsx
// Second card for shared expense: Share With, Paid By, Wallet (if payer is user), Bill Split, split details

import React from 'react'
import { ChevronDownIcon, UserGroupIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { getFriendOweOptions } from '../../utils/expenseModel'
import IconCombobox from '../IO/IconCombobox'

const selectClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 pr-9 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 appearance-none cursor-pointer'

function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? 'Toggle'}
      className={`w-10 h-5 flex items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
        checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`h-4 w-4 bg-white rounded-full shadow transform transition ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

// Build IconCombobox options from the raw friends/groups list. Each entry needs
// a stringified value (so the existing parseInt-based handler keeps working),
// an avatar URL or a fallback icon, and a suffix for the "(Group)" hint.
function buildShareWithOptions(friendsAndGroups) {
  return friendsAndGroups.map((p) => {
    const isGroup = p.type === 'group'
    return {
      value: String(p.id),
      label: p.name,
      suffix: isGroup ? '(Group)' : undefined,
      imageUrl: p.profilePicture,
      Icon: isGroup ? UserGroupIcon : UserCircleIcon,
    }
  })
}

export default function SharedExpenseFields({
  expense,
  friendsAndGroups = [],
  currentUserId,
  equalSplit,
  billSplitApplied,
  wallets = [],
  onShareWithChange,
  onPayerChange,
  onWalletChange,
  onOpenBillSplit,
  onFieldChange,
  toggleInclude,
  onEqualToggle,
  onPortionChange,
  onAmountChange,
}) {
  if (!expense) return null

  const isPayerUser = (expense.payerId ?? currentUserId) === currentUserId
  const walletId = expense.walletId ?? ''

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      <div className="p-4 flex flex-col gap-4">
        <IconCombobox
          label="Share expense with"
          ariaLabel="Share expense with"
          value={expense.shareWithId ?? ''}
          options={buildShareWithOptions(friendsAndGroups)}
          onChange={onShareWithChange}
        />

        <div className={`grid gap-4 ${isPayerUser ? 'grid-cols-1 sm:grid-cols-2' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paid by
            </label>
            <div className="relative">
              <select
                name="payerId"
                value={expense.payerId ?? ''}
                onChange={(e) => onPayerChange(parseInt(e.target.value, 10))}
                required
                className={selectClass}
              >
                <option value={currentUserId}>You</option>
                {expense.shareWithType === 'group' &&
                  (expense.splitDetails || []).map((m, i) => (
                    <option key={i} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                {expense.shareWithType === 'friend' && expense.shareWithId && (
                  <option value={expense.shareWithId}>{expense.shareWith}</option>
                )}
              </select>
              <ChevronDownIcon
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none"
                aria-hidden
              />
            </div>
          </div>
          {isPayerUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet (optional)
              </label>
              <div className="relative">
                <select
                  name="walletId"
                  value={walletId === null ? '' : walletId}
                  onChange={(e) => {
                    const val = e.target.value
                    onWalletChange(val === '' ? null : (Number(val) || val))
                  }}
                  className={selectClass}
                >
                  <option value="">No wallet</option>
                  {(wallets || []).map((w) => {
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
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={onOpenBillSplit}
            className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-2 px-4 hover:bg-emerald-600 transition text-sm"
          >
            Split a bill
          </button>
        </div>

        {!billSplitApplied && expense.shareWithType === 'friend' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who owes
            </label>
            <div className="relative">
              <select
                name="owes"
                value={expense.owes ?? ''}
                onChange={onFieldChange}
                required
                className={selectClass}
              >
                <option value="">Select option</option>
                {getFriendOweOptions(expense.shareWith).map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none"
                aria-hidden
              />
            </div>
          </div>
        )}

        {(billSplitApplied || expense.shareWithType === 'group') &&
          Array.isArray(expense.splitDetails) &&
          expense.splitDetails.length > 0 && (
            <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Split between
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span>Equally</span>
                  <ToggleSwitch
                    checked={equalSplit}
                    onChange={onEqualToggle}
                    ariaLabel="Toggle equal split"
                  />
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white dark:bg-gray-800">
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                      Amount ($)
                    </th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-gray-300">
                      Portion
                    </th>
                    <th className="text-center p-3 font-semibold text-gray-700 dark:text-gray-300">
                      Include
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expense.splitDetails.map((m, i) => {
                    const rowDisabled = !m.include
                    const lockInputs = equalSplit || rowDisabled
                    return (
                      <tr
                        key={i}
                        className={`border-t border-gray-200 dark:border-gray-600 ${
                          rowDisabled ? 'opacity-50 bg-gray-50 dark:bg-gray-700/50' : ''
                        }`}
                      >
                        <td className="p-3 text-gray-900 dark:text-gray-100">{m.name}</td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={m.amount === '' ? '' : m.amount}
                            step="0.01"
                            min="0"
                            disabled={lockInputs}
                            onChange={(e) => onAmountChange(i, e.target.value)}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value)
                              if (!isNaN(val)) onAmountChange(i, val.toFixed(2))
                            }}
                            className="w-20 text-right border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={m.portion === '' ? '' : Number(m.portion)}
                            min="0"
                            step="1"
                            disabled={lockInputs}
                            onChange={(e) => onPortionChange(i, e.target.value)}
                            className="w-14 text-right border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                          />
                        </td>
                        <td className="text-center p-3">
                          <input
                            type="checkbox"
                            checked={!!m.include}
                            onChange={() => toggleInclude(i)}
                            className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-400"
                          />
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 font-semibold">
                    <td className="p-3 text-right text-gray-700 dark:text-gray-300">Total:</td>
                    <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                      $
                      {expense.splitDetails
                        .reduce((s, m) => s + (m.include ? Number(m.amount) || 0 : 0), 0)
                        .toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-gray-900 dark:text-gray-100">
                      {expense.splitDetails
                        .reduce((s, m) => s + (m.include ? Number(m.portion) || 0 : 0), 0)
                        .toFixed(0)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  )
}
