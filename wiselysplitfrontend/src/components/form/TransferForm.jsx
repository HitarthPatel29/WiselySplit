// src/components/form/TransferForm.jsx
// Self-contained wallet transfer form: Title, Amount, Date, From Wallet, To Wallet

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { useNotification } from '../../context/NotificationContext'

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
const selectClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 pr-9 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 appearance-none cursor-pointer'

export default function TransferForm({ wallets = [], onSubmit, onCancel, initialData }) {
  const { showError } = useNotification()

  const [transfer, setTransfer] = useState({
    title: '',
    amount: '',
    date: '',
    fromWalletId: null,
    toWalletId: null,
  })

  useEffect(() => {
    if (initialData) {
      setTransfer({
        title: initialData.title || '',
        amount: initialData.amount != null ? String(initialData.amount) : '',
        date: initialData.date || new Date().toLocaleDateString('en-CA'),
        fromWalletId: initialData.walletId ?? null,
        toWalletId: initialData.toWalletId ?? null,
      })
    } else if (!transfer.date) {
      const today = new Date().toLocaleDateString('en-CA')
      setTransfer((prev) => ({ ...prev, date: today }))
    }
  }, [initialData])

  const updateField = (e) => {
    const { name, value } = e.target
    setTransfer((prev) => ({ ...prev, [name]: value }))
  }

  const handleWalletSelect = (field) => (e) => {
    const val = e.target.value
    setTransfer((prev) => ({ ...prev, [field]: val === '' ? null : (Number(val) || val) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (transfer.fromWalletId != null && transfer.fromWalletId === transfer.toWalletId) {
      showError('From and To wallets must be different.', { asSnackbar: true })
      return
    }
    onSubmit({
      ...transfer,
      amount: parseFloat(transfer.amount) || 0,
    })
  }

  const hasWallets = Array.isArray(wallets) && wallets.length >= 2

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl">
      {/* Card 1: Base fields */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transfer title
            </label>
            <input
              type="text"
              name="title"
              value={transfer.title}
              onChange={updateField}
              required
              placeholder="e.g. Move savings"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">$</span>
                <input
                  type="number"
                  name="amount"
                  value={transfer.amount}
                  onChange={updateField}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={transfer.date}
                onChange={updateField}
                required
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Wallets */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 flex flex-col gap-4">
          {hasWallets ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From wallet
                </label>
                <div className="relative">
                  <select
                    name="fromWalletId"
                    value={transfer.fromWalletId === null ? '' : transfer.fromWalletId}
                    onChange={handleWalletSelect('fromWalletId')}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To wallet
                </label>
                <div className="relative">
                  <select
                    name="toWalletId"
                    value={transfer.toWalletId === null ? '' : transfer.toWalletId}
                    onChange={handleWalletSelect('toWalletId')}
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
            </div>
          ) : (
            <div className="rounded-lg bg-gray-100 dark:bg-gray-700/50 px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
              You need at least two wallets to make a transfer.
              You can add wallets from the Personal Expenses screen.
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          type="submit"
          className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition"
        >
          {initialData ? 'Update transfer' : 'Save transfer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
