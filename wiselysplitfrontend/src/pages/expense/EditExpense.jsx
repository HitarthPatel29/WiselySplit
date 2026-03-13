// src/pages/Expense/EditExpense.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseForm from '../../components/form/ExpenseForm.jsx'
import { validateExpense, normalizeExpenseForAPI, normalizeExpenseForFields } from '../../utils/expenseModel.js'
import api from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Header from '../../components/Header.jsx'
import { useNotification } from '../../context/NotificationContext'

export default function EditExpense() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id, expenseId } = useParams() // id = friendId or groupId
  const { userId, friendsAndGroups, wallets = [] } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [expense, setExpense] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)
  const [saving, setSaving] = useState(false)

  // Fetch the expense from backend if not provided via location.state
  useEffect(() => {
    const fetchExpense = async () => {
      if (expense && expense.splitDetails?.length > 0) return
      try {
        console.log('Fetching expense again for EditExpense')
        const res = await api.get(`/expenses/${expenseId}`)
        const normalized = normalizeExpenseForFields(res.data, userId, friendsAndGroups)
        console.log('EditExpense: normalized expense', normalized)
        setExpense(normalized)
      } catch (err) {
        console.error('❌ Failed to load expense:', err)
        showError('Failed to load expense details.', { asSnackbar: true })
      } finally {
        setLoading(false)
      }
    }
    console.log('EditExpense: Normalized expense ', expense)
    fetchExpense()
  }, [expenseId, id, userId])

  const handleUpdate = async (payload, _mode) => {
    try {
      setSaving(true)
      await api.put(`/expenses/${expenseId}`, payload)
      showSuccess('Expense updated successfully!', { asSnackbar: true })

      if (payload.shareWithType === 'group') navigate(`/groups/${payload.shareWithId}`)
      else if (payload.shareWithId != null) navigate(`/friends/${payload.shareWithId}`)
      else navigate(-1)
    } catch (err) {
      console.error('❌ Failed to save expense:', err)
      showError(err.response?.data?.error || 'Failed to save expense.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading expense...</div>

  return (
    <div className='min-h-screen '>

      <Header title='Edit Expense' />

      <main className='max-w-2xl mx-auto px-4 py-10'>
        <ExpenseForm
          mode="edit"
          initialData={expense}
          onSubmit={handleUpdate}
          currentUserId={userId}
          friendsAndGroups={friendsAndGroups}
          wallets={wallets}
          defaultMode={expense?.shareWithType != null ? 'shared' : 'personal'}
          entryContext={expense?.shareWithType != null ? 'shared' : 'personal'}
        />
        {saving && (
          <p className='mt-3 text-sm text-gray-600 dark:text-gray-400 italic'>Saving changes...</p>
        )}
      </main>
    </div>
  )
}