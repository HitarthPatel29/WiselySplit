import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import SettleUpModal from '../../components/Modals/SettleUpModal.jsx'
import { buildSettleUpPayload, formatCurrency, getSettlementMethodLabel } from '../../utils/settleUp.js'
import { useNotification } from '../../context/NotificationContext'
import { PlusIcon, BanknotesIcon } from '@heroicons/react/24/solid'

export default function IndividualView() {
  const navigate = useNavigate()
  const { friendId } = useParams()
  const { userId } = useAuth()
  const { showSuccess, showError } = useNotification()

  const [friend, setFriend] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [settleContext, setSettleContext] = useState(null)
  const [settleLoading, setSettleLoading] = useState(false)

  const friendIdNumber = Number(friendId)

  const fetchData = useCallback(async () => {
    if (!userId || !friendId) return
    try {
      setLoading(true)
      const res = await api.get(`/friends/${userId}/${friendId}`)
      const data = res.data || {}

      console.log('Fetched individual friend data:', data)
      // Normalize friend object (backend uses profilePicture, amount, userId, youOwe)
      const backendFriend = data.friend || null
      const cleanAmount = backendFriend ? Number(backendFriend.amount || 0) : 0
      const normalizedFriend = backendFriend
        ? {
            name: backendFriend.name,
            avatar: backendFriend.profilePicture || backendFriend.avatar || '',
            youOwe: backendFriend.youOwe,
            amountOwed: cleanAmount,
            amountOwedDisplay: formatCurrency(cleanAmount),
            userId: backendFriend.userId || backendFriend.id,
          }
        : null

      // Normalize expenses array (backend uses expenseId, expenseTitle, expenseDate, amount, subtitle, type)
      const backendExpenses = data.expenses || []
      const normalizedExpenses = backendExpenses
        .filter((e) => e.expenseType?.toLowerCase() !== 'fugazi')
        .map((e) => {
          const isSettleUp = !!e.isSettleUp
          const displayAmount = isSettleUp
            ? formatCurrency(e.amount || e.balance)
            : formatCurrency(Math.abs(e.balance || 0))

          const derivedType = isSettleUp
            ? 'settle'
            : e.type ||
              (e.expenseType
                ? e.expenseType.toLowerCase() === 'lent'
                  ? 'lent'
                  : 'owe'
                : '')

          const subtitle = isSettleUp
            ? getSettlementMethodLabel(e.paymentId)
            : e.expenseType || ''

          // format date to 'Mon DD'
          let dateStr = ''
          if (e.expenseDate) {
            try {
              const d = new Date(e.expenseDate)
              const month = d.toLocaleString('en-US', { month: 'short' })
              const day = String(d.getDate()).padStart(2, '0')
              dateStr = `${month} ${day}`
            } catch (err) {
              dateStr = e.expenseDate
            }
          }

          return {
            id: e.expenseId || e.id,
            date: dateStr || e.date || '',
            title: e.expenseTitle || e.title || '',
            expenseType: e.expenseType || '',
            amount: e.amount || 0,
            balance: Math.abs(e.balance || 0),
            displayAmount,
            type: derivedType,
            highlight: isSettleUp || !!e.highlight,
            isSettleUp,
            settlementMethod: e.settlementMethod || null,
            subtitle,
          }
        })

      setFriend(normalizedFriend)
      setExpenses(normalizedExpenses)

      if (!backendFriend) setMessage('No friend data found.')
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.error || 'Failed to fetch friend data.')
    } finally {
      setLoading(false)
    }
  }, [friendId, userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenSettle = () => {
    if (!friend || !friend.youOwe || friend.amountOwed <= 0) return
    setSettleContext({
      targetUserId: friend.userId,
      targetName: friend.name,
      maxAmount: friend.amountOwed,
      suggestedAmount: friend.amountOwed,
      shareWithId: friendIdNumber,
      shareWithName: friend.name,
      shareWithType: 'friend',
      settlementTargetId: friend.userId,
    })
    setShowSettleModal(true)
  }

  const handleLogSettlement = async (amount) => {
    if (!settleContext) return
    try {
      setSettleLoading(true)
      const payload = buildSettleUpPayload({
        ...settleContext,
        amount,
        currentUserId: userId,
        method: 'manual',
      })
      await api.post('/expenses', payload)
      showSuccess('Settlement logged successfully!', { asSnackbar: true })
      setShowSettleModal(false)
      fetchData()
    } catch (err) {
      console.error(err)
      showError(err.response?.data?.error || 'Failed to log settlement.', { asSnackbar: true })
    } finally {
      setSettleLoading(false)
    }
  }

  const handleStripeSettlement = (amount) => {
    if (!settleContext) return
    const payload = buildSettleUpPayload({
      ...settleContext,
      amount,
      currentUserId: userId,
      method: 'stripe',
    })

    setShowSettleModal(false)
    navigate('/settle/stripe-checkout', {
      state: {
        payload,
        summary: { targetName: settleContext.targetName },
        returnTo: `/friends/${friendId}`,
      },
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen'>
        <Header title='Individual View' />
        <div
          className='p-6 text-gray-500 dark:text-gray-400'
          role="status"
          aria-live="polite"
          aria-label="Loading friend details"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true" />
            <p className="sr-only">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!friend) {
    return (
      <div className='min-h-screen'>
        <Header title='Individual View' />
        <div
          className='p-6 text-gray-500 dark:text-gray-400'
          role="alert"
          aria-live="polite"
        >
          {message || 'No friend data.'}
        </div>
      </div>
    )
  }

  const canSettle = friend.youOwe && friend.amountOwed > 0
  const standingText = friend.youOwe
    ? `You owe ${friend.name} $${friend.amountOwedDisplay}`
    : friend.amountOwed > 0
      ? `${friend.name} owes you $${friend.amountOwedDisplay}`
      : 'All settled up!'
  const standingColor = friend.youOwe ? 'text-red-500' : friend.amountOwed > 0 ? 'text-emerald-600' : 'text-gray-500'

  return (
    <div className='min-h-screen'>
      <Header title='Individual View' />

      {/* ----------------- FRIEND INFO ----------------- */}
      <section
        className='max-w-3xl mx-auto px-4 py-6'
        aria-labelledby="friend-name-heading"
      >
        <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 dark:from-gray-800 dark:via-gray-800/95 dark:to-emerald-900/20 border border-emerald-100/80 dark:border-gray-700/80 shadow-lg shadow-emerald-500/5'>
          {/* Decorative corner accent */}
          <div className='absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10' aria-hidden="true" />
          <div className='absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-400/10 dark:bg-teal-500/10' aria-hidden="true" />

          <div className='relative px-5 py-6 sm:px-6 sm:py-7'>
            {/* Avatar + Name row */}
            <div className='flex flex-row items-start gap-4'>
              <div className='relative shrink-0'>
                {friend.avatar ? (
                  <img
                    src={friend.avatar}
                    alt={`${friend.name} avatar`}
                    className='w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-md'
                  />
                ) : (
                  <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md'>
                    {friend.name?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                )}
              </div>

              <div className='flex-1 min-w-0'>
                <h2
                  id="friend-name-heading"
                  className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate'
                >
                  {friend.name}
                </h2>

                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${standingColor} bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-current/20`}
                  role="status"
                  aria-live="polite"
                >
                  {standingText}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div
              className='mt-6 grid grid-cols-2 gap-2 sm:gap-3'
              role="group"
              aria-label="Friend actions"
            >
              <button
                onClick={() => navigate(`/friends/${friendId}/add-expense`)}
                className='flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold rounded-xl py-3 px-4 hover:bg-emerald-600 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                aria-label="Add a new expense with this friend"
              >
                <PlusIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Add Expense</span>
              </button>

              <button
                onClick={handleOpenSettle}
                disabled={!canSettle}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  canSettle
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                }`}
                aria-label="Settle up with this friend"
              >
                <BanknotesIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{canSettle ? 'Settle Up' : 'All Settled'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- EXPENSE LIST ----------------- */}
      <main
        className='max-w-3xl mx-auto px-4 pb-10'
        aria-label="Expenses with friend"
      >
        <h3 className='text-lg font-semibold mb-4'>Expenses</h3>
        <div
          className='flex flex-col gap-3'
          role="list"
          aria-label="Expense list"
        >
          {expenses.map((ex) => (
            <div key={ex.id} role="listitem">
              <ExpenseItemCard
                date={ex.date}
                title={ex.title}
                subtitle={ex.subtitle}
                amount={ex.displayAmount}
                type={ex.type}
                highlight={ex.highlight}
                onClick={() =>
                  navigate(
                    ex.isSettleUp
                      ? `/friends/${friendId}/settlements/${ex.id}`
                      : `/friends/${friendId}/expenses/${ex.id}`,
                    { state: { ...ex, from: 'friend' } }
                  )
                }
              />
            </div>
          ))}
          {expenses.length === 0 && (
            <p
              className='text-gray-500 dark:text-gray-400 text-center py-8'
              role="status"
            >
              No expenses yet.
            </p>
          )}
        </div>
      </main>

      <SettleUpModal
        open={showSettleModal}
        context={settleContext}
        onClose={() => setShowSettleModal(false)}
        onLogSettlement={handleLogSettlement}
        onStripeSettlement={handleStripeSettlement}
        loading={settleLoading}
      />
    </div>
  )
}
