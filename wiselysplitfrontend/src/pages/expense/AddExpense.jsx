// src/pages/Expense/AddExpense.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseForm from '../../components/form/ExpenseForm'
import { createNewExpense, validateExpense, normalizeExpenseForAPI } from '../../utils/expenseModel'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

export default function AddExpense() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId, friendsAndGroups, setFriendsAndGroups } = useAuth()
  const [saving, setSaving] = useState(false)
  const [expense, setExpense] = useState(null)

  // Initialize default expense object
  useEffect(() => {
    if (friendsAndGroups.length > 0) {
      const current = friendsAndGroups.find((f) => f.id === parseInt(id)) || friendsAndGroups[0]
      setExpense(
        createNewExpense(
          current.id,
          current.name,
          current.type,
          current.members || [],
          userId
        )
      )
    }
    console.log('AddExpense: userID:', userId)
  }, [friendsAndGroups, id])


  const handleSave = async (payload) => {
    try {
      setSaving(true)
      console.log('payload:', payload)

      const res = await api.post('/expenses', payload)
      alert('Expense added successfully!')

      if (payload.shareWithType === 'group') navigate(`/groups/${payload.shareWithId}`)
      else navigate(`/friends/${payload.shareWithId}`)
    } catch (err) {
      console.error('❌ Failed to save expense:', err)
      alert(err.response?.data?.error || 'Failed to save expense.')
    } finally {
      setSaving(false)
    }
  }

  if (!expense) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading...</div>

  return (
    <div className='min-h-screen'>
      <div className='w-full text-center py-5 border-b border-gray-200 relative'>
        <BackButton />
        <h1 className='text-xl font-bold'>Add Expense</h1>
      </div>
      <main className='max-w-2xl mx-auto px-4 py-10'>
        <ExpenseForm
          mode='create'
          initialData={expense}
          onSubmit={handleSave}
          currentUserId={userId}
          friendsAndGroups={friendsAndGroups}
        />
        {saving && (
          <p className='mt-3 text-sm text-gray-600 dark:text-gray-400 italic'>Saving expense...</p>
        )}
      </main>
    </div>
  )
}