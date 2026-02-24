import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import FilterModal from '../components/Modals/FilterModal.jsx'
import AddWallet from '../components/Modals/AddWallet.jsx'
import ExpenseItemCard from '../components/ListItem/ExpenseItemCard.jsx'
import { AdjustmentsHorizontalIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { WALLET_COLOR_MAP } from '../constants/walletColors'
import PrimaryButton from '../components/IO/PrimaryButton.jsx'

const SWIPE_THRESHOLD = 60

// Helper to format date as Month, DD
const formatDate = (raw) => {
  if (!raw) return ''
  try {
    const d = new Date(raw + 'T00:00:00')
    const month = d.toLocaleString('en-CA', { month: 'short' })
    const day = String(d.getDate()).padStart(2, '0')
    return `${month} ${day}`
  } catch {
    return raw
  }
}

// Dummy data: wallets with expenses (each has a unique color from WALLET_COLOR_MAP)
const DUMMY_WALLETS = [
  { id: 1, name: 'Main Wallet', balance: 1250.5, color: 'emerald' },
  { id: 2, name: 'Travel Fund', balance: 340.0, color: 'blue' },
  { id: 3, name: 'Groceries', balance: -85.25, color: 'amber' },
  { id: 4, name: 'Credit Card', balance: -220.0, color: 'rose' },
]

const DUMMY_EXPENSES_BY_WALLET = {
  1: [
    { expenseId: 101, date: '2025-02-15', title: 'Coffee at Starbucks', type: 'Food', netAmount: -12.5, isSettleUp: false },
    { expenseId: 102, date: '2025-02-14', title: 'Uber to airport', type: 'Travel', netAmount: -45.0, isSettleUp: false },
    { expenseId: 103, date: '2025-02-12', title: 'Split dinner with friends', type: 'Food', netAmount: 28.75, isSettleUp: false },
    { expenseId: 104, date: '2025-02-10', title: 'Settled up with John', type: 'Other', netAmount: -50.0, isSettleUp: true },
  ],
  2: [
    { expenseId: 201, date: '2025-02-16', title: 'Flight booking', type: 'Travel', netAmount: -280.0, isSettleUp: false },
    { expenseId: 202, date: '2025-02-08', title: 'Hotel deposit', type: 'Travel', netAmount: -60.0, isSettleUp: false },
  ],
  3: [
    { expenseId: 301, date: '2025-02-17', title: 'Weekly groceries', type: 'Personal', netAmount: -85.25, isSettleUp: false },
    { expenseId: 302, date: '2025-02-09', title: 'Farmers market', type: 'Food', netAmount: -32.0, isSettleUp: false },
  ],
  4: [
    { expenseId: 401, date: '2025-02-16', title: 'Amazon purchase', type: 'Personal', netAmount: -89.99, isSettleUp: false },
    { expenseId: 402, date: '2025-02-11', title: 'Gas station', type: 'Travel', netAmount: -55.0, isSettleUp: false },
  ],
}

export default function PersonalExpense() {
  const navigate = useNavigate()
  const { userId } = useAuth()

  const [wallets, setWallets] = useState(DUMMY_WALLETS)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [activeWalletIndex, setActiveWalletIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0 })
  const isDraggingRef = useRef(false)
  const containerRef = useRef(null)
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [groups, setGroups] = useState([])

  // Filters (same structure as PersonalSummary)
  const [typeFilter, setTypeFilter] = useState([])
  const [groupFilter, setGroupFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [monthFilter, setMonthFilter] = useState('')
  const [displayStartDate, setDisplayStartDate] = useState('')
  const [displayEndDate, setDisplayEndDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const activeWallet = wallets[activeWalletIndex]
  const rawExpenses = activeWallet ? (DUMMY_EXPENSES_BY_WALLET[activeWallet.id] || []) : []
  const [filteredExpenses, setFilteredExpenses] = useState(rawExpenses)

  // Sync filtered expenses when wallet or raw data changes
  useEffect(() => {
    let list = [...rawExpenses]

    // Only apply date filter when user has explicitly set a range (via Filter modal)
    if (displayStartDate && displayEndDate) {
      list = list.filter((e) => e.date >= displayStartDate && e.date <= displayEndDate)
    }
    if (search.trim() !== '') {
      list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    }
    if (typeFilter.length > 0) {
      list = list.filter((e) => typeFilter.includes(e.type))
    }
    if (groupFilter) {
      list = list.filter((e) => String(e.groupId) === String(groupFilter))
    }
    if (monthFilter) {
      const getMonthName = (idx) =>
        ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][idx]
      list = list.filter((e) => {
        const monthName = getMonthName(new Date(e.date).getMonth())
        return monthName === monthFilter
      })
    }
    list.sort((a, b) =>
      sort === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
    )
    setFilteredExpenses(list)
  }, [rawExpenses, search, typeFilter, groupFilter, sort, monthFilter, displayStartDate, displayEndDate])

  // Default date range for Filter modal (not applied to list until user clicks Apply)
  useEffect(() => {
    const now = new Date()
    const end = now.toLocaleDateString('en-CA')
    const monthAgo = new Date(now)
    monthAgo.setMonth(now.getMonth() - 1)
    const start = monthAgo.toLocaleDateString('en-CA')
    setStartDate(start)
    setEndDate(end)
    // Don't set displayStartDate/displayEndDate on mount - show all expenses by default
  }, [])

  const goToPrev = () => {
    setActiveWalletIndex((i) => Math.max(0, i - 1))
  }

  const goToNext = () => {
    setActiveWalletIndex((i) => Math.min(wallets.length - 1, i + 1))
  }

  const getOffsetForWallet = useCallback(
    (walletIndex) => {
      return walletIndex - activeWalletIndex
    },
    [activeWalletIndex]
  )

  const getScaleForOffset = (offset) => {
    const abs = Math.abs(offset)
    if (abs === 0) return 1
    return Math.max(0.55, 1 - abs * 0.12)
  }

  const getOpacityForOffset = (offset) => {
    const abs = Math.abs(offset)
    if (abs === 0) return 1
    return Math.max(0.6, 1 - abs * 0.12)
  }

  const LAYER_SPACING = 95

  const handleDragStart = useCallback((clientX) => {
    setIsDragging(true)
    isDraggingRef.current = true
    dragStartRef.current = { x: clientX }
    setDragOffset(0)
  }, [])

  const handleDragMove = useCallback((clientX) => {
    if (!isDraggingRef.current) return
    const delta = clientX - dragStartRef.current.x
    const maxDrag = containerRef.current?.offsetWidth ? containerRef.current.offsetWidth * 0.4 : 150
    const clamped = Math.max(-maxDrag, Math.min(maxDrag, delta))
    setDragOffset(clamped)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    setDragOffset((current) => {
      if (Math.abs(current) > SWIPE_THRESHOLD) {
        if (current > 0 && activeWalletIndex > 0) goToPrev()
        else if (current < 0 && activeWalletIndex < wallets.length - 1) goToNext()
      }
      return 0
    })
  }, [goToPrev, goToNext, activeWalletIndex, wallets.length])

  const handleTouchStart = (e) => handleDragStart(e.touches[0].clientX)
  const handleTouchEnd = () => handleDragEnd()
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }

  useEffect(() => {
    if (!isDragging) return
    const onMouseMove = (e) => handleDragMove(e.clientX)
    const onMouseUp = () => handleDragEnd()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onTouchMove = (e) => {
      if (isDraggingRef.current) e.preventDefault()
      handleDragMove(e.touches[0].clientX)
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [handleDragMove])

  const handleApplyFilters = (f) => {
    setTypeFilter(f.typeFilter)
    setGroupFilter(f.groupFilter)
    setSort(f.sort)
    setMonthFilter(f.month)
    if (f.startDate && f.endDate) {
      setDisplayStartDate(f.startDate)
      setDisplayEndDate(f.endDate)
    } else if (!f.startDate && !f.endDate) {
      setDisplayStartDate('')
      setDisplayEndDate('')
    }
    setShowFilter(false)
  }

  const handleAddWallet = (data) => {
    const newId = Math.max(...wallets.map((w) => w.id), 0) + 1
    setWallets((prev) => [
      ...prev,
      { id: newId, name: data.name, balance: data.balance, color: data.color },
    ])
    DUMMY_EXPENSES_BY_WALLET[newId] = []
    setActiveWalletIndex(wallets.length)
  }

  const getWalletCardClasses = (wallet) => {
    if (wallet.color && WALLET_COLOR_MAP[wallet.color]) {
      return `bg-gradient-to-br ${WALLET_COLOR_MAP[wallet.color]} text-white shadow-emerald-900/20`
    }
    return wallet.balance >= 0
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400/40 text-white shadow-emerald-900/20'
      : 'bg-gradient-to-br from-rose-500 to-rose-700 border-rose-400/40 text-white shadow-rose-900/20'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Personal Expenses" />

      <main id="main-content" className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
        {/* 1/4 - Stacked Cards Carousel (Swipeable) */}
        <section className="h-[25vh] min-h-[150px] flex-shrink-0 mb-2">
          <div
            ref={containerRef}
            className="relative h-full flex items-center justify-center overflow-visible touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Layered cards: center focused, sides smaller, outer layers smaller still */}
            {wallets.map((wallet, idx) => {
              const offset = getOffsetForWallet(idx)
              const isActive = offset === 0

              const scale = getScaleForOffset(offset)
              const opacity = getOpacityForOffset(offset)
              const zIndex = 10 - Math.abs(offset)
              const translateX = offset * LAYER_SPACING + (isActive ? dragOffset : 0)

              return (
                <div
                  key={wallet.id}
                  className="absolute left-1/2 top-1/2 origin-center"
                  style={{
                    width: 'max(200px, min(88%, 250px))',
                    transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
                    zIndex,
                    opacity,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                    cursor: isActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  }}
                  onMouseDown={isActive ? handleMouseDown : undefined}
                >
                  <div
                    className={`rounded-2xl border-2 shadow-xl p-5 h-[130px] flex flex-col justify-between ${getWalletCardClasses(wallet)}`}
                  >
                    <p className="font-semibold text-white text-sm uppercase tracking-wider">
                      {wallet.name}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-white">
                      ${Math.abs(wallet.balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Nav arrows - hidden at boundaries (linear, no wrap) */}
            {wallets.length > 1 && (
              <>
                {activeWalletIndex > 0 && (
                  <button
                    onClick={goToPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/95 dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                    aria-label="Previous wallet"
                  >
                    <ChevronLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </button>
                )}
                {activeWalletIndex < wallets.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/95 dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                    aria-label="Next wallet"
                  >
                    <ChevronRightIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </button>
                )}
              </>
            )}

            {/* Dots indicator */}
            {wallets.length > 1 && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {wallets.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveWalletIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeWalletIndex ? 'bg-emerald-500 w-6' : 'bg-gray-400/60 w-2 hover:bg-gray-400/80'
                    }`}
                    aria-label={`Go to wallet ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3/4 - Search, Filter, Expense List */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search expenses..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => setShowFilter(true)}
              className="p-2.5 rounded-xl border border-emerald-700 dark:border-gray-600 bg-emerald-200 dark:bg-emerald-200 hover:bg-emerald-300 dark:hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
              aria-label="Open filters"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-emerald-700" />
            </button>
            {/* Add Wallet button */}
            <PrimaryButton
              label='Add Wallet/Card'
              onClick={() => setShowAddWallet(true)}
              className='w-full sm:w-auto whitespace-nowrap'
              ariaLabel="Add wallet, card, or account"
            />
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-[120px] pb-8">
            {filteredExpenses.map((e) => (
              <ExpenseItemCard
                key={e.expenseId}
                date={formatDate(e.date)}
                title={e.title}
                subtitle={`Type: ${e.type}${e.groupId != null ? `, Group: ${e.groupName}` : ''}`}
                amount={Math.abs(e.netAmount).toFixed(2)}
                type={e.isSettleUp ? 'settle' : e.netAmount < 0 ? 'lent' : 'owe'}
                highlight={e.isSettleUp || !!e.highlight}
                onClick={() =>
                  navigate(
                    e.isSettleUp
                      ? `/personalSummary/settlements/${e.expenseId}`
                      : `/personalSummary/expenses/${e.expenseId}`,
                    { state: { ...e, from: 'personalExpense' } }
                  )
                }
              />
            ))}
            {filteredExpenses.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No expenses found for this wallet.
              </p>
            )}
          </div>
        </section>
      </main>

      <FilterModal
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleApplyFilters}
        groups={groups}
        initialFilters={{
          typeFilter,
          groupFilter,
          sort,
          startDate: displayStartDate || startDate,
          endDate: displayEndDate || endDate,
          month: monthFilter,
        }}
      />

      <AddWallet
        isOpen={showAddWallet}
        onClose={() => setShowAddWallet(false)}
        onAdd={handleAddWallet}
      />
    </div>
  )
}
