import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import SettleUpModal from '../../components/Modals/SettleUpModal.jsx'
import { buildSettleUpPayload, formatCurrency, getSettlementMethodLabel } from '../../utils/settleUp.js'

/* -----------------------------------------------------
   Helper: Format a date into "Nov 11"
----------------------------------------------------- */
const formatDate = (raw) => {
  if (!raw) return ''
  try {
    const d = new Date(raw)
    const month = d.toLocaleString('en-US', { month: 'short' })
    const day = String(d.getDate()).padStart(2, '0')
    return `${month} ${day}`
  } catch {
    return raw
  }
}

/* -----------------------------------------------------
   Compute balances using splitDetails
   standing[userId] = +X → they owe me X
                      -Y → I owe them Y
----------------------------------------------------- */
const computeMemberStanding = (expenses, currentUserId) => {
  const standing = {}

  expenses.forEach((ex) => {
    const payer = Number(ex.payerId)
    const targetSplit = ex.splitDetails?.[0]

    if (ex.isSettleUp && targetSplit) {
      const amount = Number(targetSplit.amount) || 0
      if (!amount) return

      if (payer === currentUserId) {
        standing[targetSplit.userId] = (standing[targetSplit.userId] || 0) - amount
      } else if (Number(targetSplit.userId) === currentUserId) {
        standing[payer] = (standing[payer] || 0) + amount
      }
      return
    }

    ex.splitDetails.forEach((p) => {
      const uid = Number(p.userId)
      const amt = Number(p.amount)

      if (payer === currentUserId) {
        // Current user paid → others owe current user
        if (uid !== currentUserId) {
          standing[uid] = (standing[uid] || 0) + amt
        }
      } else {
        // Someone else paid → current user owes payer
        if (uid === currentUserId) {
          standing[payer] = (standing[payer] || 0) - amt
        }
      }
    })
  })

  return Object.entries(standing).map(([uid, balance]) => ({
    userId: Number(uid),
    balance,
  }))
}

