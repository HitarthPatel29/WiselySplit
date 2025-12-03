import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import FilterModal from '../../components/Modals/FilterModal'
import Header from '../../components/Header.jsx'
import ExpenseItemCard from '../../components/ListItem/ExpenseItemCard.jsx'
import { AdjustmentsHorizontalIcon} from '@heroicons/react/24/solid';

// Helper to format date as Month, DD in local timezone
const formatDate = (raw) => {
  if (!raw) return ''
  try {
    const d = new Date(raw + "T00:00:00")
    const month = d.toLocaleString('en-CA', { month: 'short' })
    const day = String(d.getDate()).padStart(2, '0')
    return `${month} ${day}`
  } catch {
    return raw
  }
}

export default function PersonalSummary() {

  const navigate = useNavigate()
  const { userId } = useAuth()

  const [rawExpenses, setRawExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])

  const [totals, setTotals] = useState({ totalLent: 0, totalOwed: 0 })

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState([])
  const [groupFilter, setGroupFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [monthFilter, setMonthFilter] = useState('')

  // Date range for backend fetch
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Track the date range that was actually fetched from backend
  const [fetchedStartDate, setFetchedStartDate] = useState('')
  const [fetchedEndDate, setFetchedEndDate] = useState('')

  // Display date range filter (for frontend filtering when within fetched range)
  const [displayStartDate, setDisplayStartDate] = useState('')
  const [displayEndDate, setDisplayEndDate] = useState('')

  // Show Modal
  const [showFilter, setShowFilter] = useState(false)

  // You may already have group list from context; otherwise you preload them here
  const [groups, setGroups] = useState([])

  // -----------------------------------------------------------
  // Default 1 Month Range calculation
  // -----------------------------------------------------------
  useEffect(() => {
    const now = new Date()
    const end = now.toLocaleDateString('en-CA') // gives YYYY-MM-DD
    console.log('end', end)
    const monthAgo = new Date(now)
    monthAgo.setMonth(now.getMonth() - 1)
    const start = monthAgo.toLocaleDateString('en-CA')
    console.log('start', start)
    setStartDate(start)
    setEndDate(end)
    // Initialize display range same as fetch range
    setDisplayStartDate(start)
    setDisplayEndDate(end)
  }, [])

  // -----------------------------------------------------------
  // Fetch Groups (Optional but needed for Filter)
  // -----------------------------------------------------------
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await api.get('/groups/' + userId)
        const cleaned = (res.data || []).map(g => ({
          groupId: g.groupId,
          groupName: g.name    // your DB returns 'name'
        }))
        setGroups(cleaned)
      } catch (err) {
        console.error('Error loading groups:', err)
      }
    }

    loadGroups()
  }, [userId])

  // -----------------------------------------------------------
  // Fetch Personal Summary from backend (Option 3)
  // -----------------------------------------------------------
  useEffect(() => {
    if (!startDate || !endDate) return

    const fetchSummary = async () => {
      try {
        console.log('fetching summary for')
        console.log('startDate', startDate)
        console.log('endDate', endDate)
        const res = await api.get(`/expenses/${userId}/personal-summary`,
          { params: { startDate: startDate, endDate: endDate } }
        )

        const data = res.data || {}
        console.log('data121', data)
        setRawExpenses(data.expenses || [])
        setFilteredExpenses(data.expenses || [])

        setTotals(data.summary || { totalLent: 0, totalOwed: 0 })

        // Track what we actually fetched
        setFetchedStartDate(startDate)
        setFetchedEndDate(endDate)
        // Update display range to match fetched range
        setDisplayStartDate(startDate)
        setDisplayEndDate(endDate)

      } catch (err) {
        console.error('Error fetching personal summary:', err)
      }
    }

    fetchSummary()
  }, [userId, startDate, endDate])

  // -----------------------------------------------------------
  // Apply All FE Filters
  // -----------------------------------------------------------
  useEffect(() => {
    let list = [...rawExpenses]

    // Date Range Filter (frontend filtering when within fetched range)
    console.log('displayStartDate149', displayStartDate)
    console.log('displayEndDate150', displayEndDate)
    if (displayStartDate && displayEndDate) {
      list = list.filter(e => {
        console.log('e.date', e.date)
        return e.date >= displayStartDate && e.date <= displayEndDate
      })
    }

    // Keyword Search
    if (search.trim() !== '') {
      list = list.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Expense Type (multi-select)
    if (typeFilter.length > 0) {
      list = list.filter(e => typeFilter.includes(e.type))
    }

    // Group
    if (groupFilter) {
      list = list.filter(e => String(e.groupId) === String(groupFilter))
    }

    // Filter by Month
    if (monthFilter) {
      list = list.filter(e => {
        const monthIndex = new Date(e.date).getMonth() // 0-11
        const monthName = getMonthName(monthIndex)
        return monthName === monthFilter
      })
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.date) - new Date(a.date)
      }
      return new Date(a.date) - new Date(b.date)
    })

    setFilteredExpenses(list)

    // Recalculate Totals for filtered list
    let lent = 0
    let owed = 0

    list.forEach(e => {
      if (e.netAmount < 0) lent += Math.abs(e.netAmount)
      else if (e.netAmount > 0) owed += e.netAmount
    })

    setTotals({ totalLent: lent, totalOwed: owed })

  }, [search, typeFilter, groupFilter, sort, monthFilter, rawExpenses, displayStartDate, displayEndDate])

  // Helper to map numeric month → Name
  const getMonthName = index => {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return names[index]
  }

  // -----------------------------------------------------------
  // Helper: Check if date range is within fetched range
  // -----------------------------------------------------------
  const isDateRangeWithinFetched = (newStart, newEnd) => {
    if (!fetchedStartDate || !fetchedEndDate || !newStart || !newEnd) {
      return false
    }
    return newStart >= fetchedStartDate && newEnd <= fetchedEndDate
  }

  // -----------------------------------------------------------
  // Helper: Get date range for a given month name
  // -----------------------------------------------------------
  const getMonthDateRange = (monthName) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthIndex = monthNames.indexOf(monthName)
    if (monthIndex === -1) return null

    let year = new Date().getFullYear()

    const firstDay = new Date(year, monthIndex, 1)
    const lastDay = new Date(year, monthIndex + 1, 0) // Day 0 of next month = last day of current month

    return {
      start: firstDay.toLocaleDateString('en-CA'),
      end: lastDay.toLocaleDateString('en-CA')
    }
  }

  // -----------------------------------------------------------
  // Handle apply from FilterModal
  // -----------------------------------------------------------
  const handleApplyFilters = (f) => {
    setTypeFilter(f.typeFilter)
    setGroupFilter(f.groupFilter)
    setSort(f.sort)
    setMonthFilter(f.month)

    // If month filter is selected, calculate date range for that month
    if (f.month) {
      const monthRange = getMonthDateRange(f.month)
      if (monthRange) {
        if (isDateRangeWithinFetched(monthRange.start, monthRange.end)) {
          setDisplayStartDate(monthRange.start)
          setDisplayEndDate(monthRange.end)
        } else {
          setStartDate(monthRange.start)
          setEndDate(monthRange.end)
        }
      }
      setShowFilter(false)
      return
    }

    console.log('f.startDate', f.startDate)
    console.log('f.endDate', f.endDate)
    // Handle date range
    if (f.startDate && f.endDate) {
      // Check if the new range is within the already fetched range
      if (isDateRangeWithinFetched(f.startDate, f.endDate)) {
        // Range is within fetched data - just filter on frontend, no backend fetch
        setDisplayStartDate(f.startDate)
        setDisplayEndDate(f.endDate)
        console.log('within fetched range')
        console.log('displayStartDate', displayStartDate)
        console.log('displayEndDate', displayEndDate)
        // Keep startDate/endDate unchanged (no fetch triggered)
      } else {
        // Range extends beyond fetched data - need to fetch from backend
        setStartDate(f.startDate)
        setEndDate(f.endDate)
        // displayStartDate/displayEndDate will be updated after fetch completes
      }
    } else if (!f.startDate && !f.endDate) {
      // User cleared the date range - reset to default 1 month
      const now = new Date()
      const end = now.toLocaleDateString('en-CA')
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      const start = monthAgo.toLocaleDateString('en-CA')
      setStartDate(start)
      setEndDate(end)
      // displayStartDate/displayEndDate will be updated after fetch completes
    }
    // If only one date is provided, don't update (keep existing range)

    setShowFilter(false)
  }

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------

   return (
    <div className='min-h-screen'>

      <Header title='Personal Summary' />

      {/* MAIN CONTENT AREA */}
      <main className='max-w-3xl mx-auto px-4 py-6'>

        {/* Summary Section */}
        <div className='mb-5'>
          {/* Total Balance - bigger and prominent */}
          <p className={`text-2xl font-bold mb-2 ${
            (totals.totalLent - totals.totalOwed) >= 0 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-red-500 dark:text-red-400'
          }`}>
            Total Balance: ${Math.abs(totals.totalLent - totals.totalOwed).toFixed(2)}
          </p>
          <p className='text-emerald-600 dark:text-emerald-400 font-semibold'>
            Amount Lent: ${totals.totalLent.toFixed(2)}
          </p>
          <p className='text-red-500 dark:text-red-400 font-semibold'>
            Amount Owed: ${totals.totalOwed.toFixed(2)}
          </p>
        </div>

        {/* Search + Filter Button */}
        <div className='flex items-center gap-3 mb-6'>
          <input
            type='text'
            placeholder='Search expenses...'
            className='flex-1 border p-3 border border-gray-300 rounded-xl px-4 py-2 
                      text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 
                      focus:ring-emerald-400' 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <button
            onClick={() => setShowFilter(true)}
            className='p-3 rounded-xl border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Expense List */}
        <div className='flex flex-col gap-3'>
          {filteredExpenses.map((e) => (
            <ExpenseItemCard
              key={e.expenseId}
              date={formatDate(e.date)}
              title={e.title}
              subtitle={`Type: ${e.type} ${e.groupId!=null? ` , Group: ${e.groupName}`: ``}`}
              amount={Math.abs(e.netAmount.toFixed(2))}
              type={e.netAmount < 0 ? 'lent' : 'owe'}
              onClick={() =>
                navigate(`/personalSummary/expenses/${e.expenseId}`, {state: { ...e, from: 'personalSummary' }})
              }
            />
          ))}
        </div>

      </main>

      {/* Filter Modal */}
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
          month: monthFilter
        }}
      />

    </div>
  )
}