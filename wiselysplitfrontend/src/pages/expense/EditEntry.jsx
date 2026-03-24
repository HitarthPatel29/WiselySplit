// src/pages/expense/EditEntry.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ExpenseForm from '../../components/form/ExpenseForm.jsx'
import IncomeForm from '../../components/form/IncomeForm.jsx'
import TransferForm from '../../components/form/TransferForm.jsx'
import { validateExpense, normalizeExpenseForAPI, normalizeExpenseForFields } from '../../utils/expenseModel.js'
import api from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Header from '../../components/Header.jsx'
import { useNotification } from '../../context/NotificationContext.jsx'

export default function EditEntry() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id, expenseId } = useParams()
  const { userId, friendsAndGroups, wallets = [] } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [expense, setExpense] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state)
  const [saving, setSaving] = useState(false)

  const entryKind = expense?.entryKind || 'expense'

  useEffect(() => {
    const fetchExpense = async () => {
      if (expense && expense.splitDetails?.length > 0) return
      try {
        const res = await api.get(`/expenses/${expenseId}`)
        const normalized = normalizeExpenseForFields(res.data, userId, friendsAndGroups)
        setExpense(normalized)
      } catch (err) {
        console.error('Failed to load entry:', err)
        showError('Failed to load entry details.', { asSnackbar: true })
      } finally {
        setLoading(false)
      }
    }
    fetchExpense()
  }, [expenseId, id, userId])

  const handleExpenseUpdate = async (payload, _mode) => {
    try {
      setSaving(true)
      await api.put(`/expenses/${expenseId}`, payload)
      showSuccess('Expense updated successfully!', { asSnackbar: true })

      if (payload.shareWithType === 'group') navigate(`/groups/${payload.shareWithId}`)
      else if (payload.shareWithId != null) navigate(`/friends/${payload.shareWithId}`)
      else navigate(-1)
    } catch (err) {
      console.error('Failed to save expense:', err)
      showError(err.response?.data?.error || 'Failed to save expense.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  const handleIncomeUpdate = async (payload) => {
    try {
      setSaving(true)
      await api.put(`/income/${expenseId}`, {
        title: payload.title,
        amount: payload.amount,
        date: payload.date,
        type: payload.type,
        userId: userId,
        walletId: payload.walletId ?? null,
      })
      showSuccess('Income updated successfully!', { asSnackbar: true })
      navigate(-1)
    } catch (err) {
      console.error('Failed to update income:', err)
      showError(err.response?.data?.error || 'Failed to update income.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  const handleTransferUpdate = async (payload) => {
    try {
      setSaving(true)
      console.log(payload)
      await api.put(`/transfer/${expenseId}`, {
        title: payload.title,
        amount: payload.amount,
        date: payload.date,
        type: 'Transfer',
        userId: userId,
        walletId: payload.fromWalletId ?? null,
        toWalletId: payload.toWalletId ?? null,
      })
      showSuccess('Transfer updated successfully!', { asSnackbar: true })
      navigate(-1)
    } catch (err) {
      console.error('Failed to update transfer:', err)
      showError(err.response?.data?.error || 'Failed to update transfer.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className='p-6 text-gray-500 dark:text-gray-400'>Loading entry...</div>

  const headerTitle =
    entryKind === 'income' ? 'Edit Income'
    : entryKind === 'transfer' ? 'Edit Transfer'
    : 'Edit Expense'

  return (
    <div className='min-h-screen '>
      <Header title={headerTitle} />

      <main className='max-w-2xl mx-auto px-4 py-10'>
        {entryKind === 'income' && (
          <IncomeForm
            wallets={wallets}
            initialData={expense}
            onSubmit={handleIncomeUpdate}
            onCancel={() => navigate(-1)}
          />
        )}

        {entryKind === 'transfer' && (
          <TransferForm
            wallets={wallets}
            initialData={expense}
            onSubmit={handleTransferUpdate}
            onCancel={() => navigate(-1)}
          />
        )}

        {entryKind === 'expense' && (
          <ExpenseForm
            mode="edit"
            initialData={expense}
            onSubmit={handleExpenseUpdate}
            currentUserId={userId}
            friendsAndGroups={friendsAndGroups}
            wallets={wallets}
            defaultMode={expense?.shareWithType != null ? 'shared' : 'personal'}
            entryContext={expense?.shareWithType != null ? 'shared' : 'personal'}
          />
        )}

        {saving && (
          <p className='mt-3 text-sm text-gray-600 dark:text-gray-400 italic'>Saving changes...</p>
        )}
      </main>
    </div>
  )
}
