/**
 * Wallet/Card color options for the app.
 * Used by AddWallet modal (color picker) and PersonalExpense carousel (card styling).
 */

export const WALLET_COLORS = [
  { id: 'emerald', name: 'Emerald', gradient: 'from-emerald-400 to-emerald-700', border: 'border-emerald-400/40' },
  { id: 'rose', name: 'Rose', gradient: 'from-rose-400 to-rose-700', border: 'border-rose-400/40' },
  { id: 'blue', name: 'Blue', gradient: 'from-blue-400 to-blue-700', border: 'border-blue-400/40' },
  { id: 'indigo', name: 'Indigo', gradient: 'from-indigo-400 to-indigo-700', border: 'border-indigo-400/40' },
  { id: 'purple', name: 'Purple', gradient: 'from-purple-400 to-purple-700', border: 'border-purple-400/40' },
  { id: 'amber', name: 'Amber', gradient: 'from-amber-400 to-amber-700', border: 'border-amber-400/40' },
  { id: 'cyan', name: 'Cyan', gradient: 'from-cyan-400 to-cyan-700', border: 'border-cyan-400/40' },
  { id: 'violet', name: 'Violet', gradient: 'from-violet-400 to-violet-700', border: 'border-violet-400/40' },
  { id: 'teal', name: 'Teal', gradient: 'from-teal-400 to-teal-700', border: 'border-teal-400/40' },
  { id: 'orange', name: 'Orange', gradient: 'from-orange-400 to-orange-700', border: 'border-orange-400/40' },
  { id: 'lime', name: 'Lime', gradient: 'from-lime-400 to-lime-700', border: 'border-lime-400/40' },
  { id: 'fuchsia', name: 'Fuchsia', gradient: 'from-fuchsia-400 to-fuchsia-700', border: 'border-fuchsia-400/40' },
  { id: 'pink', name: 'Pink', gradient: 'from-pink-400 to-pink-700', border: 'border-pink-400/40' },
  { id: 'slate', name: 'Slate', gradient: 'from-slate-400 to-slate-700', border: 'border-slate-400/40' },
  { id: 'stone', name: 'Stone', gradient: 'from-stone-400 to-stone-700', border: 'border-stone-400/40' },
  { id: 'black', name: 'Black', gradient: 'from-zinc-500 to-black', border: 'border-zinc-500/40' },
  { id: 'silver', name: 'Silver', gradient: 'from-zinc-300 to-zinc-500', border: 'border-zinc-300/40' },
]

/** Map of color id -> Tailwind classes for wallet card background */
export const WALLET_COLOR_MAP = Object.fromEntries(
  WALLET_COLORS.map((c) => [c.id, `${c.gradient} ${c.border}`])
)
