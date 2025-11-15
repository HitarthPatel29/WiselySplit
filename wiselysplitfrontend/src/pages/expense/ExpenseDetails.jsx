// src/pages/Expense/ExpenseDetails.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import api from '../../api'
import { normalizeExpenseForFields } from '../../utils/expenseModel'
import { useAuth } from '../../context/AuthContext.jsx'
import Header from '../../components/Header.jsx'

export default function ExpenseDetails() {
  const { id, expenseId } = useParams()
  const {userId, friendsAndGroups} = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [expense, setExpense] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)

  useEffect(() => {
    // If we already have a sufficiently-detailed expense object, skip fetching
    const hasFullDetails = expense && (expense.splitDetails && expense.splitDetails.length > 0) && expense.payer
    if (hasFullDetails) return

    const fetchExpense = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/expenses/${expenseId}`)
        const data = res.data || {}
        console.log('Fetched expense details:', data)
        // normalize server response to expected fields
        const normalized = normalizeExpenseForFields(data, userId, friendsAndGroups)
        console.log("ExpenseDetails: normalized =", normalized)
        setExpense(normalized)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchExpense()
  }, [expenseId])

  if (loading) return <div className='p-6 text-gray-500'>Loading expense...</div>
  if (!expense)
    return (
      <div className='min-h-screen flex justify-center items-center text-gray-600'>
        Expense not found.
      </div>
    )

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    // Perform API delete
    api
      .delete(`/expenses/${expenseId}`)
      .then(() => {
        alert('Expense deleted')
        // navigate back to group or friend based on expense.fromGroup or shareWithType
        if (expense.fromGroup || expense.shareWithType === 'group') {
          navigate(`/groups/${id}`)
        } else {
          navigate(`/friends/${id}`)
        }
      })
      .catch((err) => {
        console.error(err)
        alert(err.response?.data?.error || 'Failed to delete expense')
      })
  }

  return (
    <div className='min-h-screen'>
      <Header title='Expense Details' />

      <main className='max-w-2xl mx-auto px-4 py-10'>
        <div className='bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6'>
          <p className='text-xl font-semibold mb-2'>{expense.title}</p>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>{expense.type}</p>

          <div className='space-y-2'>
            <p><strong>Date:</strong> {expense.date}</p>
            <p><strong>Amount:</strong> ${expense.amount}</p>
            <p><strong>Paid By:</strong> {expense.payer}</p>

            {/* Shared participants or who owes what */}
            {expense.splitDetails && expense.splitDetails.length > 0 && (
              <div className='mt-3 border-t pt-2'>
                <p className='font-medium mb-2'>
                  {expense.shareWithType === 'group' ? 'Split Details:' : 'Who Owes:'}
                </p>
                {expense.splitDetails.map((m, i) => (
                  <div key={i} className='flex justify-between text-sm'>
                    <span>{m.name || m.userName || m.username}</span>
                    <span>${m.amount?.toFixed?.(2) ?? m.amount ?? 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='flex flex-col sm:flex-row gap-3 mt-6'>
            <button
              onClick={() =>
                navigate(`/friends/${id}/expenses/${expenseId}/edit`, { state: expense })
              }
              className='flex-1 bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition'
            >
              Edit Expense
            </button>
            <button
              onClick={handleDelete}
              className='flex-1 border border-red-400 text-red-600 font-semibold rounded-xl py-3 hover:bg-red-50 transition'
            >
              Delete Expense
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}