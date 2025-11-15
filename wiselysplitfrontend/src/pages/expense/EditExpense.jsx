// src/pages/Expense/EditExpense.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import BackButton from '../../components/IO/BackButton.jsx'
import ExpenseForm from '../../components/form/ExpenseForm.jsx'
import { validateExpense, normalizeExpenseForAPI, normalizeExpenseForFields } from '../../utils/expenseModel.js'
import api from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Header from '../../components/Header.jsx'

export default function EditExpense() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id, expenseId } = useParams() // id = friendId or groupId
  const { userId, friendsAndGroups } = useAuth()
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
        alert('Failed to load expense details.')
      } finally {
        setLoading(false)
      }
    }
    console.log('EditExpense: Normalized expense ', expense)
    fetchExpense()
  }, [expenseId, id, userId])

  const handleUpdate = async (payload) => {
    try {
      setSaving(true)
      console.log('payload:', payload)

      const res = await api.put(`/expenses/${expenseId}`, payload)
      alert('Expense updated successfully!')

      if (payload.shareWithType === 'group') navigate(`/groups/${payload.shareWithId}`)
      else navigate(`/friends/${payload.shareWithId}`)
    } catch (err) {
      console.error('❌ Failed to save expense:', err)
      alert(err.response?.data?.error || 'Failed to save expense.')
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
          mode='edit'
          initialData={expense}
          onSubmit={handleUpdate}
          currentUserId={userId}
          friendsAndGroups={friendsAndGroups}
        />
        {saving && (
          <p className='mt-3 text-sm text-gray-600 dark:text-gray-400 italic'>Saving changes...</p>
        )}
      </main>
    </div>
  )
}