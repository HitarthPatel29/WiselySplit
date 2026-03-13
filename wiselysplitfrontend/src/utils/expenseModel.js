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
  payerId: null,           // Who paid (userId) — shared only
  owes: '',                // For friend-type expenses only — shared only
  shareWithId: null,       // FriendID or GroupID — shared only
  shareWith: '',           // Friend or Group name — shared only
  shareWithType: 'friend', // 'friend' | 'group' — shared only
  splitDetails: [],        // Group split details [{ userId, name, amount, portion, include }] — shared only
  userId: null,            // For personal expenses
  walletId: null,          // Wallet to record expense against (shared when payer is user, required for personal if user has wallets)
  paymentId: null,         // Optional payment reference — shared
  isSettleUp: false,       // Shared only
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
 * Helper: Generate a new personal expense draft
 * @param {number} currentUserId - Logged-in user's ID
 */
export const createNewPersonalExpense = (currentUserId) => {
  return {
    ...defaultExpense,
    userId: currentUserId || null,
    walletId: null,
    title: '',
    amount: 0,
    date: '',
    type: '',
  }
}

/**
 * Helper: Validate fields before submission
 * @param {object} expense - Form expense state
 * @param {number} currentUserId - Logged-in user ID
 * @param {boolean} billSplitApplied - Whether bill split was used (shared only)
 * @param {'shared'|'personal'} mode - Expense mode
 * @param {Array} [wallets=[]] - User wallets (for personal: wallet required if length > 0)
 */
export const validateExpense = (expense, currentUserId, billSplitApplied, mode = 'shared', wallets = []) => {
  console.log('ExpenseModel: Validating expense', { mode })
  if (!expense.title) return 'Expense title is required.'
  if (!expense.date) return 'Date is required.'
  if (!expense.amount || expense.amount <= 0) return 'Enter a valid amount.'
  if (!expense.type) return 'Please select an expense type.'

  if (mode === 'personal') {
    if (!expense.userId) return 'User is required for personal expense.'
    if (Array.isArray(wallets) && wallets.length > 0 && (expense.walletId == null || expense.walletId === '')) {
      return 'Please select a wallet for this personal expense.'
    }
    return null
  }

  // --- Shared expense validation ---
  if (!expense.shareWith) return 'Please select who to share expense with.'
  if (!expense.payerId) return 'Please select who paid.'

  // Friend-level rule
  if (!billSplitApplied && expense.shareWithType === 'friend') {
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
  if (billSplitApplied || expense.shareWithType === 'group') {

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
 * Returns payload shape for either shared or personal endpoint.
 *
 * @param {object} expense - The expense data from the form.
 * @param {number} currentUserId - Logged-in user's ID (used for friend owes translation and personal userId).
 * @param {boolean} billSplitApplied - Whether bill split was used (shared only).
 * @param {'shared'|'personal'} mode - Expense mode.
 */
export const normalizeExpenseForAPI = (expense, currentUserId, billSplitApplied, mode = 'shared') => {
  const amount = parseFloat(expense.amount) || 0

  if (mode === 'personal') {
    return {
      title: expense.title || '',
      amount,
      date: expense.date || '',
      type: expense.type || '',
      userId: expense.userId ?? currentUserId,
      walletId: expense.walletId ?? null,
      isPersonal: true,
    }
  }

  // --- Shared expense payload ---
  const clean = { ...expense }
  clean.amount = amount
  clean.splitDetails = clean.splitDetails || []
  clean.isPersonal = false
  // --- GROUP EXPENSE ---
  if (billSplitApplied || clean.shareWithType === 'group') {
    clean.splitDetails = (expense.splitDetails || []).map((m) => ({
      ...m,
      amount: parseFloat(m.amount) || 0,
      portion: parseInt(m.portion || 1),
      include: m.include !== false,
    }))
  }

  // --- FRIEND EXPENSE ---
  if (!billSplitApplied && clean.shareWithType === 'friend') {
    const total = parseFloat(clean.amount) || 0
    const half = parseFloat((total / 2).toFixed(2))
    const friendId = clean.shareWithId
    const friendName = clean.shareWith

    if (clean.owes === `You and ${friendName} split equally`) {
      clean.splitDetails = [
        { userId: currentUserId, amount: half, portion: 1, include: true },
        { userId: friendId, amount: half, portion: 1, include: true },
      ]
    } else if (clean.owes === 'You owe full amount') {
      clean.splitDetails = [
        { userId: currentUserId, amount: total, portion: 1, include: true },
      ]
    } else if (clean.owes === `${friendName} owes full amount`) {
      clean.splitDetails = [
        { userId: friendId, amount: total, portion: 1, include: true },
      ]
    } else {
      clean.splitDetails = [
        { userId: currentUserId, amount: half, portion: 1, include: true },
        { userId: friendId, amount: half, portion: 1, include: true },
      ]
    }
  }

  const payload = {
    title: clean.title || '',
    amount: clean.amount,
    date: clean.date || '',
    type: clean.type || '',
    payerId: clean.payerId ?? currentUserId,
    shareWithId: clean.shareWithId,
    shareWithType: clean.shareWithType || 'friend',
    splitDetails: clean.splitDetails,
    isSettleUp: !!clean.isSettleUp,
    paymentId: clean.paymentId ?? null,
    walletId: clean.walletId ?? null,
  }
  return payload
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
    isSettleUp: !!data.isSettleUp,
    isPersonal: !!data.isPersonal,
    // settlementMethod: data.settlementMethod || data.paymentMethod || null,
    paymentId: data.paymentId || data.stripePaymentId || null,
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
    normalized.shareWith = group?.name || data.groupName || data.shareWith || ''
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
    normalized.shareWith = friendEntry?.name || (data.payerId !== currentUserId ? data.payer : '') || data.shareWith
    normalized.shareWithId = friendEntry?.userId || (data.payerId !== currentUserId ? data.payerId : null)
  }

  // translates splitDetails into 'who owes' statements for friend view only
  if (normalized.shareWithType === 'friend' && normalized.splitDetails.length > 0) {
    const total = normalized.splitDetails.reduce((s, m) => s + (m.amount || 0), 0)
    const half = parseFloat((total / 2).toFixed(2))
    const friendName = normalized.shareWith
    const userShare = normalized.splitDetails.find((m) => m.userId === currentUserId)
    const friendShare = normalized.splitDetails.find((m) => m.userId === normalized.shareWithId)

    if (
      normalized.splitDetails.length === 2 &&
      normalized.splitDetails.every((m) => parseFloat(m.amount.toFixed(2)) === half)
    ) {
      normalized.owes = `You and ${friendName} split equally`
    } else if (userShare && userShare.amount === total) {
      normalized.owes = 'You owe full amount'
    } else if (friendShare && friendShare.amount === total) {
      normalized.owes = `${friendName} owes full amount`
    }
    else {
      normalized.billSplitUsed = true // custom split outside presets
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