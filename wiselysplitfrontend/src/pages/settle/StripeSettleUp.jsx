import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../../components/Header.jsx'
import api from '../../api'
import { formatCurrency, getSettlementMethodLabel } from '../../utils/settleUp.js'

export default function StripeSettleUp() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { payload, summary, returnTo } = state || {}
  const [processing, setProcessing] = useState(false)

  const handleComplete = async () => {
    if (!payload) {
      navigate(-1)
      return
    }

    try {
      setProcessing(true)
      await api.post('/expenses', payload)
      alert('Stripe settlement logged successfully!')
      navigate(returnTo || '/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to log settlement.')
    } finally {
      setProcessing(false)
    }
  }

  if (!payload) {
    return (
      <div className='min-h-screen'>
        <Header title='Stripe Checkout' />
        <main className='mx-auto max-w-lg px-4 py-10 text-center text-gray-600 dark:text-gray-400'>
          <p>Missing settlement data. Please start the settle-up process again.</p>
          <button
            className='mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </main>
      </div>
    )
  }

  const amount = formatCurrency(payload.amount)
  const targetName = summary?.targetName || 'your friend'
  const groupLabel = summary?.shareLabel

  return (
    <div className='min-h-screen'>
      <Header title='Stripe SettleUp' />
      <main className='mx-auto max-w-lg px-4 py-10'>
        <div className='rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900'>
          <p className='text-sm font-medium uppercase tracking-wide text-emerald-500'>
            Preview Flow
          </p>
          <h2 className='mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100'>
            Pay {targetName}
          </h2>
          {groupLabel && (
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Group: {groupLabel}
            </p>
          )}

          <div className='mt-6 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>Amount</p>
            <p className='text-3xl font-bold text-gray-900 dark:text-gray-100'>${amount}</p>
          </div>

          <div className='mt-6 space-y-3 text-sm text-gray-600 dark:text-gray-300'>
            <p>
              This is a placeholder screen while we wire up Stripe. When the actual integration
              lands, you’ll see a secure card form here. For now, clicking “Mark as Paid” will log a
              settlement expense with method “{getSettlementMethodLabel(payload.settlementMethod)}”.
            </p>
            <div className='rounded-xl bg-gray-50 p-4 text-gray-600 dark:bg-gray-800 dark:text-gray-300'>
              <p className='font-semibold'>What happens now?</p>
              <ul className='mt-2 list-disc pl-5'>
                <li>We pretend Stripe processed the payment successfully.</li>
                <li>We log a SettleUp expense so both parties see it in history.</li>
                <li>You get redirected back to where you started.</li>
              </ul>
            </div>
          </div>

          <div className='mt-8 space-y-3'>
            <button
              type='button'
              onClick={handleComplete}
              disabled={processing}
              className={`w-full rounded-xl py-3 font-semibold transition ${
                processing
                  ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-700'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {processing ? 'Processing...' : 'Mark as Paid'}
            </button>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='w-full rounded-xl border border-gray-200 py-3 font-semibold text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

