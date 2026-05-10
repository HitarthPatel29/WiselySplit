// src/utils/settleUp.js

const today = () => new Date().toLocaleDateString('en-CA') 

const toCurrencyNumber = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  return Math.round(num * 100) / 100
}

export const formatCurrency = (value = 0) => toCurrencyNumber(value).toFixed(2)

export const SETTLE_EXPENSE_CATEGORY = 'SettleUp'

/**
 * Build the payload expected by the Expenses endpoint to log a settle-up entry.
 */
export const buildSettleUpPayload = ({
  amount,
  currentUserId,
  targetUserId,
  targetName,
  shareWithId,
  shareWithName = '',
  shareWithType = 'friend',
  settlementTargetId,
  paymentId = null,
  walletId = null,
}) => {
  const sanitized = toCurrencyNumber(amount)
  if (!sanitized || sanitized <= 0) {
    throw new Error('Settlement amount must be greater than zero.')
  }

  const payload = {
    title: `Settle up with ${targetName}`,
    amount: sanitized,
    date: today(),
    category: SETTLE_EXPENSE_CATEGORY,
    payerId: currentUserId,
    shareWithId,
    shareWith: shareWithName || targetName,
    shareWithType,
    splitDetails: [
      {
        userId: targetUserId,
        name: targetName,
        amount: sanitized,
        portion: 1,
        include: true,
      },
    ],
    isSettleUp: true,
  }

  if (settlementTargetId) payload.settlementTargetId = settlementTargetId
  if (paymentId) payload.paymentId = paymentId
  if (walletId != null) payload.walletId = walletId
  return payload
}

export const getSettlementMethodLabel = (paymentId) => {
  if (paymentId !== null) return 'Settled through Stripe'
  return 'Settled manually'
}