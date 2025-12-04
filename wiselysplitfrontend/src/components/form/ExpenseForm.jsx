// src/components/form/ExpenseForm.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createNewExpense,
  validateExpense,
  normalizeExpenseForAPI,
  getFriendOweOptions,
} from '../../utils/expenseModel'
import BillSplit from '../../pages/expense/BillSplit'

// Small toggle switch
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type='button'
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 flex items-center rounded-full transition ${
        checked ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <div
        className={`h-4 w-4 bg-white rounded-full shadow transform transition ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ExpenseForm({
  mode = 'create',
  initialData,
  onSubmit,
  currentUserId,
  friendsAndGroups,
}) {
  const navigate = useNavigate()
  const { id } = useParams()

  const [expense, setExpense] = useState(initialData)
  const [equalSplit, setEqualSplit] = useState(true)

  const [showBillSplit, setShowBillSplit] = useState(false)
  const [billSplitApplied, setBillSplitApplied] = useState(false)

  // ---------- helpers ----------
  const clone = (obj) => JSON.parse(JSON.stringify(obj))
  const includedOf = (arr) => arr.filter((m) => m.include)

  const equalDivide = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const n = inc.length
    const per = n ? (parseFloat(next.amount) || 0) / n : 0
    next.splitDetails = next.splitDetails.map((m) =>
      m.include
        ? { ...m, portion: 1, amount: per }
        : { ...m, portion: 0, amount: 0 }
    )
    return next
  }

  const amountsFromPortions = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const totalPortions = inc.reduce((s, m) => s + (Number(m.portion) || 0), 0)

    next.splitDetails = next.splitDetails.map((m) => {
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

    next.splitDetails = next.splitDetails.map((m) => {
      if (!m.include) return { ...m, portion: 0 }
      if (sumAmt <= 0) return { ...m, portion: 0 }
    
      const avg = sumAmt / n
      const calculated = (Number(m.amount) || 0) / avg
      return { ...m, portion: Number(calculated.toFixed(1)) }
    })
    
    return next
  }

  // ---------- lifecycle ----------
  useEffect(() => {
    if (!expense?.date) {
      const today = new Date().toLocaleDateString('en-CA')
      setExpense((p) => ({ ...p, date: today }))
    }
    setBillSplitApplied(expense?.billSplitUsed || false)
    console.log('billSplitApplied set to:', billSplitApplied)
  }, [])

  // ---------- BUILD MEMBERS FOR BILL SPLIT ----------
  const buildBillSplitMembers = () => {
    if (!expense) return []

    // GROUP → use group members
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

    // FRIEND → you + friend
    return [
      { userId: currentUserId, name: 'You' },
      {
        userId: expense.shareWithId,
        name: expense.shareWith,
      },
    ]
  }

  // ---------- field handlers ----------
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

  // when user changes “Share With”
  const handleShareWithChange = (e) => {
    const selected = friendsAndGroups.find((p) => p.id === parseInt(e.target.value))

    setExpense((prev) => {
      const base = createNewExpense(
        selected.id,        // shareWithId
        selected.name,      // shareWith name
        selected.type,      // friend/group
        selected.members || []
      )

      base.title = prev.title
      base.amount = prev.amount
      base.date = prev.date
      base.type = prev.type
      base.payerId = prev.payerId

      return base.shareWithType === 'group' ? equalDivide(base) : base
    })

    setEqualSplit(true)
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
        if (equalSplit) next = equalDivide(next)
        else {
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
      if (prev.shareWithType !== 'group') return prev
      return val ? equalDivide(prev) : amountsFromPortions(prev)
    })
  }

  const handlePortionChange = (index, value) => {
    const v = value === '' ? '' : Number(value)

    setExpense((prev) => {
      let next = clone(prev)
      next.splitDetails[index].portion = v

      if (next.shareWithType === 'group' && !equalSplit) {
        next = amountsFromPortions(next)
      }

      return next
    })
  }

  const handleAmountChange = (index, value) => {
    const v = value === '' ? '' : Number(value)

    setExpense((prev) => {
      let next = clone(prev)
      next.splitDetails[index].amount = v

      if (next.shareWithType === 'group' && !equalSplit) {
        next = portionsFromAmounts(next)
      }

      return next
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const error = validateExpense(expense, currentUserId)
    if (error) return alert(error)

    const payload = normalizeExpenseForAPI({...expense}, currentUserId, billSplitApplied )
    onSubmit(payload)
  }


  const handleOpenBillSplit = () => {
    const members = buildBillSplitMembers()
    if (!members.length) {
      alert('No participants available to split this bill.')
      return
    }

    setShowBillSplit(true)
  }

  const handleBillSplitApply = (billSplitDetails, totalAmount) => {
    console.log('ExpenseForm 262 : billSplitDetails', billSplitDetails)
    setExpense((prev) => {

      // Initialize splitDetails for friend expenses if they don't exist
      if (prev.shareWithType === 'friend' && (!prev.splitDetails || prev.splitDetails.length === 0)) {
        prev.splitDetails = [
          { userId: currentUserId, name: 'You', amount: 0, portion: 0, include: false },
          { userId: prev.shareWithId, name: prev.shareWith, amount: 0, portion: 0, include: false },
        ]
      }
      
      const updatedSplitDetails = prev.splitDetails.map((member) => {
        // find the matching member from bill split results
        const updated = billSplitDetails.find((m) => m.userId === member.userId)

        if (updated) {
          // member participated → update amount, include = true
          return {
            ...member,
            amount: Number(updated.amount.toFixed(2)),
            include: true,
            portion: 1, // item-based bill split uses portion=1
          }
        }

        // member did NOT participate → preserve them with include: false and amount: 0
        return {
          ...member,
          amount: 0,
          include: false,
          portion: 0,
        }
      })

      return {
        ...prev,
        amount: Number(totalAmount.toFixed(2)),
        splitDetails: updatedSplitDetails,
      }
    })

    setEqualSplit(false)
    setShowBillSplit(false)
    setBillSplitApplied(true)
  }

  const handleBillSplitCancel = () => {
    setShowBillSplit(false)
  }

  // ---------- RENDER BILL SPLIT SCREEN ----------
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

  // ---------- UI ----------
  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 rounded-xl'>
      {/* Share With */}
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
          Share Expense With:
        </label>
        <select
          name='shareWithId'
          value={expense.shareWithId || ''}
          onChange={handleShareWithChange}
          required
          className='w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
        >
          {friendsAndGroups.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.type === 'group' ? '(Group)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Title & Date */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Expense Title:</label>
          <input
            type='text'
            name='title'
            value={expense.title}
            onChange={updateField}
            required
            placeholder='e.g. Lunch with client'
            className='w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Date:</label>
          <input
            type='date'
            name='date'
            value={expense.date}
            onChange={updateField}
            required
            className='w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
          />
        </div>
      </div>

      {/* Amount */}
      <div className='grid grid-cols-3 gap-3 items-end'>
        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Amount:</label>
          <div className='flex items-center gap-2'>
            <span className='text-gray-700 dark:text-gray-300 font-semibold'>$</span>
            <input
              type='number'
              name='amount'
              value={expense.amount === 0 ? '' : expense.amount}
              onChange={updateField}
              step='0.01'
              min='0'
              placeholder='0.00'
              className='w-full border border-gray-300 rounded-xl bg-white dark:bg-gray-800 px-3 py-2 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
            />
          </div>
        </div>
        <button
          type='button'
          onClick={handleOpenBillSplit}
          className='bg-emerald-500 font-semibold rounded-xl py-2 hover:bg-emerald-600 transition'
        >
          Split a Bill
        </button>
      </div>

      {/* Type */}
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Expense Type:</label>
        <select
          name='type'
          value={expense.type}
          onChange={updateField}
          required
          className='w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
        >
          <option value=''>Select a type</option>
          <option value='Work'>Work</option>
          <option value='Food'>Food</option>
          <option value='Travel'>Travel</option>
          <option value='Personal'>Personal</option> 
          <option value='Utilities'>Utilities</option> 
          <option value='Entertainment'>Entertainment</option> 
          <option value='Other'>Other</option>
        </select>
      </div>

      {/* Paid By */}
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Paid By:</label>
        <select
          name='payerId'
          value={expense.payerId ?? ''}
          onChange={(e) =>
            setExpense((prev) => ({ ...prev, payerId: parseInt(e.target.value) }))
          }
          required
          className='w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
        >
          <option value={currentUserId}>You</option>
          {expense.shareWithType === 'group' &&
            expense.splitDetails.map((m, i) => (
              <option key={i} value={m.userId}>{m.name}</option>
            ))}
          {expense.shareWithType === 'friend' && (
            <option value={expense.shareWithId}>{expense.shareWith}</option>
          )}
        </select>
      </div>

      {/* Who Owes (friend only) */}
      {!billSplitApplied && expense.shareWithType === 'friend' && (
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Who Owes:</label>
          <select
            name='owes'
            value={expense.owes || ''}
            onChange={updateField}
            required
            className='w-full border border-gray-300 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
          >
            <option value=''>Select Option</option>
            {getFriendOweOptions(expense.shareWith).map((opt, idx) => (
              <option key={idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Group Split UI */}
      {(billSplitApplied || expense.shareWithType === 'group') && (
        <div className='mt-4 border border-gray-200 bg-white dark:bg-gray-800 rounded-xl overflow-hidden'>
          <div className='flex justify-between items-center bg-white dark:bg-gray-800 px-4 py-2 border-b'>
            <span className='font-semibold text-sm text-gray-700 dark:text-gray-300'>Split Between:</span>
            <div className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
              <span>Equally</span>
              <ToggleSwitch checked={equalSplit} onChange={handleEqualToggle} />
            </div>
          </div>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-white dark:bg-gray-800'>
                <th className='text-left p-3 font-semibold'>Name</th>
                <th className='text-right p-3 font-semibold'>Amount ($)</th>
                <th className='text-right p-3 font-semibold'>Portion</th>
                <th className='text-center p-3 font-semibold'>Include</th>
              </tr>
            </thead>
            <tbody>
              {expense.splitDetails.map((m, i) => {
                const rowDisabled = !m.include
                const lockInputs = equalSplit || rowDisabled
                return (
                  <tr key={i} className={`border-t ${rowDisabled ? 'opacity-50 bg-gray-50 dark:bg-gray-700' : ''}`}>
                    <td className='p-3'>{m.name}</td>
                    <td className='p-3 text-right'>
                      <input
                        type='number'
                        value={m.amount === '' ? '' : m.amount}
                        step='0.01'
                        min='0'
                        disabled={lockInputs}
                        onChange={(e) => handleAmountChange(i, e.target.value)}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) handleAmountChange(i, val.toFixed(2))
                        }}
                        className='w-20 text-right border border-gray-300 bg-gray-100 dark:text-gray-800 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-400 disabled:text-gray-500 disabled:bg-gray-300'
                      />
                    </td>
                    <td className='p-3 text-right'>
                      <input
                        type='number'
                        value={m.portion === '' ? '' : Number(m.portion)}
                        min='0'
                        step='1'
                        disabled={lockInputs}
                        onChange={(e) => handlePortionChange(i, e.target.value)}
                        className='w-14 text-right border border-gray-300 bg-gray-100 dark:text-gray-800 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-400 disabled:text-gray-500 disabled:bg-gray-300'
                      />
                    </td>
                    <td className='text-center p-3'>
                      <input
                        type='checkbox'
                        checked={!!m.include}
                        onChange={() => toggleInclude(i)}
                        className='w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-400'
                      />
                    </td>
                  </tr>
                )
              })}

              <tr className='bg-white dark:bg-gray-800 border-t font-semibold'>
                <td className='p-3 text-right'>Total:</td>
                <td className='p-3 text-right'>
                  $
                  {expense.splitDetails
                    .reduce((s, m) => s + (m.include ? Number(m.amount) || 0 : 0), 0)
                    .toFixed(2)}
                </td>
                <td className='p-3 text-right'>
                  {expense.splitDetails
                    .reduce((s, m) => s + (m.include ? Number(m.portion) || 0 : 0), 0)
                    .toFixed(0)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Save / Cancel */}
      <div className='flex flex-col gap-3 mt-6'>
        <button
          type='submit'
          className='w-full bg-emerald-500 text-white font-semibold rounded-xl py-3 hover:bg-emerald-600 transition'
        >
          {mode === 'edit' ? 'Update Expense' : 'Save Expense'}
        </button>
        <button
          type='button'
          onClick={() => navigate(`/friends/${id}`)}
          className='w-full border border-gray-300 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:bg-gray-100 hover:text-gray-900 transition'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}