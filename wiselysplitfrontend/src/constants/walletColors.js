/**
 * Wallet/Card color options for the app.
 * Used by AddWallet modal (color picker) and PersonalExpense carousel (card styling).
 */

export const WALLET_COLORS = [
  { id: 'emerald', name: 'Emerald', gradient: 'from-emerald-500 to-emerald-700', border: 'border-emerald-400/40' },
  { id: 'rose', name: 'Rose', gradient: 'from-rose-500 to-rose-700', border: 'border-rose-400/40' },
  { id: 'blue', name: 'Blue', gradient: 'from-blue-500 to-blue-700', border: 'border-blue-400/40' },
  { id: 'indigo', name: 'Indigo', gradient: 'from-indigo-500 to-indigo-700', border: 'border-indigo-400/40' },
  { id: 'purple', name: 'Purple', gradient: 'from-purple-500 to-purple-700', border: 'border-purple-400/40' },
  { id: 'amber', name: 'Amber', gradient: 'from-amber-500 to-amber-700', border: 'border-amber-400/40' },
  { id: 'cyan', name: 'Cyan', gradient: 'from-cyan-500 to-cyan-700', border: 'border-cyan-400/40' },
  { id: 'violet', name: 'Violet', gradient: 'from-violet-500 to-violet-700', border: 'border-violet-400/40' },
  { id: 'teal', name: 'Teal', gradient: 'from-teal-500 to-teal-700', border: 'border-teal-400/40' },
  { id: 'orange', name: 'Orange', gradient: 'from-orange-500 to-orange-700', border: 'border-orange-400/40' },
]

/** Map of color id -> Tailwind classes for wallet card background */
export const WALLET_COLOR_MAP = Object.fromEntries(
  WALLET_COLORS.map((c) => [c.id, `${c.gradient} ${c.border}`])
)
