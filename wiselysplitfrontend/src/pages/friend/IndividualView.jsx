import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import SettleUpModal from '../../components/Modals/SettleUpModal.jsx'
import { buildSettleUpPayload, formatCurrency, getSettlementMethodLabel } from '../../utils/settleUp.js'

export default function IndividualView() {
  const navigate = useNavigate()
  const { friendId } = useParams()
  const { userId } = useAuth()

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
            ? getSettlementMethodLabel(e.settlementMethod)
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
      alert('Settlement logged successfully!')
      setShowSettleModal(false)
      fetchData()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to log settlement.')
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

  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading...</div>
  if (!friend) return <div className='p-6 text-gray-500 dark:text-gray-400'>{message || 'No friend data.'}</div>

  const canSettle = friend.youOwe && friend.amountOwed > 0

  return (
    <div className='min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100'>
      <Header title='Individual View' />

      <section className='max-w-3xl mx-auto px-4 py-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <img
            src={friend.avatar}
            alt={friend.name}
            className='w-24 h-24 rounded-full object-cover border'
          />
          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-2xl font-semibold'>{friend.name}</h2>
            <p
              className={`mt-2 text-lg font-medium ${
                friend.youOwe ? 'text-red-500' : 'text-emerald-600'
              }`}
            >
              {friend.youOwe
                ? `You owe ${friend.name} $${friend.amountOwedDisplay}`
                : `${friend.name} owes you $${friend.amountOwedDisplay}`}
            </p>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 justify-center mt-4'>
          <button
            onClick={() => navigate(`/friends/${friendId}/add-expense`)}
            className='sm:w-full bg-emerald-100 text-emerald-700 dark:text-emerald-100 dark:bg-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200 dark:hover:bg-emerald-600'
          >
            + Add Expense
          </button>
          <button
            onClick={handleOpenSettle}
            disabled={!canSettle}
            className={`sm:w-52 rounded-xl py-3 font-semibold transition ${
              canSettle
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {canSettle ? 'Settle Up' : 'All Settled'}
          </button>
        </div>
      </section>

      <main className='max-w-3xl mx-auto px-4 pb-10'>
        <h3 className='text-lg font-semibold mb-4'>Expenses</h3>
        <div className='flex flex-col gap-3'>
          {expenses.map((ex) => (
            <ExpenseItemCard
              key={ex.id}
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
          ))}
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
