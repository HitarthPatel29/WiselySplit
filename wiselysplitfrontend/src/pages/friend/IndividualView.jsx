import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

export default function IndividualView() {
  const navigate = useNavigate()
  const { friendId } = useParams()
  const { userId } = useAuth()

  const [friend, setFriend] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !friendId) return
      try {
        const res = await api.get(`/friends/${userId}/${friendId}`)
        const data = res.data || {}

        console.log('Fetched individual friend data:', data)
        // Normalize friend object (backend uses profilePicture, amount, userId, youOwe)
        const backendFriend = data.friend || null
        const normalizedFriend = backendFriend
          ? {
              name: backendFriend.name,
              avatar: backendFriend.profilePicture || backendFriend.avatar || '',
              youOwe: backendFriend.youOwe,
              amountOwed: backendFriend.amount,
              userId: backendFriend.userId || backendFriend.id,
            }
          : null

        // Normalize expenses array (backend uses expenseId, expenseTitle, expenseDate, amount, subtitle, type)
        const backendExpenses = data.expenses || []
        const normalizedExpenses = backendExpenses
          .filter(e => e.expenseType?.toLowerCase() !== 'fugazi')
          .map((e) => {
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
              balance:  Math.abs(e.balance || 0),
              type: e.type || (e.expenseType ? (e.expenseType.toLowerCase() === 'lent' ? 'lent' : 'owe') : ''),
              highlight: !!e.highlight,
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
    }
    fetchData()
  }, [userId, friendId])

  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading...</div>
  if (!friend) return <div className='p-6 text-gray-500 dark:text-gray-400'>{message || 'No friend data.'}</div>

  return (
    <div className='min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold mb-1'>Individual View</h1>
      </div>

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
                ? `You owe ${friend.name} $${friend.amountOwed}`
                : `${friend.name} owes you $${friend.amountOwed}`}
            </p>
          </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 justify-center mt-4'>
          <button
            onClick={() => navigate(`/friends/0/add-expense`)}
            className='sm:w-full bg-emerald-100 text-emerald-700 dark:text-emerald-100 dark:bg-emerald-700 font-semibold rounded-xl py-3 hover:bg-emerald-200 dark:hover:bg-emerald-600'
          >
            + Add Expense
          </button>
          <button className='sm:w-52 bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600'>
            Settle Up
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
              subtitle={ex.expenseType}
              amount={ex.balance}
              type={ex.type}
              highlight={ex.highlight}
              onClick={() =>
                navigate(`/friends/${friendId}/expenses/${ex.id}`, { state: ex })
              }
            />
          ))}
        </div>
      </main>
    </div>
  )
}
