import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import ExpenseForm from '../components/forms/ExpenseForm'
import { createNewExpense, validateExpense, normalizeExpenseForAPI } from '../utils/expenseModel'

export default function AddExpense() {
  const navigate = useNavigate()
  const { id } = useParams()

  // Dummy data for now
  const friendsAndGroups = [
    { id: 1, name: 'Aurelia Voss', type: 'friend' },
    { id: 2, name: 'Jay M', type: 'friend' },
    { id: 3, name: 'Tech Innovators', type: 'group', members: ['You', 'Jay.M', 'Tirth'] },
  ]

  const current = friendsAndGroups.find((f) => f.id === parseInt(id)) || friendsAndGroups[0]
  const [expense] = useState(createNewExpense(current.name, current.type, current.members))

  const handleSave = (data) => {
    const error = validateExpense(data)
    if (error) return alert(error)

    const payload = normalizeExpenseForAPI(data)
    console.log('✅ Saved Expense:', payload)
    alert(`Expense added with ${payload.shareWith}`)
    if (data.shareWithType === 'group') navigate(`/groups/${id}`)
    else navigate(`/friends/${id}`)
  }

  return (
    <div className='min-h-screen bg-white text-gray-800'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Add Expense</h1>
      </div>

      <main className='max-w-2xl mx-auto px-4 py-10'>
        <ExpenseForm mode='create' initialData={expense} onSubmit={handleSave} />
      </main>
    </div>
  )
}