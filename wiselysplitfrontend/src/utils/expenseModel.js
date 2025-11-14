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
  payerId: null,           // Who paid (userId)
  owes: '',                // For friend-type expenses only
  shareWithId: null,       // FriendID or GroupID
  shareWith: '',           // Friend or Group name
  shareWithType: 'friend', // 'friend' | 'group'
  splitDetails: [],        // Group split details [{ userId, name, amount, portion, include }]
}

/**
 * Helper: Generate an empty expense structure dynamically
 * @param {number} shareWithId - friendId or groupId
 * @param {string} shareWith - friend/group name
 * @param {string} type - 'friend' | 'group'
 * @param {Array} members - group members [{userId, name}]
 */
export const createNewExpense = (shareWithId, shareWith, type = 'friend', members = [], currentUserId) => {
  const expense = {
    ...defaultExpense,
    shareWithId,
    shareWith,
    shareWithType: type.toLowerCase(),
    payerId: currentUserId || null,
  }

  // If group → prefill split table
  if (expense.shareWithType === 'group') {
    expense.splitDetails = members.map((m) => ({
      userId: m.userId,
      name: m.name,
      amount: 0,
      portion: 1,
      include: true,
    }))
  }

  // If friend → no split details required
  if (expense.shareWithType === 'friend') {
    expense.splitDetails = []
  }

  return expense
}

/**
 * Helper: Validate fields before submission
 */
export const validateExpense = (expense, currentUserId) => {
  console.log('ExpenseModel: Validating expense')
  if (!expense.shareWith) return 'Please select who to share expense with.'
  if (!expense.title) return 'Expense title is required.'
  if (!expense.date) return 'Date is required.'
  if (!expense.amount || expense.amount <= 0) return 'Enter a valid amount.'
  if (!expense.payerId) return 'Please select who paid.'

  // Friend-level rule
  if (expense.shareWithType === 'friend') {
    if (expense.owes === '' && expense.splitDetails.length === 0)
      return 'Please specify who owes the amount.'

    // Avoid case where payer pays 100% for themselves only
    if (expense.owes === 'You owe full amount' && expense.payerId === currentUserId)
      return 'You cannot create an expense where you owe yourself the full amount.'

    // Optional: If payerId is friend and owes says friend owes full → also block
    if (
      expense.owes === `${expense.shareWith} owes full amount` &&
      expense.payerId === expense.shareWithId
    )
      return `${expense.shareWith} cannot owe themselves the full amount.`
  }

  // Group-level rule
  if (expense.shareWithType === 'group' && (!expense.splitDetails || expense.splitDetails.length === 0))
    return 'Please include at least one member in the split.'
  // --- GROUP RULES ---
  if (expense.shareWithType === 'group') {
    if (!expense.splitDetails || expense.splitDetails.length === 0)
      return 'Please include at least one member in the split.'

    //  Avoid case where only payer is included
    const includedMembers = expense.splitDetails.filter((m) => m.include)
    if (
      includedMembers.length === 1 &&
      includedMembers[0].userId === expense.payerId
    ) {
      const payerName = includedMembers[0].name || 'Payer'
      return `The expense cannot be payed by and shared by only ${payerName}. Please include at least one more member to share the Expense.`
    }
  }
  
  return null
}

/**
 * Normalize expense object for API submission.
 * checks all amount value to be number not string.
 *
 * @param {object} expense - The expense data from the form.
 * @param {number} currentUserId - Logged-in user's ID (used only for 'friend' owes translation).
 */
export const normalizeExpenseForAPI = (expense, currentUserId) => {
  const clean = { ...expense }

  console.log('Normalizing expense for API')
  clean.amount = parseFloat(expense.amount)

  // --- GROUP EXPENSE ---
  if (clean.shareWithType === 'group') {
    clean.splitDetails = (expense.splitDetails || []).map((m) => ({
      ...m,
      amount: parseFloat(m.amount) || 0,
      portion: parseInt(m.portion || 1),
    }))
  }

  //TODO: move owes to splitDetails translation logic here
  // --- FRIEND EXPENSE ---
  if (clean.shareWithType === 'friend') {
    // Translate 'owes' into splitDetails
    const total = parseFloat(clean.amount) || 0
    const half = parseFloat((total / 2).toFixed(2))
    const friendId = clean.shareWithId
    const friendName = clean.shareWith

    if (clean.owes === `You and ${friendName} split equally`) {
      clean.splitDetails = [
        { userId: currentUserId, name: 'You', amount: half, portion: 1 },
        { userId: friendId, name: friendName, amount: half, portion: 1},
      ]
    } else if (clean.owes === 'You owe full amount') {
      clean.splitDetails = [
        { userId: currentUserId, name: 'You', amount: total, portion: 1 },
      ]
    } else if (clean.owes === `${friendName} owes full amount`) {
      clean.splitDetails = [
        { userId: friendId, name: friendName, amount: total, portion: 1 },
      ]
    } else {
      // Fallback: evenly split
      clean.splitDetails = [
        { userId: currentUserId, name: 'You', amount: half, portion: 1 },
        { userId: friendId, name: friendName, amount: half, portion: 1 },
      ]
    }
  }
  console.log('Normalized expense for API')

  // Cleanup
  delete clean.owes
  return clean
}
/**
 * Normalize expense object for API submission.
 * checks all amount value to be number not string.
 *
 * @param {object} expense - The expense data from the form.
 * @param {number} currentUserId - Logged-in user's ID (used only for 'friend' owes translation).
 */
