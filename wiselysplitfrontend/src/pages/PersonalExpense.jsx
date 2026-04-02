import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import FilterModal from '../components/Modals/FilterModal.jsx'
import AddWallet from '../components/Modals/AddWallet.jsx'
import AlertModal from '../components/Modals/AlertModal.jsx'
import ExpensesGroupByDate from '../components/ListItem/ExpensesGroupByDate.jsx'
import { AdjustmentsHorizontalIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'
import { WALLET_COLOR_MAP } from '../constants/walletColors'
import PrimaryButton from '../components/IO/PrimaryButton.jsx'
import api from '../api.js'

const SWIPE_THRESHOLD = 60
const LAYER_SPACING = 80

export default function PersonalExpense() {
  const navigate = useNavigate()
  const { userId } = useAuth()

  const [wallets, setWallets] = useState([])
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [editWallet, setEditWallet] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [walletToDelete, setWalletToDelete] = useState(null)
  const [openMenuWalletId, setOpenMenuWalletId] = useState(null)
  const menuRef = useRef(null)
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
  const [categoryFilter, setCategoryFilter] = useState([])
  const [groupFilter, setGroupFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [monthFilter, setMonthFilter] = useState('')
  const [displayStartDate, setDisplayStartDate] = useState('')
  const [displayEndDate, setDisplayEndDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filteredExpenses, setFilteredExpenses] = useState([])

  const fetchWalletsWithExpenses = useCallback(async () => {
    if (!userId) return []
    setWalletsLoading(true)
    try {
      const res = await api.get(`/expenses/group-by-wallets/${userId}`)
      const list = res.data || []
      setWallets(list)
      setActiveWalletIndex((i) => Math.min(i, Math.max(0, list.length - 1)))
      console.log('after fetch wallets with expenses data:', list)
      return list
    } catch (err) {
      console.error('Failed to fetch wallets with expenses', err)
      setWallets([])
      return []
    } finally {
      setWalletsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchWalletsWithExpenses()
  }, [fetchWalletsWithExpenses])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuWalletId(null)
      }
    }
    if (openMenuWalletId != null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuWalletId])

  // Sync filtered expenses when wallet or raw data changes (expenses come directly from API response)
  useEffect(() => {
    const currentWallet = wallets[activeWalletIndex]
    const source = currentWallet && Array.isArray(currentWallet.expenses) ? currentWallet.expenses : []
    let list = [...source]

    // Only apply date filter when user has explicitly set a range (via Filter modal)
    if (displayStartDate && displayEndDate) {
      list = list.filter((e) => e.date >= displayStartDate && e.date <= displayEndDate)
    }
    if (search.trim() !== '') {
      list = list.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    }
    if (typeFilter.length > 0) {
      list = list.filter((e) => typeFilter.includes(e.expenseType))
    }
    if (categoryFilter.length > 0) {
      list = list.filter((e) => {
        const kind = e.entryKind || 'expense'
        const isIncome = kind === 'income'
        const isTransfer = kind === 'transfer'
        const isPersonalExpense = e.isPersonal && !e.isSettleUp && !isIncome && !isTransfer
        const isSharedExpense = !e.isPersonal && !e.isSettleUp
        const isSettlement = !!e.isSettleUp
        return (
          (categoryFilter.includes('personal') && isPersonalExpense) ||
          (categoryFilter.includes('shared') && isSharedExpense) ||
          (categoryFilter.includes('settlements') && isSettlement) ||
          (categoryFilter.includes('income') && isIncome) ||
          (categoryFilter.includes('transfer') && isTransfer)
        )
      })
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
  }, [wallets, activeWalletIndex, search, typeFilter, categoryFilter, groupFilter, sort, monthFilter, displayStartDate, displayEndDate])

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

  // Re-run when carousel is actually mounted (e.g. after loading) so touchmove attaches to the container
  const carouselMounted = !walletsLoading && wallets.length > 0
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onTouchMove = (e) => {
      if (isDraggingRef.current) e.preventDefault()
      handleDragMove(e.touches[0].clientX)
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [handleDragMove, carouselMounted])

  const handleApplyFilters = (f) => {
    setTypeFilter(f.typeFilter)
    setCategoryFilter(f.categoryFilter || [])
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

  const handleAddWallet = async (data) => {
    if (!userId) return
    try {
      await api.post(`/users/${userId}/wallets`, {
        walletName: data.walletName,
        walletType: data.walletType,
        walletColor: data.walletColor,
        walletBalance: data.walletBalance,
      })
      const list = await fetchWalletsWithExpenses()
      setActiveWalletIndex(Math.max(0, list.length - 1))
    } catch (err) {
      console.error('Failed to create wallet', err)
      console.error("data: ", data)
    }
  }

  const handleEditWallet = async (targetWalletId, data) => {
    if (!userId) return
    try {
      console.log('before API call data:', data)
      await api.put(`/users/${userId}/wallets/${targetWalletId}`, data)
      
      setWallets((prev) =>
        prev.map((wallet) => wallet.walletId === targetWalletId ? {...wallet,...data} : wallet)
      )
      
      setEditWallet(null)
      setShowAddWallet(false)
      console.log('after update wallets data:', wallets)
    } catch (err) {
      console.error('Failed to update wallet', err)
      console.error('targetWalletId: ', targetWalletId, 'data: ', data)
    }
  }

  const handleDeleteWallet = async () => {
    if (!userId || !walletToDelete) return
    try {
      await api.delete(`/users/${userId}/wallets/${walletToDelete.walletId}`)

      setWallets((prev) => {
        const idx = prev.findIndex((w) => w.walletId === walletToDelete.walletId)
        if (idx === -1) return prev
        const updatedWalletList = prev.filter((w) => w.walletId !== walletToDelete.walletId)
        return updatedWalletList
      })
      setActiveWalletIndex(Math.max(0, activeWalletIndex - 1))
      setShowDeleteModal(false)
      setWalletToDelete(null)
    } catch (err) {
      console.error('Failed to delete wallet', err)
      console.error('walletToDelete: ', walletToDelete)
    }
  }

  const computeNetBalance = (wallet) => {
    const initial = wallet.walletBalance ?? wallet.balance ?? 0
    let net = initial
    for (const e of (wallet.expenses || [])) {
      const amt = e.totalAmount ?? 0
      if (e.type === 'income' || e.type === 'transfer_in') {
        net += amt
      } else {
        net -= amt
      }
    }
    return net
  }

  const getWalletCardClasses = (wallet) => {
    const colorKey = wallet.walletColor || wallet.color
    if (colorKey && WALLET_COLOR_MAP[colorKey]) {
      return `bg-gradient-to-br ${WALLET_COLOR_MAP[colorKey]} text-white shadow-emerald-900/20`
    }
    const balance = wallet.walletBalance ?? wallet.balance ?? 0
    return balance >= 0
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400/40 text-white shadow-emerald-900/20'
      : 'bg-gradient-to-br from-rose-500 to-rose-700 border-rose-400/40 text-white shadow-rose-900/20'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Personal Expenses" />

      <main id="main-content" className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
        {/* 1/4 - Stacked Cards Carousel (Swipeable) */}
        <section className="h-[25vh] min-h-[150px] flex-shrink-0 mb-2">
          {walletsLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Loading wallets...
            </div>
          ) : wallets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-center px-4">
              No wallets yet. Add one using the button below.
            </div>
          ) : (
          <div
            ref={containerRef}
            className="relative h-full flex items-center justify-center overflow-hidden touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Layered cards: center focused, sides smaller, outer layers smaller still */}
            {wallets.map((wallet, idx) => {
              const offset = getOffsetForWallet(idx)
              const isActive = offset === 0
              const scale = getScaleForOffset(offset)
              const zIndex = 10 - Math.abs(offset)
              const translateX = offset * LAYER_SPACING + (isActive ? dragOffset : 0)
              const walletId = wallet.walletId ?? wallet.id
              const walletName = wallet.walletName ?? wallet.name
              const netBalance = computeNetBalance(wallet)

              return (
                <div
                  key={walletId}
                  className="absolute left-1/2 top-1/2 origin-center"
                  style={{
                    width: '240px',
                    transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
                    zIndex,
                    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                    cursor: isActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  }}
                  onMouseDown={isActive ? handleMouseDown : undefined}
                >
                  <div
                    className={`rounded-2xl border-2 shadow-xl p-5 h-[130px] flex flex-col justify-between relative ${getWalletCardClasses(wallet)}`}
                  >
                    <div className="absolute top-2 right-2" ref={openMenuWalletId === walletId ? menuRef : undefined}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setOpenMenuWalletId((prev) => (prev === walletId ? null : walletId))
                        }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Wallet options"
                        aria-expanded={openMenuWalletId === walletId}
                        aria-haspopup="true"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openMenuWalletId === walletId && (
                        <div className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditWallet(wallet)
                              setShowAddWallet(true)
                              setOpenMenuWalletId(null)
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
                              setWalletToDelete(wallet)
                              setShowDeleteModal(true)
                              setOpenMenuWalletId(null)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete wallet
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-white text-sm uppercase tracking-wider pr-8">
                      {walletName}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-white">
                      ${Math.abs(netBalance).toFixed(2)}
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
          )}
        </section>

        {/* 3/4 - Search, Filter, Expense List */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 mb-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search entries..."
              className="w-full sm:flex-1 min-w-0 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2 sm:gap-3 sm:flex-shrink-0">
              <button
                onClick={() => setShowFilter(true)}
                className="flex-1 sm:flex-none flex items-center justify-center p-2.5 rounded-xl border border-emerald-700 dark:border-gray-600 bg-emerald-200 dark:bg-emerald-200 hover:bg-emerald-300 dark:hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
                aria-label="Open filters"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-emerald-700" />
              </button>
              <PrimaryButton
                label="Add Entry"
                onClick={() => navigate('/personalExpense/add')}
                className="flex-1 sm:flex-none whitespace-nowrap"
                ariaLabel="Add a new entry"
              />
              <PrimaryButton
                label="Add Wallet/Card"
                onClick={() => setShowAddWallet(true)}
                className="flex-1 sm:flex-none whitespace-nowrap"
                ariaLabel="Add wallet, card, or account"
              />
            </div>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto flex-1 min-h-[120px] pb-8">
            {(() => {
              const grouped = filteredExpenses.reduce((acc, e) => {
                const dateKey = e.date || 'unknown'
                if (!acc[dateKey]) acc[dateKey] = []

                const entryKind = e.entryKind || 'expense'
                let cardType
                if (entryKind === 'income') cardType = 'income'
                else if (entryKind === 'transfer' || e.type === 'transfer_in' || e.type === 'transfer_out') cardType = 'transfer'
                else if (e.isSettleUp) cardType = 'settle'
                else if (e.isPersonal) cardType = 'personal'
                else cardType = 'shared'

                const userShare = cardType === 'shared'
                  ? (e.splitDetails?.find(s => Number(s.userId) === Number(userId))?.amount ?? 0)
                  : 0
                const userBalance = cardType === 'shared'
                  ? Math.abs((e.totalAmount ?? 0) - userShare)
                  : 0

                let subtitle
                if (entryKind === 'income') subtitle = `Income · ${e.expenseType ?? ''}`
                else if (entryKind === 'transfer') subtitle = e.type === 'transfer_in' ? 'Transfer In' : 'Transfer Out'
                else if (e.isPersonal) subtitle = `Type: ${e.expenseType ?? ''}`
                else subtitle = `Type: ${e.expenseType}${e.groupId != null && e.groupName ? `, Group: ${e.groupName}` : ''}`

                acc[dateKey].push({
                  expenseId: e.expenseId,
                  title: e.title,
                  subtitle,
                  amount: Math.abs(e.totalAmount ?? 0).toFixed(2),
                  userBalance: cardType === 'shared' ? userBalance.toFixed(2) : undefined,
                  cardType,
                  highlight: e.isSettleUp || !!e.highlight,
                  onClick: () =>
                    navigate(
                      e.isSettleUp
                        ? `/personalSummary/settlements/${e.expenseId}`
                        : `/personalSummary/expenses/${e.expenseId}`,
                      { state: { ...e, from: 'personalExpense' } }
                    ),
                })
                return acc
              }, {})

              const dateKeys = Object.keys(grouped)

              if (dateKeys.length === 0) {
                return (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No entries found for this wallet.
                  </p>
                )
              }

              return dateKeys.map((dateKey) => (
                <ExpensesGroupByDate
                  key={dateKey}
                  date={dateKey}
                  expenses={grouped[dateKey]}
                />
              ))
            })()}
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
          categoryFilter,
          groupFilter,
          sort,
          startDate: displayStartDate || startDate,
          endDate: displayEndDate || endDate,
          month: monthFilter,
        }}
      />

      <AddWallet
        isOpen={showAddWallet}
        onClose={() => {
          setShowAddWallet(false)
          setEditWallet(null)
        }}
        onAdd={handleAddWallet}
        editWallet={editWallet}
        onEdit={handleEditWallet}
      />

      <AlertModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setWalletToDelete(null)
        }}
        title="Delete Wallet"
        message={walletToDelete ? `Are you sure you want to delete "${walletToDelete.walletName}"? This cannot be undone.` : ''}
        type="warning"
        confirmText="Confirm Delete"
        showCancel
        cancelText="Cancel"
        onConfirm={handleDeleteWallet}
      />
    </div>
  )
}
