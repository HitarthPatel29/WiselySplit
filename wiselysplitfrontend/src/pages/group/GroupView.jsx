import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

export default function GroupView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId } = useAuth()

  const [group, setGroup] = useState(null)
  const [overallStanding, setOverallStanding] = useState(null)
  const [membersStanding, setMembersStanding] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!id || !userId) return
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/groups/${id}/details`, { params: { userId } })
        const data = res.data || {}
        console.log('Fetched group details:', data)

        // group info: backend may return data.group with ProfilePicture or top-level name
        const g = data.group || {}
        const groupName = data.name || g.name || g.groupName || ''
        const avatar = g.ProfilePicture || g.profilePicture || g.avatar || g.photo || ''
        const groupId = g.groupId || g.id || id

        setGroup({ id: groupId, name: groupName, avatar })

        // overallStanding: backend sends an object with text and color
        setOverallStanding(data.overallStanding || data.overall || g.overallStanding || null)

        // membersStanding: backend uses memberName and balance
        const members = data.membersStanding || data.memberStandings || g.membersStanding || []
        setMembersStanding(members)

        // normalize expenses (backend uses expenseId, expenseTitle, expenseDate)
        const backendExpenses = data.expenses || []
        const normalized = backendExpenses.map((e) => {
          // format date like 'Mar 01' if expenseDate provided
          let dateStr = ''
          const rawDate = e.expenseDate || e.date
          if (rawDate) {
            try {
              const d = new Date(rawDate)
              const month = d.toLocaleString('en-US', { month: 'short' })
              const day = String(d.getDate()).padStart(2, '0')
              dateStr = `${month} ${day}`
            } catch (err) {
              dateStr = rawDate
            }
          }

          const rawType = e.type || e.expenseType || ''
          return {
            id: e.expenseId || e.id,
            date: dateStr || e.date || '',
            title: e.expenseTitle || e.title || '',
            subtitle: e.subtitle || e.subtitle || e.expenseType || '',
            amount: e.amount || 0,
            type: (rawType || '').toLowerCase(),
            highlight: !!e.highlight,
          }
        })
        setExpenses(normalized)

        if ((!data.group || Object.keys(data.group).length === 0) && !data.expenses)
          setMessage('No group data available.')
      } catch (err) {
        console.error(err)
        setMessage(err.response?.data?.error || 'Failed to fetch group details.')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id, userId])

  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading group...</div>
  if (!group) return <div className='p-6 text-gray-500 dark:text-gray-400'>{message || 'No group data.'}</div>

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='w-full text-center py-5 border-b relative'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Group View</h1>
      </div>

      {/* Group Info */}
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
              <p className={`mt-1 font-medium ${overallStanding.color || 'text-emerald-600'}`}>
                {overallStanding.text || overallStanding}
              </p>
            )}

            <div className='mt-2 text-sm space-y-1'>
              {membersStanding.map((m) => {
                const balance = Number(m.balance ?? m.amount ?? 0)
                let text = ''
                let colorClass = m.color || ''
                if (balance > 0) {
                  text = `${m.memberName || m.name || m.memberName || m.member || ''} owes you $${Math.abs(balance)}`
                  colorClass = colorClass || 'text-emerald-600'
                } else if (balance < 0) {
                  text = `You owe ${m.memberName || m.name || ''} $${Math.abs(balance)}`
                  colorClass = colorClass || 'text-red-500'
                } else {
                  text = `${m.memberName || m.name || ''} settled up`
                }
                return (
                  <p key={m.userId || m.id || m.memberName} className={colorClass}>
                    {text}
                  </p>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={() => navigate(`/groups/${id}/edit`, { replace: true })}
            className='sm:w-24 bg-emerald-500 text-white rounded-xl py-3 hover:bg-emerald-600 flex items-center justify-center transition'
          >
            ⚙
          </button>
        </div>
      </section>

      {/* Expense List */}
      <main className='max-w-3xl mx-auto px-4 pb-10'>
        <h3 className='text-lg font-semibold mb-4'>Expenses</h3>
        <div className='flex flex-col gap-3'>
          {expenses.map((ex) => (
            <ExpenseItemCard
              key={ex.id}
              date={ex.date}
              title={ex.title}
              subtitle={ex.subtitle}
              amount={ex.amount}
              type={ex.type}
              highlight={ex.highlight}
              onClick={() => navigate(`/groups/${id}/expenses/${ex.id}`, { state: { ...ex, fromGroup: true } })}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
