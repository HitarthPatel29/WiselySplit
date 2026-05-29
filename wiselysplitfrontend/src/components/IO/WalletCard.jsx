import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import { useRef } from 'react'
import { WALLET_COLOR_MAP } from '../../constants/walletColors'

/**
 * WalletCard
 *
 * Props:
 *   wallet         {object}   - Wallet data object
 *   openMenuId     {any}      - ID of the wallet whose menu is currently open (controlled externally)
 *   onMenuToggle   {fn}       - (walletId) => void  — toggles the options menu
 *   onEdit         {fn}       - (wallet) => void
 *   onDelete       {fn}       - (wallet) => void
 *   menuRef        {ref}      - Forwarded ref so the parent can detect outside-clicks (optional)
 *   isDragging     {bool}     - Passed in so the cursor style reflects the drag state (optional)
 *   isActive       {bool}     - Whether this is the front/active card (optional, affects cursor)
 *   style          {object}   - Extra inline styles (e.g. transform for carousel positioning)
 *   onMouseDown    {fn}       - Drag-start handler (optional)
 *   className      {string}   - Extra classes for the outer wrapper (optional)
 */
export default function WalletCard({
  wallet,
  openMenuId,
  onMenuToggle,
  onEdit,
  onDelete,
  menuRef,
  isDragging = false,
  isActive = true,
  style,
  onMouseDown,
  className = '',
}) {
  const walletId   = wallet.walletId  ?? wallet.id
  const walletName = wallet.walletName ?? wallet.name
  const cardName   = wallet.cardName
  const balance    = Number(wallet.walletBalance ?? wallet.balance ?? 0)
  const isMenuOpen = openMenuId === walletId

  const getCardClasses = () => {
    const colorKey = wallet.walletColor || wallet.color
    if (colorKey && WALLET_COLOR_MAP[colorKey]) {
      return `bg-gradient-to-br ${WALLET_COLOR_MAP[colorKey]} text-white shadow-emerald-900/20`
    }
    return balance >= 0
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400/40 text-white shadow-emerald-900/20'
      : 'bg-gradient-to-br from-rose-500 to-rose-700 border-rose-400/40 text-white shadow-rose-900/20'
  }

  return (
    <div
      className={className}
      style={{
        cursor: isActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        ...style,
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className={`rounded-2xl border-2 shadow-xl p-5 h-[130px] flex flex-col justify-between relative ${getCardClasses()}`}
      >
        {/* ── Options menu ── */}
        <div
          className="absolute top-2 right-2"
          ref={isMenuOpen ? menuRef : undefined}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onMenuToggle?.(walletId)
            }}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Wallet options"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(wallet)
                  onMenuToggle?.(null)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit wallet
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(wallet)
                  onMenuToggle?.(null)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                <TrashIcon className="w-4 h-4" />
                Delete wallet
              </button>
            </div>
          )}
        </div>

        {/* ── Wallet name / card name ── */}
        <div className="pr-8">
          <p className="font-semibold text-white text-sm uppercase tracking-wider">
            {walletName}
          </p>
          {cardName && (
            <p className="font-light text-white/70 text-xs tracking-wide truncate">
              {cardName}
            </p>
          )}
        </div>

        {/* ── Balance ── */}
        <p className="text-2xl font-bold tracking-tight text-white">
          ${Math.abs(balance).toFixed(2)}
        </p>
      </div>
    </div>
  )
}
