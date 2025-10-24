// src/utils/expenseModel.js
/**
 * Canonical Expense structure for WiselySplit.
 * Supports both Friend and Group expenses consistently across Add/Edit/Details.
 */

export const defaultExpense = {
  id: null,                // Backend ID
  title: '',               // Expense title
  amount: 0,               // Total expense amount
  date: '',                // YYYY-MM-DD
  type: '',                // Food / Travel / Work / Personal etc.
  payer: '',               // Who paid
  owes: '',                // For friend-type expenses only
  shareWith: '',           // Friend or Group name
  shareWithType: 'friend', // 'friend' | 'group'
  splitDetails: [],        // Group split details
}

/**
 * Helper: Generate an empty expense structure dynamically
 */
export const createNewExpense = (shareWith = '', shareWithType = 'friend', members = []) => {
  const expense = { ...defaultExpense, shareWith, shareWithType }

  // If group → prefill split table
  if (shareWithType === 'group') {
    expense.splitDetails = members.map((m) => ({
      name: m,
      amount: 0,
      portion: 1,
      include: true,
    }))
  }
  return expense
}

/**
 * Helper: Validate fields before submission
 */
export const validateExpense = (expense) => {
  if (!expense.shareWith) return 'Please select who to share expense with.'
  if (!expense.title) return 'Expense title is required.'
  if (!expense.date) return 'Date is required.'
  if (!expense.amount || expense.amount <= 0) return 'Enter a valid amount.'
  if (!expense.payer) return 'Please select who paid.'

  // Friend-level rule
  if (expense.shareWithType === 'friend' && !expense.owes)
    return 'Please specify who owes the amount.'

  // Group-level rule
  if (expense.shareWithType === 'group' && !expense.splitDetails.length)
    return 'Please include at least one member in the split.'
  return null
}

/**
 * Helper: Normalize float and cleanup before API submission
 */
export const normalizeExpenseForAPI = (expense) => {
  const clean = { ...expense }
  clean.amount = parseFloat(expense.amount)
  clean.splitDetails = (expense.splitDetails || []).map((m) => ({
    ...m,
    amount: parseFloat(m.amount),
    portion: parseInt(m.portion || 1),
  }))
  return clean
}

/**
 * Helper: Friend-level split presets (auto-populates dropdowns)
 */
export const getFriendOweOptions = (friendName = 'Friend') => [
  { label: `You owe full amount`, value: `You owe full amount` },
  { label: `${friendName} owes full amount`, value: `${friendName} owes full amount` },
  { label: `You and ${friendName} split equally`, value: `You and ${friendName} split equally` },
]