// src/pages/EditExpense.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import BackButton from '../components/BackButton'
import ExpenseForm from '../components/forms/ExpenseForm.jsx'
import { validateExpense, normalizeExpenseForAPI } from '../utils/expenseModel'

export default function EditExpense() {
  const navigate = useNavigate()
  const { id, expenseId } = useParams()
  const location = useLocation()
  const [expense, setExpense] = useState(null)

  useEffect(() => {
    if (location.state) {
      setExpense(location.state)
    } else {
      setExpense({
        id: expenseId,
        title: 'Dinner with team',
        amount: 60,
        date: '2025-10-23',
        type: 'Food',
        payer: 'You',
        shareWith: 'Tech Innovators',
        shareWithType: 'group',
        splitDetails: [
          { name: 'You', amount: 20, portion: 1, include: true },
          { name: 'Jay.M', amount: 20, portion: 1, include: true },
          { name: 'Tirth', amount: 20, portion: 1, include: true },
        ],
      })
    }
  }, [location.state, expenseId])

  const handleUpdate = (data) => {
    const error = validateExpense(data)
    if (error) return alert(error)
    const payload = normalizeExpenseForAPI(data)
    console.log('✅ Updated Expense:', payload)
    alert('Expense updated successfully!')
    navigate(`/friends/${id}/expenses/${expenseId}`, { state: payload })
    
  }

  if (!expense) return <div className='p-6 text-gray-500'>Loading expense...</div>

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Edit Expense</h1>
      </div>
      <main className='max-w-2xl mx-auto px-4 py-10'>
        <ExpenseForm mode='edit' initialData={expense} onSubmit={handleUpdate} />
      </main>
    </div>
  )
}