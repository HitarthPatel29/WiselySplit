// src/components/form/ExpenseForm.jsx
// Unified expense form with Shared / Personal toggle and 2-card layout

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createNewExpense,
  createNewPersonalExpense,
  validateExpense,
  normalizeExpenseForAPI,
} from '../../utils/expenseModel'
import BillSplit from '../../pages/expense/BillSplit'
import BaseExpenseFields from './BaseExpenseFields'
import SharedExpenseFields from './SharedExpenseFields'
import PersonalExpenseFields from './PersonalExpenseFields'
import { useNotification } from '../../context/NotificationContext'

export default function ExpenseForm({
  mode = 'create',
  initialData,
  onSubmit,
  currentUserId,
  friendsAndGroups = [],
  wallets = [],
  defaultMode = 'shared',
  entryContext = 'shared',
}) {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showError } = useNotification()

  const [expenseMode, setExpenseMode] = useState(defaultMode)
  const [expense, setExpense] = useState(initialData)
  const [equalSplit, setEqualSplit] = useState(true)
  const [showBillSplit, setShowBillSplit] = useState(false)
  const [billSplitApplied, setBillSplitApplied] = useState(false)

  const clone = (obj) => JSON.parse(JSON.stringify(obj))
  const includedOf = (arr) => (arr || []).filter((m) => m.include)

  const equalDivide = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const n = inc.length
    const per = n ? (parseFloat(next.amount) || 0) / n : 0
    next.splitDetails = (next.splitDetails || []).map((m) =>
      m.include ? { ...m, portion: 1, amount: per } : { ...m, portion: 0, amount: 0 }
    )
    return next
  }

  const amountsFromPortions = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const totalPortions = inc.reduce((s, m) => s + (Number(m.portion) || 0), 0)
    next.splitDetails = (next.splitDetails || []).map((m) => {
      if (!m.include) return { ...m, amount: 0 }
      if (totalPortions <= 0) return { ...m, amount: 0 }
      const share = (Number(m.portion) || 0) / totalPortions
      const calculated = (Number(next.amount) || 0) * share
      return { ...m, amount: Number(calculated.toFixed(2)) }
    })
    return next
  }

  const portionsFromAmounts = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const sumAmt = inc.reduce((s, m) => s + (Number(m.amount) || 0), 0)
    const n = inc.length || 1
    next.splitDetails = (next.splitDetails || []).map((m) => {
      if (!m.include) return { ...m, portion: 0 }
      if (sumAmt <= 0) return { ...m, portion: 0 }
      const avg = sumAmt / n
      const calculated = (Number(m.amount) || 0) / avg
      return { ...m, portion: Number(calculated.toFixed(1)) }
    })
    return next
  }

  useEffect(() => {
    if (!expense?.date) {
      const today = new Date().toLocaleDateString('en-CA')
      setExpense((p) => (p ? { ...p, date: today } : { date: today }))
    }
    setBillSplitApplied((prev) => expense?.billSplitUsed ?? prev)
  }, [])

  const buildBillSplitMembers = () => {
    if (!expense) return []
    if (expense.shareWithType === 'group') {
      const unique = []
      const seen = new Set()
      ;(expense.splitDetails || []).forEach((m) => {
        if (!seen.has(m.userId)) {
          seen.add(m.userId)
          unique.push({ userId: m.userId, name: m.name })
        }
      })
      return unique
    }
    return [
      { userId: currentUserId, name: 'You' },
      { userId: expense.shareWithId, name: expense.shareWith },
    ]
  }

  const updateField = (e) => {
    const { name, value } = e.target
    setExpense((prev) => {
      let next = clone(prev)
      next[name] = value
      if (name === 'amount' && next.shareWithType === 'group') {
        next = equalSplit ? equalDivide(next) : amountsFromPortions(next)
      }
      return next
    })
  }

  const handleModeToggle = (newMode) => {
    if (newMode === expenseMode) return
    setExpenseMode(newMode)
    setExpense((prev) => {
      const common = {
        title: prev?.title ?? '',
        amount: prev?.amount ?? 0,
        date: prev?.date ?? new Date().toLocaleDateString('en-CA'),
        type: prev?.type ?? '',
      }
      if (newMode === 'personal') {
        return {
          ...createNewPersonalExpense(currentUserId),
          ...common,
        }
      }
      const first = friendsAndGroups[0]
      if (!first) return prev
      const base = createNewExpense(
        first.id,
        first.name,
        first.type || 'friend',
        first.members || [],
        currentUserId
      )
      return { ...base, ...common }
    })
    if (newMode === 'shared') setEqualSplit(true)
  }

  const handleShareWithChange = (e) => {
    const selected = friendsAndGroups.find((p) => p.id === parseInt(e.target.value, 10))
    if (!selected) return
    setExpense((prev) => {
      const base = createNewExpense(
        selected.id,
        selected.name,
        selected.type || 'friend',
        selected.members || [],
        currentUserId
      )
      base.title = prev?.title ?? ''
      base.amount = prev?.amount ?? 0
      base.date = prev?.date ?? ''
      base.type = prev?.type ?? ''
      base.payerId = prev?.payerId ?? currentUserId
      return base.shareWithType === 'group' ? equalDivide(base) : base
    })
    setEqualSplit(true)
  }

  const handlePayerChange = (payerId) => {
    setExpense((prev) => ({ ...clone(prev), payerId }))
  }

  const handleWalletChange = (walletId) => {
    setExpense((prev) => ({ ...clone(prev), walletId }))
  }

  const toggleInclude = (index) => {
    setExpense((prev) => {
      let next = clone(prev)
      const member = next.splitDetails[index]
      member.include = !member.include
      if (!member.include) {
        member.portion = 0
        member.amount = 0
        next = equalSplit ? equalDivide(next) : amountsFromPortions(next)
      } else {
        if (equalSplit) {
          next = equalDivide(next)
        } else {
          member.portion = 1
          next = amountsFromPortions(next)
        }
      }
      return next
    })
  }

  const handleEqualToggle = (val) => {
    setEqualSplit(val)
    setExpense((prev) => {
      if (prev?.shareWithType !== 'group') return prev
      return val ? equalDivide(prev) : amountsFromPortions(prev)
    })
  }

  const handlePortionChange = (index, value) => {
    const v = value === '' ? '' : Number(value)
    setExpense((prev) => {
      let next = clone(prev)
      next.splitDetails[index].portion = v
      if (next.shareWithType === 'group' && !equalSplit) next = amountsFromPortions(next)
      return next
    })
  }

  const handleAmountChange = (index, value) => {
    const v = value === '' ? '' : Number(value)
    setExpense((prev) => {
      let next = clone(prev)
      next.splitDetails[index].amount = v
      if (next.shareWithType === 'group' && !equalSplit) next = portionsFromAmounts(next)
      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const error = validateExpense(
      expense,
      currentUserId,
      billSplitApplied,
      expenseMode,
      wallets
    )
    if (error) {
      showError(error, { asSnackbar: true })
      return
    }
    const payload = normalizeExpenseForAPI(
      { ...expense },
      currentUserId,
      billSplitApplied,
      expenseMode
    )
    onSubmit(payload, expenseMode)
  }

  const handleOpenBillSplit = () => {
    const members = buildBillSplitMembers()
    if (!members.length) {
      showError('No participants available to split this bill.', { asSnackbar: true })
      return
    }
    setShowBillSplit(true)
  }

  const handleBillSplitApply = (billSplitDetails, totalAmount) => {
    setExpense((prev) => {
      const prevClone = clone(prev)
      if (
        prevClone.shareWithType === 'friend' &&
        (!prevClone.splitDetails || prevClone.splitDetails.length === 0)
      ) {
        prevClone.splitDetails = [
          { userId: currentUserId, name: 'You', amount: 0, portion: 0, include: false },
          {
            userId: prevClone.shareWithId,
            name: prevClone.shareWith,
            amount: 0,
            portion: 0,
            include: false,
          },
        ]
      }
      const updatedSplitDetails = (prevClone.splitDetails || []).map((member) => {
        const updated = billSplitDetails.find((m) => m.userId === member.userId)
        if (updated) {
          return {
            ...member,
            amount: Number(updated.amount.toFixed(2)),
            include: true,
            portion: 1,
          }
        }
        return { ...member, amount: 0, include: false, portion: 0 }
      })
      return {
        ...prevClone,
        amount: Number(totalAmount.toFixed(2)),
        splitDetails: updatedSplitDetails,
      }
    })
    setEqualSplit(false)
    setShowBillSplit(false)
    setBillSplitApplied(true)
  }

  const handleBillSplitCancel = () => setShowBillSplit(false)

  const handleCancel = () => {
    navigate(-1)
  }

  if (showBillSplit) {
    const members = buildBillSplitMembers()
    return (
      <BillSplit
        members={members}
        onApply={handleBillSplitApply}
        onCancel={handleBillSplitCancel}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl">
      {/* Shared / Personal toggle */}
      <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => handleModeToggle('shared')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
            expenseMode === 'shared'
              ? 'bg-emerald-500 text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-pressed={expenseMode === 'shared'}
        >
          Shared expense
        </button>
        <button
          type="button"
          onClick={() => handleModeToggle('personal')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
            expenseMode === 'personal'
              ? 'bg-emerald-500 text-white shadow'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-pressed={expenseMode === 'personal'}
        >
          Personal expense
        </button>
      </div>

      {/* Card 1: Common details */}
      <BaseExpenseFields expense={expense} onChange={updateField} />

      {/* Card 2: Mode-specific */}
      {expenseMode === 'shared' && (
        <SharedExpenseFields
          expense={expense}
          friendsAndGroups={friendsAndGroups}
          currentUserId={currentUserId}
          equalSplit={equalSplit}
          billSplitApplied={billSplitApplied}
          wallets={wallets}
          onShareWithChange={handleShareWithChange}
          onPayerChange={handlePayerChange}
          onWalletChange={handleWalletChange}
          onOpenBillSplit={handleOpenBillSplit}
          onFieldChange={updateField}
          toggleInclude={toggleInclude}
          onEqualToggle={handleEqualToggle}
          onPortionChange={handlePortionChange}
          onAmountChange={handleAmountChange}
        />
      )}
      {expenseMode === 'personal' && (
        <PersonalExpenseFields
          expense={expense}
          wallets={wallets}
          onWalletChange={handleWalletChange}
        />
      )}

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="submit"
          className="w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition"
        >
          {mode === 'edit' ? 'Update expense' : 'Save expense'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}