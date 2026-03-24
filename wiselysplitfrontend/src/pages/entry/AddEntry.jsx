// src/pages/entry/AddEntry.jsx
// Unified entry page with Expense / Income / Transfer toggle
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExpenseForm from '../../components/form/ExpenseForm'
import IncomeForm from '../../components/form/IncomeForm'
import TransferForm from '../../components/form/TransferForm'
import { createNewExpense } from '../../utils/expenseModel'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import { useNotification } from '../../context/NotificationContext'

const ENTRY_MODES = ['expense', 'income', 'transfer']

export default function AddEntry() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId, friendsAndGroups, fetchConnections, wallets = [], fetchWallets } = useAuth()
  const { showSuccess, showError, showAlert } = useNotification()
  const [entryMode, setEntryMode] = useState('expense')
  const [saving, setSaving] = useState(false)
  const [expense, setExpense] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchConnections()
      fetchWallets()
    }
  }, [userId, fetchConnections, fetchWallets])

  useEffect(() => {
    if (entryMode === 'expense') {
      if (friendsAndGroups.length > 0) {
        const current = friendsAndGroups.find((f) => f.id === parseInt(id, 10)) || friendsAndGroups[0]
        setExpense(
          createNewExpense(
            current.id,
            current.name,
            current.type,
            current.members || [],
            userId
          )
        )
      } else {
        showAlert({
          title: 'No Friends or Groups found',
          message: 'No Friends or Groups found to Share Expense.',
          type: 'error',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => setEntryMode('income'),
        })
      }
    } else if (entryMode === 'transfer') {
      if (wallets.length === 0) {
      showAlert({
          title: 'No Wallets found',
          message: 'No Wallets found to transfer to.',
          type: 'error',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => setEntryMode('income'),
        })
      }
    }
  }, [friendsAndGroups, id, userId, entryMode, showAlert, navigate, wallets])

  const handleSaveExpense = async (payload, mode) => {
    try {
      setSaving(true)
      if (mode === 'personal') {
        await api.post('/expenses/personal', payload)
        showSuccess('Personal expense added successfully!', { asSnackbar: true })
        navigate('/personalExpense')
        return
      }
      await api.post('/expenses/shared', payload)
      showSuccess('Expense added successfully!', { asSnackbar: true })
      if (payload.shareWithType === 'group') navigate(`/groups/${payload.shareWithId}`)
      else navigate(`/friends/${payload.shareWithId}`)
    } catch (err) {
      console.error('Failed to save expense:', err)
      showError(err.response?.data?.error || 'Failed to save expense.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveIncome = async (payload) => {
    try {
      setSaving(true)
      await api.post('/expenses/personal', {
        title: payload.title,
        amount: payload.amount,
        date: payload.date,
        type: payload.type,
        userId,
        walletId: payload.walletId ?? null,
        entryKind: 'income',
        isPersonal: true,
      })
      showSuccess('Income added successfully!', { asSnackbar: true })
      navigate('/personalExpense')
    } catch (err) {
      console.error('Failed to save income:', err)
      showError(err.response?.data?.error || 'Failed to save income.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTransfer = async (payload) => {
    try {
      setSaving(true)
      await api.post('/expenses/personal', {
        title: payload.title,
        amount: payload.amount,
        date: payload.date,
        type: 'Transfer',
        userId,
        walletId: payload.fromWalletId ?? null,
        toWalletId: payload.toWalletId ?? null,
        entryKind: 'transfer',
        isPersonal: true,
      })
      showSuccess('Transfer added successfully!', { asSnackbar: true })
      navigate('/personalExpense')
    } catch (err) {
      console.error('Failed to save transfer:', err)
      showError(err.response?.data?.error || 'Failed to save transfer.', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => navigate(-1)

  if (entryMode === 'expense' && !expense) {
    return (
      <div className="min-h-screen">
        <Header title="Add Entry" />
        <div
          className="p-6 text-gray-500 dark:text-gray-400"
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
    <div className="min-h-screen">
      <Header title="Add Entry" />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-4" role="main">
        {/* Expense / Income / Transfer toggle */}
        <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
          {ENTRY_MODES.map((m) => {
            const disabled = m === 'expense' && friendsAndGroups.length === 0 && !expense
            return (
              <button
                key={m}
                type="button"
                onClick={() => !disabled && setEntryMode(m)}
                disabled={disabled}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  entryMode === m
                    ? 'bg-emerald-500 text-white shadow'
                    : disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                aria-pressed={entryMode === m}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            )
          })}
        </div>

        {entryMode === 'expense' && expense && (
          <ExpenseForm
            mode="create"
            initialData={expense}
            onSubmit={handleSaveExpense}
            currentUserId={userId}
            friendsAndGroups={friendsAndGroups}
            wallets={wallets}
            defaultMode="shared"
            entryContext="shared"
          />
        )}

        {entryMode === 'income' && (
          <IncomeForm
            wallets={wallets}
            onSubmit={handleSaveIncome}
            onCancel={handleCancel}
          />
        )}

        {entryMode === 'transfer' && (
          <TransferForm
            wallets={wallets}
            onSubmit={handleSaveTransfer}
            onCancel={handleCancel}
          />
        )}

        {saving && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic"
          >
            <p>Saving...</p>
          </div>
        )}
      </main>
    </div>
  )
}