// src/utils/expenseModel.js
export const normalizeExpenseForFields = (data, currentUserId, friendsAndGroups) => {
  if (!data){
    console.log('Empty data for Normalization')
    return null
  }

  console.log('normalizing Expense for Fields')
  const normalized = {
    id: data.expenseId || data.id || null,
    title: data.title || data.expenseTitle || '',
    date: data.date || data.expenseDate || '',
    type: data.type || data.expenseType || '',
    amount: parseFloat(data.amount) || 0,
    payer: data.payer || '',
    payerId: data.payerId || null,
    shareWithType: data.groupId ? 'group' : 'friend',
    splitDetails: (data.splitDetails || []).map((m) => ({
      userId: m.userId,
      name: m.name,
      amount: parseFloat(m.amount) || 0,
      portion: m.portion || 1,
      include: true,
    })),
  }

  //Fill missing group members in splitDetails
  if (data.groupId && Array.isArray(friendsAndGroups)) {
    const group = friendsAndGroups.find(
      (g) => g.type === 'group' && g.id === data.groupId
    )
    if (group?.members?.length) {
      const existingIds = normalized.splitDetails.map((m) => m.userId)
      const missing = group.members.filter((mem) => !existingIds.includes(mem.userId))
      const filler = missing.map((mem) => ({
        userId: mem.userId,
        name: mem.name,
        amount: 0,
        portion: 0,
        include: false,
      }))
      normalized.splitDetails = [...normalized.splitDetails, ...filler]
    }
  }


  // 🧩 Derive shareWith (friend/group name) + shareWithId
  if (normalized.shareWithType === 'group') {
    // Find the group entry in friendsAndGroups
    const group = friendsAndGroups.find(
      (g) => g.type === 'group' && g.id === data.groupId
    )
    normalized.shareWith = group?.name || data.groupName || ''
    normalized.shareWithId = data.groupId || group?.id || null
    if (group?.members?.length) {
      const existingIds = normalized.splitDetails.map((m) => m.userId)
      const missing = group.members.filter((mem) => !existingIds.includes(mem.userId))
      const filler = missing.map((mem) => ({
        userId: mem.userId,
        name: mem.name,
        amount: 0,
        portion: 0,
        include: false,
      }))
      normalized.splitDetails = [...normalized.splitDetails, ...filler]
    }
  } else {
    const friendEntry = normalized.splitDetails.find(
      (m) => m.userId !== currentUserId
    )
    //if no friend entry found in split details, try payerId
    normalized.shareWith = friendEntry?.name || (data.payerId !== currentUserId ? data.payer : '')
    normalized.shareWithId = friendEntry?.userId || (data.payerId !== currentUserId ? data.payerId : null)
  }

  // translates splitDetails into 'who owes' statements for friend view only
  if (normalized.shareWithType === 'friend' && normalized.splitDetails.length > 0) {
    const total = normalized.splitDetails.reduce((s, m) => s + (m.amount || 0), 0)
    const half = parseFloat((total / 2).toFixed(2))
    const friendName = normalized.shareWith
    const userShare = normalized.splitDetails.find((m) => m.userId === currentUserId)

    if (
      normalized.splitDetails.length === 2 &&
      normalized.splitDetails.every((m) => parseFloat(m.amount.toFixed(2)) === half)
    ) {
      normalized.owes = `You and ${friendName} split equally`
    } else if (userShare && userShare.amount === total) {
      normalized.owes = 'You owe full amount'
    } else {
      normalized.owes = `${friendName} owes full amount`
    }
  }
  console.log('normalized Expense for feilds')
  return normalized
}

/**
 * Helper: Friend-level split presets (auto-populates dropdowns)
 */
export const getFriendOweOptions = (friendName = 'Friend') => [
  { label: `You owe full amount`, value: `You owe full amount` },
  { label: `${friendName} owes full amount`, value: `${friendName} owes full amount` },
  { label: `You and ${friendName} split equally`, value: `You and ${friendName} split equally` },
]