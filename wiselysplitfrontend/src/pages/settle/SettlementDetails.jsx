// src/pages/settle/SettlementDetails.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header.jsx'
import api from '../../api'
import { useAuth } from '../../context/AuthContext.jsx'
import { normalizeExpenseForFields } from '../../utils/expenseModel.js'
import { formatCurrency, SETTLE_EXPENSE_TYPE } from '../../utils/settleUp.js'
import SettleUpModal from '../../components/Modals/SettleUpModal.jsx'

const formatFullDate = (raw) => {
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return raw
  }
}

export default function SettlementDetails() {
  const { id, expenseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || null
  const { userId, friendsAndGroups } = useAuth()

  const initial = location.state?.isSettleUp ? location.state : null
  const [expense, setExpense] = useState(initial)
  const [loading, setLoading] = useState(!initial)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [modalContext, setModalContext] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    const hasFullDetails = expense && expense.splitDetails && expense.splitDetails.length > 0 && expense.payer
    if (hasFullDetails) {
      setLoading(false)
      return () => {
        ignore = true
      }
    }

    const fetchExpense = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/expenses/${expenseId}`)
        if (ignore) return
        const normalized = normalizeExpenseForFields(res.data, userId, friendsAndGroups)
        setExpense(normalized)
      } catch (err) {
        console.error(err)
        if (!ignore) setError('Failed to load settlement details.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchExpense()
    return () => {
      ignore = true
    }
  }, [expenseId, expense, userId, friendsAndGroups])

  const isStripe = Boolean(expense?.paymentId)
  const subtitle = isStripe ? 'Settled via Stripe' : 'Settled Manually'

  const { payerLabel, receiverLabel, receiverId, receiverName } = useMemo(() => {
    if (!expense) {
      return { payerLabel: 'Payer', receiverLabel: 'Recipient', receiverId: null, receiverName: 'Recipient' }
    }

    const payerIsYou = Number(expense.payerId) === Number(userId)
    const participants = expense.splitDetails || []
    const receiverEntry =
      participants.find((p) => Number(p.userId) !== Number(expense.payerId)) || participants[0]

    const receiverIsYou = receiverEntry && Number(receiverEntry.userId) === Number(userId)

    return {
      payerLabel: payerIsYou ? 'You' : expense.payer || 'Unknown',
      receiverLabel: receiverEntry
        ? receiverIsYou
          ? 'You'
          : receiverEntry.name || expense.shareWith || 'Recipient'
        : expense.shareWith || 'Recipient',
      receiverId: receiverEntry?.userId || null,
      receiverName: receiverEntry?.name || expense?.shareWith || 'Recipient',
    }
  }, [expense, userId])

  const amountDisplay = expense ? formatCurrency(expense.amount) : '0.00'

  const handleOpenEditModal = () => {
    if (!expense || isStripe) return
    setModalContext({
      targetName: receiverLabel === 'You' ? payerLabel : receiverLabel,
      suggestedAmount: Number(expense.amount) || 0,
      maxAmount: Number.MAX_SAFE_INTEGER,
    })
    setShowEditModal(true)
  }

  const buildSplitDetails = (nextAmount) => {
    const targetId = receiverId || expense?.splitDetails?.[0]?.userId
    const updated = (expense?.splitDetails || []).map((split) => {
      const portion = split.portion || split.portions || 1
      if (targetId && Number(split.userId) === Number(targetId)) {
        return { ...split, amount: nextAmount, portion }
      }
      if (split.amount > 0 && !targetId) {
        return { ...split, amount: nextAmount, portion }
      }
      return { ...split, amount: 0, portion }
    })

    const hasTarget = updated.some((s) => Number(s.userId) === Number(targetId) && s.amount > 0)
    if (!hasTarget && targetId) {
      updated.push({
        userId: targetId,
        name: receiverName,
        amount: nextAmount,
        portion: 1,
        include: true,
      })
    }
    return updated
  }

  const buildUpdatePayload = (nextAmount, paymentIdOverride = expense?.paymentId || null) => ({
    title: expense?.title || `Settle up`,
    date: expense?.date,
    type: expense?.type || SETTLE_EXPENSE_TYPE,
    amount: nextAmount,
    payerId: expense?.payerId,
    shareWithType: expense?.shareWithType,
    shareWithId: expense?.shareWithId,
    splitDetails: buildSplitDetails(nextAmount),
    isSettleUp: true,
    paymentId: paymentIdOverride,
  })

  const handleManualSettlementUpdate = async (nextAmount) => {
    if (!expense) return
    setModalLoading(true)
    try {
      const sanitized = Number(nextAmount.toFixed(2))
      const payload = buildUpdatePayload(sanitized, null)
      await api.put(`/expenses/${expenseId}`, payload)
      const updatedSplits = buildSplitDetails(sanitized)
      setExpense((prev) =>
        prev
          ? {
              ...prev,
              amount: sanitized,
              splitDetails: updatedSplits,
            }
          : prev
      )
      alert('Settlement amount updated.')
      setShowEditModal(false)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to update settlement.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleStripeSettlementUpdate = async (nextAmount) => {
    if (!expense) return
    if (!receiverId) {
      alert('Missing receiver information for this settlement.')
      return
    }
    setModalLoading(true)
    try {
      const sanitized = Number(nextAmount.toFixed(2))
      const paymentRes = await api.post('/expenses/payments', {
        amount: sanitized,
        payerId: expense.payerId,
        receiverId,
      })
      const paymentId = paymentRes.data?.paymentId
      if (!paymentId) {
        throw new Error('Stripe payment could not be created.')
      }
      const payload = buildUpdatePayload(sanitized, paymentId)
      await api.put(`/expenses/${expenseId}`, payload)
      const updatedSplits = buildSplitDetails(sanitized)
      setExpense((prev) =>
        prev
          ? {
              ...prev,
              amount: sanitized,
              splitDetails: updatedSplits,
              paymentId,
            }
          : prev
      )
      alert('Stripe settlement recorded and locked.')
      setShowEditModal(false)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || err.message || 'Failed to update settlement.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!expense || isStripe) return
    if (!window.confirm('Are you sure you want to delete this settlement?')) return

    try {
      await api.delete(`/expenses/${expenseId}`)
      alert('Settlement deleted')
      if (from === 'personalSummary') {
        navigate(-1)
      } else if (from === 'group') {
        navigate(`/groups/${id}`)
      } else {
        navigate(`/friends/${id}`)
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to delete settlement')
    }
  }

  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading settlement...</div>
  if (error) return <div className='p-6 text-red-500'>{error}</div>
  if (!expense) return <div className='p-6 text-gray-500'>Settlement not found.</div>

  return (
    <div className='min-h-screen'>
      <Header title='Settlement Details' />

      <main className='max-w-2xl mx-auto px-4 py-10'>
        <div className='rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100'>{expense.title}</h1>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-md font-semibold w-fit ${
                isStripe
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              }`}
            >
              {subtitle}
            </span>
          </div>

          <p className='mt-1 text-md uppercase tracking-wide text-gray-600 dark:text-gray-300'>Date: {formatFullDate(expense.date)}</p>

          <div className='mt-6 grid gap-4 sm:grid-cols-2'>
            <div className='rounded-xl border border-gray-100 p-4 dark:border-gray-700'>
              <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                Who paid whom
              </p>
              <div className='mt-2 flex items-center gap-3 text-2xl font-semibold text-gray-900 dark:text-gray-100'>
                <span>{payerLabel}</span>
                <span className='text-gray-400 dark:text-gray-500'>→</span>
                <span>{receiverLabel}</span>
              </div>
            </div>
            <div className='rounded-xl border border-gray-100 p-4 dark:border-gray-700'>
              <p className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>Amount</p>
              <p className='mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100'>${amountDisplay}</p>
            </div>
          </div>

          {isStripe ? (
            <div className='mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200'>
              NOTE: Settlements with stripe cannot be Edited or Deleted
            </div>
          ) : (
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <button
                type='button'
                onClick={handleOpenEditModal}
                className='flex-1 rounded-xl bg-emerald-500 py-3 text-center font-semibold text-white transition hover:bg-emerald-600'
              >
                Edit Settlement
              </button>
              <button
                type='button'
                onClick={handleDelete}
                className='flex-1 rounded-xl border border-red-300 py-3 text-center font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30'
              >
                Delete Settlement
              </button>
            </div>
          )}
        </div>
      </main>
      <SettleUpModal
        open={showEditModal}
        context={modalContext}
        onClose={() => setShowEditModal(false)}
        onLogSettlement={handleManualSettlementUpdate}
        onStripeSettlement={handleStripeSettlementUpdate}
        loading={modalLoading}
      />
    </div>
  )
}