export default function GroupView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId } = useAuth()

  const [group, setGroup] = useState(null)
  const [membersStanding, setMembersStanding] = useState([])
  const [overallStanding, setOverallStanding] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [participants, setParticipants] = useState([])
  const [showSettleModal, setShowSettleModal] = useState(false)
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
      const g = data.group || {}
      setGroup({
        id: g.groupId,
        name: g.name || g.groupName || '',
        avatar: g.photo || g.ProfilePicture || g.profilePicture || '',
        type: g.type || '',
      })

      const p = data.participants || []
      setParticipants(p)

      /* ---------------------- EXPENSES ------------------------ */
      const normalizedExpenses = (data.expenses || []).map((e) => {
        const payer = Number(e.payerId)
        const splits = e.splitDetails || []
        const me = Number(userId)
        const isSettleUp = !!e.isSettleUp

        let userAmount = 0

        if (isSettleUp) {
          userAmount = formatCurrency(e.amount || e.totalAmount || 0)
        } else if (payer === me) {
          // I paid → others owe me
          userAmount = formatCurrency(
            splits
              .filter((p) => Number(p.userId) !== me)
              .reduce((sum, p) => sum + Number(p.amount), 0)
          )
        } else {
          // Another user paid → I owe them
          const mySplit = splits.find((p) => Number(p.userId) === me)
          userAmount = formatCurrency(mySplit ? Number(mySplit.amount) : 0)
        }

        return {
          id: e.expenseId,
          title: e.title || e.expenseTitle || '',
          date: formatDate(e.date || e.expenseDate),
          payerId: payer,
          paidBy: e.paidBy || '',
          expenseType: e.expenseType || '',
          totalAmount: Number(e.totalAmount || 0),
          splitDetails: splits,
          userAmount,
          type: isSettleUp ? 'settle' : payer === me ? 'lent' : 'owe', // for ExpenseItemCard styling
          isSettleUp,
          settlementMethod: e.settlementMethod || null,
          subtitle: isSettleUp ? getSettlementMethodLabel(e.settlementMethod) : e.expenseType || '',
        }
      })
      console.log('normalizedExpenses: ', normalizedExpenses)
      setExpenses(normalizedExpenses)

      /* ------------------ MEMBER STANDING --------------------- */
      const standingList = computeMemberStanding(normalizedExpenses, Number(userId))

      // Fetch member names from splitDetails (guaranteed present)
      const memberNames = {}
      normalizedExpenses.forEach((ex) => {
        ex.splitDetails.forEach((p) => {
          memberNames[p.userId] = p.name || ''
        })
      })

      const finalStanding = standingList.map((m) => ({
        ...m,
        name: memberNames[m.userId] || 'User',
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
      console.log('Computed overall standing:', net)
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
      shareWithName: group.name,
      shareWithType: 'group',
      settlementTargetId: member.userId,
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
      loadGroup()
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
        summary: { targetName: settleContext.targetName, shareLabel: group?.name },
        returnTo: `/groups/${id}`,
      },
    })
  }

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */
  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading group...</div>
  if (!group) return <div className='p-6 text-gray-500 dark:text-gray-400'>{message}</div>

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <Header title='Group View' />

      {/* ----------------- GROUP INFO ----------------- */}
      <section className='max-w-3xl mx-auto px-4 py-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          <img
            src={group.avatar}
            alt={group.name}
            className='w-24 h-24 rounded-full object-cover border'
          />

          <div className='flex-1 text-center sm:text-left'>
            <h2 className='text-2xl font-semibold'>{group.name}</h2>

            {overallStanding && (
              <p className={`mt-1 font-medium ${overallStanding.color}`}>
                {overallStanding.text}
              </p>
            )}

            <div className='mt-2 text-sm space-y-1'>
              {membersStanding.map((m) => {
                if (m.balance > 0)
                  return (
                    <p key={m.userId} className='text-emerald-600'>
                      {m.name} owes you ${m.balance.toFixed(2)}
                    </p>
                  )

                if (m.balance < 0)
                  return (
                    <div key={m.userId} className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                      <p className='text-red-500'>
                        You owe {m.name} ${Math.abs(m.balance).toFixed(2)}
                      </p>
                      <button
                        type='button'
                        onClick={() => handleOpenSettle(m)}
                        className='w-full rounded-lg border border-emerald-400 px-3 py-1 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 sm:w-auto'
                      >
                        Settle with {m.name.split(' ')[0]}
                      </button>
                    </div>
                  )

                return (
                  <p key={m.userId} className='text-gray-500'>
                    {m.name} settled up
                  </p>
                )
              })}
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className='flex flex-col sm:flex-row gap-3 justify-center mt-5'>
          <button
            onClick={() => navigate(`/groups/${id}/add-expense`, { state: { fromGroup: true } })}
            className='sm:w-full bg-emerald-100 text-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200 transition dark:text-emerald-100 dark:bg-emerald-700 dark:hover:bg-emerald-600'
          >
            + Add Expense
          </button>

          <button
            onClick={() => navigate(`/groups/${id}/add-participants`)}
            className='sm:w-full bg-emerald-100 text-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200 transition dark:text-emerald-100 dark:bg-emerald-700 dark:hover:bg-emerald-600'
          >
            + Add Participants
          </button>

          <button
            onClick={() =>navigate(`/groups/${id}/edit`, {state: {group, participants, membersStanding, overallStanding},
              })
            }
            className='sm:w-24 bg-emerald-500 text-white rounded-xl py-3 hover:bg-emerald-600 flex items-center justify-center transition'
          >
            ⚙
          </button>
        </div>
      </section>

      {/* ----------------- EXPENSE LIST ----------------- */}
      <main className='max-w-3xl mx-auto px-4 pb-10'>
        <h3 className='text-lg font-semibold mb-4'>Expenses</h3>

        <div className='flex flex-col gap-3'>
          {expenses.map((ex) => (
            <ExpenseItemCard
              key={ex.id}
              date={ex.date}
              title={ex.title}
              subtitle={ex.subtitle || ex.expenseType}
              amount={ex.userAmount}
              type={ex.type}
              highlight={ex.isSettleUp}
              onClick={() =>
                navigate(
                  ex.isSettleUp ? `/groups/${id}/settlements/${ex.id}` : `/groups/${id}/expenses/${ex.id}`,
                  {
                    state: { ...ex, from: 'group' },
                  }
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