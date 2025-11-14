import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

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

  /* -----------------------------------------------------
     Fetch group details
  ----------------------------------------------------- */
  useEffect(() => {
    if (!id || !userId) return

    const load = async () => {
      try {
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

          let userAmount = 0

          if (payer === me) {
            // I paid → others owe me
            userAmount = splits
              .filter((p) => Number(p.userId) !== me)
              .reduce((sum, p) => sum + Number(p.amount), 0)
          } else {
            // Another user paid → I owe them
            const mySplit = splits.find((p) => Number(p.userId) === me)
            userAmount = mySplit ? Number(mySplit.amount) : 0
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
            userAmount,  // 👈 ADD THIS
            type: payer === me ? 'lent' : 'owe', // for ExpenseItemCard styling
          }
        })
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
    }

    load()
  }, [id, userId])

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */
  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading group...</div>
  if (!group) return <div className='p-6 text-gray-500 dark:text-gray-400'>{message}</div>

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b relative'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Group View</h1>
      </div>

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
                    <p key={m.userId} className='text-red-500'>
                      You owe {m.name} ${Math.abs(m.balance).toFixed(2)}
                    </p>
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
              subtitle={ex.expenseType}
              amount={ex.userAmount}
              type={ex.type}
              highlight={ex.highlight}
              onClick={() => navigate(`/groups/${id}/expenses/${ex.id}`, {
                state: { ...ex, fromGroup: true }
              })}
            />
          ))}
        </div>
      </main>
    </div>
  )
}