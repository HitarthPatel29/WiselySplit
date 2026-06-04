import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Header from '../components/Header.jsx'
import FilterModal from '../components/Modals/FilterModal.jsx'
import AddWallet from '../components/Modals/AddWallet.jsx'
import AlertModal from '../components/Modals/AlertModal.jsx'
import ImportCsvModal from '../components/Modals/ImportCsvModal.jsx'
import WalletCarousel from '../components/IO/WalletCarousel.jsx'
import ExpensesGroupByDate from '../components/ListItem/ExpensesGroupByDate.jsx'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid'
import {
  applyWalletOrder,
  getWalletId,
  setWalletOrder,
  syncWalletOrderWithWallets,
  walletIdsFromList,
} from '../utils/walletOrderStorage.js'
import PrimaryButton from '../components/IO/PrimaryButton.jsx'
import api from '../api.js'

export default function PersonalExpense() {
  const navigate = useNavigate()
  const { userId } = useAuth()

  const [wallets, setWallets] = useState([])
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editWallet, setEditWallet] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [walletToDelete, setWalletToDelete] = useState(null)
  const [activeWalletIndex, setActiveWalletIndex] = useState(0)
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
      const savedOrder = syncWalletOrderWithWallets(userId, list)
      const ordered = applyWalletOrder(list, savedOrder)
      setWallets(ordered)
      setActiveWalletIndex((i) => Math.min(i, Math.max(0, ordered.length - 1)))
      // console.log('after fetch wallets with expenses data:', ordered)
      return ordered
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
      list = list.filter((e) => typeFilter.includes(e.category ?? e.expenseType ?? ''))
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
    if (!userId) return []
    try {
      await api.post(`/users/${userId}/wallets`, {
        walletName: data.walletName,
        cardName: data.cardName,
        walletColor: data.walletColor,
        walletBalance: data.walletBalance,
      })
      const list = await fetchWalletsWithExpenses()
      setActiveWalletIndex(Math.max(0, list.length - 1))
      return list
    } catch (err) {
      console.error('Failed to create wallet', err)
      console.error("data: ", data)
      return []
    }
  }

  const handleEditWallet = async (targetWalletId, data) => {
    if (!userId) return
    try {
      // console.log('before API call data:', data)
      await api.put(`/users/${userId}/wallets/${targetWalletId}`, data)
      await fetchWalletsWithExpenses()
      setEditWallet(null)
      setShowAddWallet(false)
    } catch (err) {
      console.error('Failed to update wallet', err)
      console.error('targetWalletId: ', targetWalletId, 'data: ', data)
    }
  }

  const handleDeleteWallet = async () => {
    if (!userId || !walletToDelete) return
    try {
      await api.delete(`/users/${userId}/wallets/${getWalletId(walletToDelete)}`)

      const deletedId = getWalletId(walletToDelete)
      setWallets((prev) => {
        const deletedIndex = prev.findIndex((w) => getWalletId(w) === deletedId)
        const updatedWalletList = prev.filter((w) => getWalletId(w) !== deletedId)
        if (userId) {
          setWalletOrder(userId, walletIdsFromList(updatedWalletList))
        }
        setActiveWalletIndex((i) => {
          if (updatedWalletList.length === 0) return 0
          if (deletedIndex === -1) return Math.min(i, updatedWalletList.length - 1)
          if (i > deletedIndex) return i - 1
          if (i === deletedIndex) return Math.min(i, updatedWalletList.length - 1)
          return i
        })
        return updatedWalletList
      })
      setShowDeleteModal(false)
      setWalletToDelete(null)
    } catch (err) {
      console.error('Failed to delete wallet', err)
      console.error('walletToDelete: ', walletToDelete)
    }
  }

  const handleWalletsReorder = (orderedWallets) => {
    setWallets(orderedWallets)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Personal Expenses" />

      <main id="main-content" className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
        <WalletCarousel
          wallets={wallets}
          loading={walletsLoading}
          userId={userId}
          activeWalletIndex={activeWalletIndex}
          onActiveWalletChange={setActiveWalletIndex}
          onWalletsReorder={handleWalletsReorder}
          onEdit={(w) => {
            setEditWallet(w)
            setShowAddWallet(true)
          }}
          onDelete={(w) => {
            setWalletToDelete(w)
            setShowDeleteModal(true)
          }}
          emptyMessage="No wallets yet. Add one using the button below."
          className="h-[25vh] min-h-[150px] flex-shrink-0 mb-2"
        />

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
                label="Import CSV"
                onClick={() => setShowImport(true)}
                color="blue"
                className="flex-1 sm:flex-none whitespace-nowrap"
                ariaLabel="Import entries from a CSV file"
              />
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
                if (entryKind === 'income') subtitle = `Income · ${e.category ?? ''}`
                else if (entryKind === 'transfer') subtitle = e.type === 'transfer_in' ? 'Transfer In' : 'Transfer Out'
                else if (e.isPersonal) subtitle = `Category: ${e.category ?? ''}`
                else subtitle = `Category: ${e.category ?? ''}${e.groupId != null && e.groupName ? `, Group: ${e.groupName}` : ''}`

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

      <ImportCsvModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        wallets={wallets}
        userId={userId}
        defaultWalletId={wallets[activeWalletIndex] ? getWalletId(wallets[activeWalletIndex]) : null}
        createWallet={handleAddWallet}
        onImported={fetchWalletsWithExpenses}
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
