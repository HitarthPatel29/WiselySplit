// src/pages/Expense/AddExpense.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseForm from '../../components/form/ExpenseForm'
import { createNewExpense, validateExpense, normalizeExpenseForAPI } from '../../utils/expenseModel'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import { useNotification } from '../../context/NotificationContext'

export default function AddExpense() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId, friendsAndGroups, setFriendsAndGroups } = useAuth()
  const { showSuccess, showError } = useNotification()
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
      showSuccess('Expense added successfully!', { asSnackbar: true })

      if (payload.shareWithType === 'group') navigate(`/groups/${payload.shareWithId}`)
      else navigate(`/friends/${payload.shareWithId}`)
    } catch (err) {
      console.error('❌ Failed to save expense:', err)
      showError(err.response?.data?.error || 'Failed to save expense.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  if (!expense) {
    return (
      <div className='min-h-screen'>
        <Header title='Add Expense' />
        <div 
          className='p-6 text-gray-500 dark:text-gray-400'
          role="status"
          aria-live="polite"
          aria-label="Loading expense form"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true"></div>
            <p className="sr-only">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen'>
      <Header title='Add Expense' />
      <main 
        id="main-content"
        className='max-w-2xl mx-auto px-4 py-10'
        role="main"
      >
        <ExpenseForm
          mode='create'
          initialData={expense}
          onSubmit={handleSave}
          currentUserId={userId}
          friendsAndGroups={friendsAndGroups}
        />
        {saving && (
          <div 
            role="status"
            aria-live="polite"
            className='mt-3 text-sm text-gray-600 dark:text-gray-400 italic'
          >
            <p>Saving expense...</p>
          </div>
        )}
      </main>
    </div>
  )
}