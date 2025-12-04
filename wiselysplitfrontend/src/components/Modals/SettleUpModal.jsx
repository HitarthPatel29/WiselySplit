import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '../../utils/settleUp.js'

export default function SettleUpModal({
  open,
  context,
  onClose,
  onLogSettlement,
  onStripeSettlement,
  loading = false,
}) {
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (open && context) {
      setAmount(formatCurrency(context.suggestedAmount || context.maxAmount || 0))
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
    onLogSettlement?.(Number(numericAmount.toFixed(2)))
  }

  const handleStripe = () => {
    if (disableActions) return
    onStripeSettlement?.(Number(numericAmount.toFixed(2)))
  }

  return createPortal(
    <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'>
      <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>Settle Up</h3>
            {maxAmount!==Number.MAX_SAFE_INTEGER && <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              You currently owe {targetName} up to ${formatCurrency(maxAmount)}.
            </p>}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200'
            aria-label='Close settle modal'
          >
            ✕
          </button>
        </div>

        <div className='mt-5'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>Amount</label>
          <div className='mt-1 flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800'>
            <span className='mr-2 text-gray-500 dark:text-gray-300'>$</span>
            <input
              type='number'
              min='0.01'
              step='0.01'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='w-full bg-transparent text-gray-900 outline-none dark:text-gray-100'
            />
          </div>
          {isTooHigh && (
            <p className='mt-2 text-sm text-red-500'>Amount cannot exceed what you owe.</p>
          )}
          {isInvalid && (
            <p className='mt-2 text-sm text-red-500'>Enter a valid amount greater than zero.</p>
          )}
        </div>

        <div className='mt-6 space-y-3'>
          <button
            type='button'
            disabled={disableActions}
            onClick={handleLog}
            className={`w-full rounded-xl py-3 font-semibold transition ${
              disableActions
                ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-500'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {loading ? 'Logging...' : 'Log Settlement'}
          </button>
          <button
            type='button'
            disabled={disableActions}
            onClick={handleStripe}
            className={`w-full rounded-xl border py-3 font-semibold transition ${
              disableActions
                ? 'cursor-not-allowed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500'
                : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400'
            }`}
          >
            Pay Using Stripe
          </button>
          <button
            type='button'
            onClick={onClose}
            className='w-full rounded-xl py-3 font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

