import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExpensesGroupByDate from '../../components/ListItem/ExpensesGroupByDate.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import SettleUpModal from '../../components/Modals/SettleUpModal.jsx'
import MemberSelectModal from '../../components/Modals/MemberSelectModal.jsx'
import { buildSettleUpPayload, getSettlementMethodLabel } from '../../utils/settleUp.js'
import { useNotification } from '../../context/NotificationContext'
import {
  Cog6ToothIcon,
  PlusIcon,
  UserPlusIcon,
  BanknotesIcon,
} from '@heroicons/react/24/solid'

const toDateKey = (raw) => {
  if (!raw) return 'unknown'
  try {
    const d = new Date(raw)
    return d.toLocaleDateString('en-CA')
  } catch {
    return 'unknown'
  }
}

export default function GroupView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId } = useAuth()
  const { showSuccess, showError } = useNotification()

  const [group, setGroup] = useState(null)
  const [membersStanding, setMembersStanding] = useState([])
  const [overallStanding, setOverallStanding] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [showMemberSelectModal, setShowMemberSelectModal] = useState(false)
  const [settleContext, setSettleContext] = useState(null)
  const [settleLoading, setSettleLoading] = useState(false)

  const groupIdNumber = Number(id)

  /* -----------------------------------------------------
     Fetch group details
  ----------------------------------------------------- */
  const loadGroup = useCallback(async () => {
    if (!id || !userId) return
    try {
      setLoading(true)
      const res = await api.get(`/groups/${id}/details`, { params: { userId } })
      const data = res.data || {}
      console.log('Fetched group details:', data)

      /* ---------------------- GROUP INFO ---------------------- */
      setGroup(data.group || {})
      setParticipants(data.participants || [])

      /* ---------------------- EXPENSES ------------------------ */
      setExpenses(data.expenses || [])

      /* ------------------ MEMBER STANDING (from participants) --------------------- */
      const me = Number(userId)
      const finalStanding = (data.participants || [])
        .filter((p) => Number(p.userId) !== me)
        .map((p) => ({
          userId: p.userId,
          name: p.name,
          balance: Number(p.userBalance) || 0,
        }))

      console.log('Computed member standing:', finalStanding)

      setMembersStanding(finalStanding)

      /* ------------------ OVERALL STANDING -------------------- */
      const net = finalStanding.reduce((sum, m) => sum + m.balance, 0)

      if (net > 0) {
        setOverallStanding({
          balance: net.toFixed(2),
          text: `You are owed $${net.toFixed(2)}`,
          color: 'text-emerald-600',
        })
      } else if (net < 0) {
        setOverallStanding({
          balance: net.toFixed(2),
          text: `You owe $${Math.abs(net).toFixed(2)}`,
          color: 'text-red-500',
        })
      } else {
        setOverallStanding({
          balance: net.toFixed(2),
          text: 'All settled up!',
          color: 'text-gray-500',
        })
      }
    } catch (err) {
      console.error(err)
      setMessage('Failed to fetch group details.')
    } finally {
      setLoading(false)
    }
  }, [id, userId])

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  const handleOpenSettle = (member) => {
    if (!group || !member || member.balance >= 0) return
    const owed = Math.abs(member.balance)
    setSettleContext({
      targetUserId: member.userId,
      targetName: member.name,
      maxAmount: owed,
      suggestedAmount: owed,
      shareWithId: groupIdNumber,
      shareWithName: group.groupName,
      shareWithType: 'group',
      settlementTargetId: member.userId,
    })
    setShowSettleModal(true)
  }

  const handleOpenMemberSelect = () => {
    const hasMembersToSettle = membersStanding.some((m) => m.balance < 0)
    if (!hasMembersToSettle) return
    setShowMemberSelectModal(true)
  }

  const handleMemberSelect = (member) => {
    handleOpenSettle(member)
  }

  const handleLogSettlement = async (amount, walletId) => {
    if (!settleContext) return
    try {
      setSettleLoading(true)
      const payload = buildSettleUpPayload({
        ...settleContext,
        amount,
        currentUserId: userId,
        method: 'manual',
        walletId,
      })
      await api.post('/expenses/shared', payload)
      showSuccess('Settlement logged successfully!', { asSnackbar: true })
      setShowSettleModal(false)
      loadGroup()
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
        summary: { targetName: settleContext.targetName, shareLabel: group?.groupName },
        returnTo: `/groups/${id}`,
      },
    })
  }

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */
  if (loading) {
    return (
      <div className='min-h-screen'>
        <Header title='Group View' />
        <div 
          className='p-6 text-gray-500 dark:text-gray-400'
          role="status"
          aria-live="polite"
          aria-label="Loading group details"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true"></div>
            <p className="sr-only">Loading group...</p>
          </div>
        </div>
      </div>
    )
  }
  if (!group) {
    return (
      <div className='min-h-screen'>
        <Header title='Group View' />
        <div 
          className='p-6 text-gray-500 dark:text-gray-400'
          role="alert"
          aria-live="polite"
        >
          {message || 'Group not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <Header title='Group View' />

      {/* ----------------- GROUP INFO ----------------- */}
      <section
        className='max-w-3xl mx-auto px-4 py-6'
        aria-labelledby="group-name-heading"
      >
        <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 dark:from-gray-800 dark:via-gray-800/95 dark:to-emerald-900/20 border border-emerald-100/80 dark:border-gray-700/80 shadow-lg shadow-emerald-500/5'>
          {/* Decorative corner accent */}
          <div className='absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10' aria-hidden="true" />
          <div className='absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-teal-400/10 dark:bg-teal-500/10' aria-hidden="true" />

          <div className='relative px-5 py-6 sm:px-6 sm:py-7'>
            {/* Avatar + Name row */}
            <div className='flex flex-row items-start gap-4'>
              <div className='relative shrink-0'>
                {group.profilePicture ? (
                  <img
                    src={group.profilePicture}
                    alt={`${group.groupName} group avatar`}
                    className='w-25 h-25 sm:w-25 sm:h-25 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-md'
                  />
                ) : (
                  <div className='w-25 h-25 sm:w-25 sm:h-25 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md'>
                    {group.groupName?.slice(0, 2).toUpperCase() || 'GR'}
                  </div>
                )}
              </div>

              <div className='flex-1 min-w-0'>
                <h2
                  id="group-name-heading"
                  className='text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate'
                >
                  {group.groupName}
                </h2>

                {overallStanding && (
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${overallStanding.color} bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-current/20`}
                    role="status"
                    aria-live="polite"
                  >
                    {overallStanding.text}
                  </span>
                )}

                {/* Member standings - horizontal scroll */}
                {membersStanding.length > 0 && (
                  <div className='mt-3 flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-1 scrollbar-thin'>
                    {membersStanding.map((m) => {
                      if (m.balance > 0)
                        return (
                          <span
                            key={m.userId}
                            className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0'
                          >
                            {m.name} owes ${m.balance.toFixed(2)}
                          </span>
                        )
                      if (m.balance < 0)
                        return (
                          <span
                            key={m.userId}
                            className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 shrink-0'
                          >
                            You owe {m.name} ${Math.abs(m.balance).toFixed(2)}
                          </span>
                        )
                      return (
                        <span
                          key={m.userId}
                          className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 shrink-0'
                        >
                          {m.name} ✓
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons - 2x2 grid on mobile, row on desktop */}
            <div
              className='mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3'
              role="group"
              aria-label="Group actions"
            >
              <button
                onClick={() => navigate(`/groups/${id}/add-expense`, { state: { fromGroup: true } })}
                className='flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold rounded-xl py-3 px-4 hover:bg-emerald-600 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                aria-label="Add a new expense to this group"
              >
                <PlusIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Add Expense</span>
              </button>

              <button
                onClick={() => navigate(`/groups/${id}/add-participants`)}
                className='flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 font-semibold rounded-xl py-3 px-4 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-800/50 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                aria-label="Add participants to this group"
              >
                <UserPlusIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Add People</span>
              </button>

              <button
                onClick={handleOpenMemberSelect}
                disabled={!membersStanding.some((m) => m.balance < 0)}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  membersStanding.some((m) => m.balance < 0)
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                }`}
                aria-label="Settle up with group members"
              >
                <BanknotesIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{membersStanding.some((m) => m.balance < 0) ? 'Settle Up' : 'All Settled'}</span>
              </button>

              <button
                onClick={() =>
                  navigate(`/groups/${id}/edit`, {
                    state: { group, participants, membersStanding, overallStanding },
                  })
                }
                className='flex items-center justify-center gap-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-xl py-3 px-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                aria-label="Edit group settings"
              >
                <Cog6ToothIcon className="w-5 h-5" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- EXPENSE LIST ----------------- */}
      <main 
        className='max-w-3xl mx-auto px-4 pb-10'
        aria-label="Group expenses"
      >
        <h3 className='text-lg font-semibold mb-4'>Expenses</h3>

        <div
          className='flex flex-col gap-5'
          aria-label="Expense list"
        >
          {(() => {
            const grouped = expenses.reduce((acc, ex) => {
              const dateKey = toDateKey(ex.expenseDate)
              if (!acc[dateKey]) acc[dateKey] = []

              const isPayer = Number(ex.payerId) === Number(userId)
              const userShare = ex.splitDetails?.find(s => Number(s.userId) === Number(userId))?.amount ?? 0
              const userBalance = isPayer ? ex.amount - userShare : -userShare

              const cardType = ex.isSettleUp ? 'settle' : userBalance==0 ? 'not-involved' : 'shared'
              const subtitle = ex.isSettleUp ? getSettlementMethodLabel(ex.paymentId) : ex.expenseType


              acc[dateKey].push({
                expenseId: ex.expenseId,
                title: ex.expenseTitle,
                subtitle,
                amount: Number(ex.amount).toFixed(2),
                userBalance: userBalance.toFixed(2),
                cardType,
                highlight: ex.isSettleUp,
                onClick: () =>
                  navigate(
                    ex.isSettleUp ? `/groups/${id}/settlements/${ex.expenseId}` : `/groups/${id}/expenses/${ex.expenseId}`,
                    { state: { ...ex, from: 'group' } }
                  ),
              })
              return acc
            }, {})

            const dateKeys = Object.keys(grouped)

            if (dateKeys.length === 0) {
              return (
                <p className='text-gray-500 dark:text-gray-400 text-center py-8' role="status">
                  No expenses yet.
                </p>
              )
            }

            return dateKeys.map((dateKey) => (
              <ExpensesGroupByDate
                key={dateKey}
                date={dateKey}
                expenses={grouped[dateKey]}
              />
            ))
          })()}
        </div>
      </main>

      <MemberSelectModal
        open={showMemberSelectModal}
        members={membersStanding}
        onClose={() => setShowMemberSelectModal(false)}
        onSelect={handleMemberSelect}
      />

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