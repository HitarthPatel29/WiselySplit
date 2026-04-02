import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import { formatCurrency } from '../../utils/settleUp.js'
import { useAuth } from '../../context/AuthContext'

export default function SettleUpModal({
  open,
  context,
  onClose,
  onLogSettlement,
  onStripeSettlement,
  loading = false,
}) {
  const { wallets } = useAuth()
  const [amount, setAmount] = useState('')
  const [selectedWalletId, setSelectedWalletId] = useState('')

  useEffect(() => {
    if (open && context) {
      setAmount(formatCurrency(context.suggestedAmount || context.maxAmount || 0))
      setSelectedWalletId('')
    }
  }, [open, context])

  const { maxAmount = 0, targetName = 'friend' } = context || {}

  const { numericAmount, isTooHigh, isInvalid } = useMemo(() => {
    const num = Number(amount)
    return {
      numericAmount: Number.isNaN(num) ? 0 : num,
      isTooHigh: num > maxAmount,
      isInvalid: Number.isNaN(num) || num <= 0,
    }
  }, [amount, maxAmount])

  if (!open) return null

  const disableActions = loading || isInvalid || isTooHigh ||!maxAmount

  const handleLog = () => {
    if (disableActions) return
    const walletId = selectedWalletId === '' ? null : (Number(selectedWalletId) || selectedWalletId)
    onLogSettlement?.(Number(numericAmount.toFixed(2)), walletId)
  }

  const handleStripe = () => {
    if (disableActions) return
    onStripeSettlement?.(Number(numericAmount.toFixed(2)))
  }

  return createPortal(
    <div 
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'
      role="presentation"
      aria-hidden={!open}
      onClick={onClose}
    >
      <div 
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900'
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-up-title"
        aria-describedby="settle-up-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start justify-between'>
          <div>
            <h3 
              id="settle-up-title"
              className='text-xl font-semibold text-gray-900 dark:text-gray-100'
            >
              Settle Up
            </h3>
            {maxAmount!==Number.MAX_SAFE_INTEGER && (
              <p 
                id="settle-up-description"
                className='mt-1 text-sm text-gray-500 dark:text-gray-400'
              >
                You currently owe {targetName} up to ${formatCurrency(maxAmount)}.
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded'
            aria-label='Close settle up modal'
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className='mt-5'>
          <label 
            htmlFor="settle-amount"
            className='block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            Amount
          </label>
          <div className='mt-1 flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800'>
            <span className='mr-2 text-gray-500 dark:text-gray-300' aria-hidden="true">$</span>
            <input
              id="settle-amount"
              type='number'
              min='0.01'
              step='0.01'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-required="true"
              aria-invalid={isTooHigh || isInvalid}
              aria-describedby={isTooHigh || isInvalid ? "amount-error" : undefined}
              className='w-full bg-transparent text-gray-900 outline-none focus:ring-2 focus:ring-emerald-400 dark:text-gray-100'
            />
          </div>
          {(isTooHigh || isInvalid) && (
            <p 
              id="amount-error"
              role="alert"
              aria-live="polite"
              className='mt-2 text-sm text-red-500 dark:text-red-400'
            >
              {isTooHigh 
                ? 'Amount cannot exceed what you owe.' 
                : 'Enter a valid amount greater than zero.'}
            </p>
          )}
        </div>

        {wallets.length > 0 && (
          <div className='mt-4'>
            <label
              htmlFor="settle-wallet"
              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
            >
              Deduct from Wallet
            </label>
            <div className='relative'>
              <select
                id="settle-wallet"
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className='w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 pr-9 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 appearance-none cursor-pointer'
              >
                <option value="">None</option>
                {wallets.map((w) => {
                  const id = w.walletId ?? w.id
                  const name = w.walletName ?? w.name ?? `Wallet ${id}`
                  return (
                    <option key={id} value={id}>
                      {name} — ${formatCurrency(w.walletBalance ?? w.balance ?? 0)}
                    </option>
                  )
                })}
              </select>
              <ChevronDownIcon
                className='absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none'
                aria-hidden
              />
            </div>
          </div>
        )}

        <div className='mt-6 space-y-3'>
          <button
            type='button'
            disabled={disableActions}
            onClick={handleLog}
            aria-busy={loading}
            className={`w-full rounded-xl py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              disableActions
                ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-500'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400'
            }`}
          >
            {loading ? 'Logging...' : 'Log Settlement'}
          </button>
          <button
            type='button'
            disabled={disableActions}
            onClick={handleStripe}
            className={`w-full rounded-xl border py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              disableActions
                ? 'cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500'
                : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 focus:ring-emerald-400'
            }`}
          >
            Pay Using Stripe
          </button>
          <button
            type='button'
            onClick={onClose}
            className='w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-gray-400'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

