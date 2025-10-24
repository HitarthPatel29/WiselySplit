import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createNewExpense,
  validateExpense,
  normalizeExpenseForAPI,
  getFriendOweOptions,
} from '../../utils/expenseModel'

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

export default function ExpenseForm({ mode = 'create', initialData, onSubmit }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [expense, setExpense] = useState(initialData)
  const [equalSplit, setEqualSplit] = useState(true)

  // Dummy people list for Share With selector
  const friendsAndGroups = [
    { id: 1, name: 'Aurelia Voss', type: 'friend' },
    { id: 2, name: 'Jay M', type: 'friend' },
    { id: 3, name: 'Tech Innovators', type: 'group', members: ['Jay.M', 'Tirth', 'You'] },
  ]

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

  // Portions → set amounts proportionally (others' portions untouched)
  const amountsFromPortions = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const totalPortions = inc.reduce((s, m) => s + (Number(m.portion) || 0), 0)
    next.splitDetails = next.splitDetails.map((m) => {
      if (!m.include) return { ...m, amount: 0 }
      if (totalPortions <= 0) return { ...m, amount: 0 }
      const share = (Number(m.portion) || 0) / totalPortions
      return { ...m, amount: (Number(next.amount) || 0) * share }
    })
    return next
  }

  // Amounts → update portions to reflect the ratio of amounts
  // (does NOT change others' amounts; portions are relative weights)
  const portionsFromAmounts = (prev) => {
    const next = clone(prev)
    const inc = includedOf(next.splitDetails)
    const sumAmt = inc.reduce((s, m) => s + (Number(m.amount) || 0), 0)
    const n = inc.length || 1
    next.splitDetails = next.splitDetails.map((m) => {
      if (!m.include) return { ...m, portion: 0 }
      if (sumAmt <= 0) return { ...m, portion: 0 }
      // Scale so that if all amounts are equal, each portion ≈ 1
      // i.e., portion = (amount / avgAmount) with avgAmount = sumAmt / n
      const avg = sumAmt / n
      return { ...m, portion: (Number(m.amount) || 0) / avg }
    })
    return next
  }

  // ---------- lifecycle ----------
  // Auto-set today's date
  useEffect(() => {
    if (!expense.date) {
      const today = new Date().toISOString().split('T')[0]
      setExpense((p) => ({ ...p, date: today }))
    }
  }, [])

  // ---------- field handlers ----------
  const updateField = (e) => {
    const { name, value } = e.target
    setExpense((prev) => {
      let next = clone(prev)
      next[name] = value

      // If group and amount changes, recompute distribution
      if (name === 'amount' && next.shareWithType === 'group') {
        next = equalSplit ? equalDivide(next) : amountsFromPortions(next)
      }
      return next
    })
  }

  const handleShareWithChange = (e) => {
    const selected = friendsAndGroups.find((p) => p.name === e.target.value)
    setExpense((prev) => {
      const base = createNewExpense(selected.name, selected.type, selected.members)
      // preserve main fields
      base.title = prev.title
      base.amount = prev.amount
      base.date = prev.date
      base.type = prev.type
      base.payer = prev.payer
      // default distribution for group
      return base.shareWithType === 'group' ? equalDivide(base) : base
    })
    setEqualSplit(true) // reset to Equal when switching
  }

  // Include checkbox
  const toggleInclude = (index) => {
    setExpense((prev) => {
      let next = clone(prev)
      const member = next.splitDetails[index]
      member.include = !member.include

      // --- When excluded ---
      if (!member.include) {
        member.portion = 0
        member.amount = 0

        // After exclusion → recompute the distribution
        if (equalSplit) {
          next = equalDivide(next)
        } else {
          next = amountsFromPortions(next)
        }
      }

      // --- When included again ---
      else {
        if (equalSplit) {
          // Add them back to the equal division
          next = equalDivide(next)
        } else {
          // Default their portion to 1, keep others same
          member.portion = 1
          next = amountsFromPortions(next)
        }
      }

      return next
    })
  }

  // Equally toggle
  const handleEqualToggle = (val) => {
    setEqualSplit(val)
    setExpense((prev) => {
      if (prev.shareWithType !== 'group') return prev
      return val ? equalDivide(prev) : amountsFromPortions(prev)
    })
  }

  // Portion edit (Equally OFF only)
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

  // Amount edit (Equally OFF only)
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

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault()
    const error = validateExpense(expense)
    if (error) return alert(error)
    const payload = normalizeExpenseForAPI(expense)
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 bg-white rounded-xl'>

      {/* Share With */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Share Expense With:
        </label>
        <select
          name='shareWith'
          value={expense.shareWith}
          onChange={handleShareWithChange}
          required
          className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
        >
          {friendsAndGroups.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name} {p.type === 'group' ? '(Group)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Title & Date */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Expense Title:</label>
          <input
            type='text'
            name='title'
            value={expense.title}
            onChange={updateField}
            required
            placeholder='e.g. Lunch with client'
            className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Date:</label>
          <input
            type='date'
            name='date'
            value={expense.date}
            onChange={updateField}
            required
            className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
          />
        </div>
      </div>

      {/* Amount + Split Button */}
      <div className='grid grid-cols-3 gap-3 items-end'>
        <div className='col-span-2'>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Amount:</label>
          <div className='flex items-center gap-2'>
            <span className='text-gray-700 font-semibold'>$</span>
            <input
              type='number'
              name='amount'
              value={expense.amount === 0 ? '' : expense.amount}
              onChange={updateField}
              step='0.01'
              min='0'
              placeholder='0.00'
              className='w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400'
            />
          </div>
        </div>
        <button
          type='button'
          className='bg-emerald-500 text-white font-semibold rounded-xl py-2 hover:bg-emerald-600 transition'
        >
          Split a Bill
        </button>
      </div>

      {/* Expense Type */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Expense Type:</label>
        <select
          name='type'
          value={expense.type}
          onChange={updateField}
          required
          className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
        >
          <option value=''>Select a type</option>
          <option value='Work'>Work</option>
          <option value='Food'>Food</option>
          <option value='Travel'>Travel</option>
          <option value='Personal'>Personal</option>
        </select>
      </div>

      {/* Paid By */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>Paid By:</label>
        <select
          name='payer'
          value={expense.payer}
          onChange={updateField}
          required
          className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
        >
          <option value=''>Select</option>
          <option value='You'>You</option>
          {expense.shareWithType === 'group' &&
            expense.splitDetails.map((m, i) => (
              <option key={i} value={m.name}>{m.name}</option>
            ))}
          {expense.shareWithType === 'friend' && (
            <option value={expense.shareWith}>{expense.shareWith}</option>
          )}
        </select>
      </div>

      {/* Who Owes (friend only) */}
      {expense.shareWithType === 'friend' && (
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Who Owes:</label>
          <select
            name='owes'
            value={expense.owes || ''}
            onChange={updateField}
            required
            className='w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400'
          >
            <option value=''>Select Option</option>
            {getFriendOweOptions(expense.shareWith).map((opt, idx) => (
              <option key={idx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Group Split UI */}
      {expense.shareWithType === 'group' && (
        <div className='mt-4 border border-gray-200 rounded-xl overflow-hidden'>
          <div className='flex justify-between items-center bg-gray-50 px-4 py-2 border-b'>
            <span className='font-semibold text-sm text-gray-700'>Split Between:</span>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <span>Equally</span>
              <ToggleSwitch checked={equalSplit} onChange={handleEqualToggle} />
            </div>
          </div>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-gray-50'>
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
                  <tr key={i} className={`border-t ${rowDisabled ? 'opacity-50 bg-gray-50' : ''}`}>
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
                        // Round visually when leaving input
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val)) handleAmountChange(i, val.toFixed(2))
                      }}
                      className='w-20 text-right border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-100'
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
                          className='w-14 text-right border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-400 disabled:bg-gray-100'
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

              {/* Totals */}
              <tr className='bg-gray-50 border-t font-semibold'>
                <td className='p-3 text-right'>Total:</td>
                <td className='p-3 text-right'>
                  $
                  {expense.splitDetails
                    .reduce((sum, m) => sum + (m.include ? Number(m.amount) || 0 : 0), 0)
                    .toFixed(2)}
                </td>
                <td className='p-3 text-right'>
                  {expense.splitDetails
                    .reduce((sum, m) => sum + (m.include ? Number(m.portion) || 0 : 0), 0)
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
          className='w-full border border-gray-300 text-gray-700 font-semibold rounded-xl py-3 hover:bg-gray-100 transition'
        >
          Cancel
        </button>
      </div>
    </form>
  )
}