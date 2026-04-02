// src/pages/expense/EntryDetails.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../../api'
import { normalizeExpenseForFields } from '../../utils/expenseModel'
import { formatCurrency, SETTLE_EXPENSE_TYPE } from '../../utils/settleUp'
import { useAuth } from '../../context/AuthContext.jsx'
import Header from '../../components/Header.jsx'
import { useNotification } from '../../context/NotificationContext'
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

export default function EntryDetails() {
  const { id, expenseId } = useParams()
  const { userId, friendsAndGroups, wallets = [] } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showSuccess, showError, showAlert } = useNotification()
  const from = location.state?.from || null
  const [expense, setExpense] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [modalContext, setModalContext] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const entryKind = expense?.entryKind || 'expense'
  const isSettlement = expense?.isSettleUp === true
  const isIncome = entryKind === 'income' && !isSettlement
  const isTransfer = entryKind === 'transfer' && !isSettlement
  const isPersonal = entryKind === 'expense' && expense?.isPersonal === true && !isSettlement
  const isShared = entryKind === 'expense' && !expense?.isPersonal && !isSettlement

  const hasFullDetails = expense && (
    (isIncome && expense.title != null) ||
    (isTransfer && expense.title != null) ||
    (expense.isPersonal && expense.title != null) ||
    (expense.splitDetails?.length > 0 && expense.payer != null) ||
    (expense.isSettleUp && expense.splitDetails?.length > 0 && expense.payer != null)
  )

  useEffect(() => {
    if (hasFullDetails) return
    let ignore = false
    const fetchExpense = async () => {
      setLoading(true)
      setError('')
      try {
        let res
        if (entryKind === 'income') {
          res = await api.get(`/income/${expenseId}`)
        } else if (entryKind === 'transfer') {
          res = await api.get(`/transfer/${expenseId}`)
        } else {
          res = await api.get(`/expenses/${expenseId}`)
        }
        console.log(res)
        if (ignore) return
        const data = res.data || {}
        const normalized = normalizeExpenseForFields(data, userId, friendsAndGroups)
        setExpense(normalized)
      } catch (err) {
        console.error(err)
        if (!ignore) setError('Failed to load details.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchExpense()
    return () => { ignore = true }
  }, [expenseId, userId, friendsAndGroups])

  const walletNameLookup = useMemo(() => {
    const map = {}
    for (const w of wallets) {
      const wId = w.walletId ?? w.id
      map[wId] = w.walletName ?? w.name ?? `Wallet ${wId}`
    }
    return map
  }, [wallets])

  const fromWalletName = expense?.walletId ? (walletNameLookup[expense.walletId] || expense.walletName || 'Unknown') : null
  const toWalletName = expense?.toWalletId ? (walletNameLookup[expense.toWalletId] || 'Unknown') : null

  // Settlement: payer/receiver labels
  const { payerLabel, receiverLabel, receiverId, receiverName } = useMemo(() => {
    if (!expense || !isSettlement) {
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
        ? receiverIsYou ? 'You' : receiverEntry.name || expense.shareWith || 'Recipient'
        : expense.shareWith || 'Recipient',
      receiverId: receiverEntry?.userId || null,
      receiverName: receiverEntry?.name || expense?.shareWith || 'Recipient',
    }
  }, [expense, userId, isSettlement])

  const isStripe = Boolean(expense?.paymentId)
  const settlementSubtitle = isStripe ? 'Settled via Stripe' : 'Settled Manually'

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
    title: expense?.title || 'Settle up',
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

  const handleManualSettlementUpdate = async (nextAmount, walletId) => {
    if (!expense) return
    setModalLoading(true)
    try {
      const sanitized = Number(nextAmount.toFixed(2))
      const payload = buildUpdatePayload(sanitized, null)
      if (walletId != null) payload.walletId = walletId
      await api.put(`/expenses/${expenseId}`, payload)
      setExpense((prev) =>
        prev ? { ...prev, amount: sanitized, splitDetails: buildSplitDetails(sanitized) } : prev
      )
      showSuccess('Settlement amount updated.', { asSnackbar: true })
      setShowEditModal(false)
    } catch (err) {
      console.error(err)
      showError(err.response?.data?.error || 'Failed to update settlement.', { asSnackbar: true })
    } finally {
      setModalLoading(false)
    }
  }

  const handleStripeSettlementUpdate = async (nextAmount) => {
    if (!expense || !receiverId) {
      showError('Missing receiver information for this settlement.', { asSnackbar: true })
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
      if (!paymentId) throw new Error('Stripe payment could not be created.')
      const payload = buildUpdatePayload(sanitized, paymentId)
      await api.put(`/expenses/${expenseId}`, payload)
      setExpense((prev) =>
        prev ? { ...prev, amount: sanitized, splitDetails: buildSplitDetails(sanitized), paymentId } : prev
      )
      showSuccess('Stripe settlement recorded and locked.', { asSnackbar: true })
      setShowEditModal(false)
    } catch (err) {
      console.error(err)
      showError(err.response?.data?.error || err.message || 'Failed to update settlement.', { asSnackbar: true })
    } finally {
      setModalLoading(false)
    }
  }

  const handleOpenSettlementEditModal = () => {
    if (!expense || isStripe) return
    setModalContext({
      targetName: receiverLabel === 'You' ? payerLabel : receiverLabel,
      suggestedAmount: Number(expense.amount) || 0,
      maxAmount: Number.MAX_SAFE_INTEGER,
    })
    setShowEditModal(true)
  }

  const entryLabel =
    isIncome ? 'Income'
    : isTransfer ? 'Transfer'
    : isSettlement ? 'Settlement'
    : 'Expense'

  const handleDelete = async () => {
    const confirmed = await showAlert({
      title: `Delete ${entryLabel}`,
      message: `Are you sure you want to delete this ${entryLabel.toLowerCase()}?`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
    if (isSettlement && isStripe) return

    try {
      await api.delete(`/expenses/${expenseId}`)
      showSuccess(`${entryLabel} deleted`, { asSnackbar: true })
      if (from === 'personalSummary' || from === 'personalExpense') {
        navigate(-1)
      } else if (from === 'group') {
        navigate(`/groups/${id}`)
      } else {
        navigate(`/friends/${id}`)
      }
    } catch (err) {
      console.error(err)
      showError(err.response?.data?.error || 'Failed to delete', { asSnackbar: true })
    }
  }

  const navigateToEdit = () => {
    if (from === 'personalSummary' || from === 'personalExpense') {
      navigate(`/personalSummary/expenses/${expenseId}/edit`, { state: { ...expense, from } })
    } else if (from === 'group') {
      navigate(`/groups/${id}/expenses/${expenseId}/edit`, { state: { ...expense, from } })
    } else {
      navigate(`/friends/${id}/expenses/${expenseId}/edit`, { state: { ...expense, from } })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="" />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-lg tracking-wide text-gray-400 dark:text-gray-500 font-medium">Loading…</p>
        </main>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="Details" />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-center text-red-600 dark:text-red-400 font-medium">{error}</p>
        </main>
      </div>
    )
  }
  if (!expense) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title="" />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
            {entryLabel} not found.
          </p>
        </main>
      </div>
    )
  }

  const headerTitle =
    isIncome ? 'Income Details'
    : isTransfer ? 'Transfer Details'
    : isSettlement ? 'Settlement Details'
    : 'Expense Details'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={headerTitle} />

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* ——— Income: green accent ——— */}
        {isIncome && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Income
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {expense.title}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
                {[expense.type || '', formatFullDate(expense.date) || expense.date].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Amount</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +${formatCurrency(expense.totalAmount)}
                  </p>
                </div>
                {fromWalletName && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Wallet</p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 font-medium">{fromWalletName}</p>
                  </div>
                )}
              </div>
              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={navigateToEdit}
                  className="flex-1 bg-emerald-600 dark:bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ——— Transfer: amber accent with flow visual ——— */}
        {isTransfer && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Transfer
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {expense.title}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
                {formatFullDate(expense.date) || expense.date}
              </p>

              <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-700/50 p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {fromWalletName || 'Source'}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium">&rarr;</span>
                  <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    ${formatCurrency(expense.totalAmount)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium">&rarr;</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {toWalletName || 'Destination'}
                  </span>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={navigateToEdit}
                  className="flex-1 bg-amber-500 dark:bg-amber-500 text-white font-semibold rounded-xl py-3 hover:bg-amber-600 dark:hover:bg-amber-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ——— Personal expense: warm, single-owner feel ——— */}
        {isPersonal && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Personal
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {expense.title}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
                {formatFullDate(expense.date) || expense.date}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fromWalletName && (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Wallet</p>
                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 font-semibold">{fromWalletName}</p>
                    </div>
                )}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Amount</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    ${formatCurrency(expense.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={navigateToEdit}
                  className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl py-3 hover:opacity-90 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ——— Shared: clear split, two-tone ——— */}
        {isShared && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {expense.shareWithType === 'group' ? 'Group' : 'Friend'}
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {expense.title}
              </h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
                {[expense.type || '', formatFullDate(expense.date) || expense.date].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paid by</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 font-semibold">{expense.payer}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    ${formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
              {expense.splitDetails && expense.splitDetails.length > 0 && (
                <div className="mt-6 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {expense.shareWithType === 'group' ? 'Split' : 'Who owes'}
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {expense.splitDetails.map((m, i) => (
                      <li key={i} className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {m.name || m.userName || m.username}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 tabular-nums font-medium">
                          ${formatCurrency(m.amount ?? 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={navigateToEdit}
                  className="flex-1 bg-emerald-600 dark:bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ——— Settlement: flow (who paid whom) + badge ——— */}
        {isSettlement && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  Settlement
                </span>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    isStripe
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  }`}
                >
                  {settlementSubtitle}
                </span>
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {expense.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {[expense.type || '', formatFullDate(expense.date) || expense.date].filter(Boolean).join(' · ')}
              </p>

              <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-700/50 p-6 border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                  Who paid whom
                </p>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {payerLabel}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium">paid</span>
                  <span className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                    ${formatCurrency(expense.amount)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium">to</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {receiverLabel}
                  </span>
                </div>
              </div>

              {isStripe ? (
                <div className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    This settlement was completed with Stripe and cannot be edited or deleted.
                  </p>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleOpenSettlementEditModal}
                    className="flex-1 bg-violet-600 dark:bg-violet-500 text-white font-semibold rounded-xl py-3 hover:bg-violet-700 dark:hover:bg-violet-600 transition"
                  >
                    Edit settlement
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:border-red-300 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isSettlement && (
        <SettleUpModal
          open={showEditModal}
          context={modalContext}
          onClose={() => setShowEditModal(false)}
          onLogSettlement={handleManualSettlementUpdate}
          onStripeSettlement={handleStripeSettlementUpdate}
          loading={modalLoading}
        />
      )}
    </div>
  )
}
