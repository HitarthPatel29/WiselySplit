import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api'
import Header from '../components/Header.jsx'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import {
  PieChart, Pie, Cell, Sector, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

/* ─────────────────────── constants ─────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CAT_COLORS = {
  Work: '#3b82f6', Food: '#f59e0b', Travel: '#06b6d4', Personal: '#8b5cf6',
  Utilities: '#ec4899', Entertainment: '#f97316', Salary: '#10b981', Freelance: '#14b8a6',
  Investment: '#6366f1', Gift: '#a855f7', Refund: '#22d3ee', Other: '#94a3b8',
}
const PALETTE = ['#3b82f6', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#a855f7']
const catColor = (name, i) => CAT_COLORS[name] || PALETTE[i % PALETTE.length]

/* ─────────────────────── helpers ─────────────────────── */

const fmt = (n) =>
  '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtCompact = (v) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
  return `$${v}`
}

/* ──────────────── recharts render helpers ───────────────── */

const renderActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) => (
  <g>
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}
    />
  </g>
)

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}</span>
          <span className="font-medium text-gray-900 dark:text-white ml-auto">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function Shimmer() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-44 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-[72px] rounded-xl bg-gray-200 dark:bg-gray-700" />)}
      </div>
      <div className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

/* ═══════════════════════ MAIN ═══════════════════════ */

export default function PersonalSummary() {
  const { userId } = useAuth()
  const nav = useNavigate()

  /* ── state ── */
  const [view, setView] = useState('monthly')
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [donutTab, setDonutTab] = useState('expense')
  const [activeSlice, setActiveSlice] = useState(null)

  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  /* ── date range ── */
  const range = useMemo(() => {
    if (view === 'monthly') {
      const s = new Date(year, month, 1)
      const e = new Date(year, month + 1, 0)
      return { startDate: s.toLocaleDateString('en-CA'), endDate: e.toLocaleDateString('en-CA') }
    }
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
  }, [view, month, year])

  /* ── fetch ── */
  useEffect(() => {
    if (!userId) return
    let stale = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/expenses/${userId}/personal-summary`, { params: range })
        if (!stale) setRaw(data?.expenses || [])
      } catch {
        if (!stale) setRaw([])
      } finally {
        if (!stale) setLoading(false)
      }
    })()
    return () => { stale = true }
  }, [userId, range])

  /* ── process data ── */
  const d = useMemo(() => {
    let inc = 0, exp = 0, count = 0
    const eCat = {}, iCat = {}
    const mo = Array.from({ length: 12 }, () => ({ i: 0, e: 0 }))

    for (const r of raw) {
      if (r.entryKind === 'transfer' || r.isSettleUp) continue
      count++
      const amt = r.totalExpenseAmount ?? r.totalAmount ?? 0
      const mIdx = r.date ? new Date(r.date + 'T00:00:00').getMonth() : 0

      if (r.entryKind === 'income') {
        inc += amt
        const cat = r.type || 'Other'
        iCat[cat] = (iCat[cat] || 0) + amt
        mo[mIdx].i += amt
      } else {
        const userAmt = r.isPersonal ? amt : (r.userContribution ?? amt)
        exp += userAmt
        const cat = r.type || 'Other'
        eCat[cat] = (eCat[cat] || 0) + userAmt
        mo[mIdx].e += userAmt
      }
    }

    const r2 = (n) => Math.round(n * 100) / 100
    const toArr = (m) =>
      Object.entries(m)
        .map(([name, value]) => ({ name, value: r2(value) }))
        .sort((a, b) => b.value - a.value)

    return {
      totalIncome: r2(inc),
      totalExpense: r2(exp),
      net: r2(inc - exp),
      count,
      expCats: toArr(eCat),
      incCats: toArr(iCat),
      bars: mo.map((x, i) => ({ month: MONTHS[i], Income: r2(x.i), Expenses: r2(x.e) })),
    }
  }, [raw])

  /* ── navigation ── */
  const shiftPeriod = (dir) => {
    setActiveSlice(null)
    if (view === 'monthly') {
      const nd = new Date(year, month + dir, 1)
      setMonth(nd.getMonth())
      setYear(nd.getFullYear())
    } else {
      setYear((y) => y + dir)
    }
  }

  const now = new Date()
  const canFwd =
    view === 'monthly'
      ? !(year === now.getFullYear() && month === now.getMonth())
      : year < now.getFullYear()

  /* ── donut data ── */
  const donut = donutTab === 'expense' ? d.expCats : d.incCats
  const donutSum = donut.reduce((s, x) => s + x.value, 0)

  const centerLabel =
    activeSlice != null && donut[activeSlice]
      ? donut[activeSlice].name
      : donutTab === 'expense'
        ? 'Total Expenses'
        : 'Total Income'

  const centerValue =
    activeSlice != null && donut[activeSlice] ? donut[activeSlice].value : donutSum

  const period = view === 'monthly' ? `${MONTHS_FULL[month]} ${year}` : `${year}`

  /* ════════════════════════════ render ════════════════════════════ */

  return (
    <div className="min-h-screen">
      <Header title="Personal Summary" />

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-6">

        {/* ──────── Period Navigator ──────── */}
        <section className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 w-full max-w-sm">
            <button
              onClick={() => shiftPeriod(-1)}
              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
              aria-label="Previous period"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <p className="flex-1 text-center text-lg font-semibold text-gray-900 dark:text-white select-none">
              {period}
            </p>

            <button
              onClick={() => shiftPeriod(1)}
              disabled={!canFwd}
              className={`p-2.5 rounded-xl border shadow-sm transition-all active:scale-95 ${
                canFwd
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  : 'opacity-30 cursor-not-allowed border-transparent'
              }`}
              aria-label="Next period"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Monthly / Yearly toggle */}
          <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 shadow-inner">
            {['monthly', 'yearly'].map((m) => (
              <button
                key={m}
                onClick={() => { setView(m); setActiveSlice(null) }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  view === m
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <Shimmer />
        ) : (
          <>
            {/* ──────── Net Balance Hero Card ──────── */}
            <section className="animate-fadeIn">
              <div
                className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 ${
                  d.net >= 0
                    ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700'
                    : 'bg-gradient-to-br from-rose-400 via-rose-500 to-red-600'
                }`}
              >
                {/* Decorative light blobs */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 15% 85%, rgba(255,255,255,.12) 0%, transparent 50%),' +
                      'radial-gradient(circle at 85% 15%, rgba(255,255,255,.08) 0%, transparent 50%)',
                  }}
                />

                <div className="relative text-white text-center">
                  <p className="text-xs sm:text-sm font-medium opacity-80 uppercase tracking-[.2em] mb-2">
                    Net Balance
                  </p>
                  <p className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none">
                    {d.net < 0 && '−'}{fmt(d.net)}
                  </p>

                  <div className="mt-5 flex justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
                    <div className="flex flex-col items-center">
                      <span className="opacity-60 text-[10px] sm:text-xs uppercase tracking-wider">Income</span>
                      <span className="font-semibold mt-0.5">{fmt(d.totalIncome)}</span>
                    </div>
                    <div className="w-px h-8 bg-white/25 rounded-full" />
                    <div className="flex flex-col items-center">
                      <span className="opacity-60 text-[10px] sm:text-xs uppercase tracking-wider">Expenses</span>
                      <span className="font-semibold mt-0.5">{fmt(d.totalExpense)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ──────── Stat Cards ──────── */}
            <section className="grid grid-cols-3 gap-2 sm:gap-4 animate-fadeIn">
              {[
                { label: 'Income', value: fmt(d.totalIncome), cls: 'text-emerald-600 dark:text-emerald-400', accent: 'bg-emerald-500' },
                { label: 'Expenses', value: fmt(d.totalExpense), cls: 'text-rose-500 dark:text-rose-400', accent: 'bg-rose-500' },
                { label: 'Entries', value: d.count, cls: 'text-blue-600 dark:text-blue-400', accent: 'bg-blue-500' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm"
                >
                  <div className={`absolute top-0 left-0 w-full h-0.5 ${s.accent}`} />
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className={`text-lg sm:text-xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </section>

            {/* ──────── Donut Chart ──────── */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4 sm:p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  By Category
                </h2>
                <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5">
                  {['expense', 'income'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setDonutTab(t); setActiveSlice(null) }}
                      className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        donutTab === t
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {t === 'expense' ? 'Expenses' : 'Income'}
                    </button>
                  ))}
                </div>
              </div>

              {donut.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full border-4 border-dashed border-gray-200 dark:border-gray-700" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    No {donutTab === 'expense' ? 'expense' : 'income'} data for this period
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative" onMouseLeave={() => setActiveSlice(null)}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={donut}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={3}
                          dataKey="value"
                          activeIndex={activeSlice ?? -1}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, i) => setActiveSlice(i)}
                          onClick={(_, i) => setActiveSlice((prev) => (prev === i ? null : i))}
                          animationDuration={600}
                          animationEasing="ease-out"
                        >
                          {donut.map((entry, i) => (
                            <Cell key={i} fill={catColor(entry.name, i)} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center px-4">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                          {centerLabel}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                          {fmt(centerValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 sm:mt-5">
                    {donut.map((entry, i) => (
                      <button
                        key={i}
                        className={`flex items-center gap-1.5 text-xs sm:text-sm transition-opacity duration-200 ${
                          activeSlice != null && activeSlice !== i ? 'opacity-35' : 'opacity-100'
                        }`}
                        onMouseEnter={() => setActiveSlice(i)}
                        onMouseLeave={() => setActiveSlice(null)}
                        onClick={() => setActiveSlice((prev) => (prev === i ? null : i))}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catColor(entry.name, i) }}
                        />
                        <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{fmt(entry.value)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* ──────── Yearly Bar Chart ──────── */}
            {view === 'yearly' && (
              <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-4 sm:p-6 animate-fadeIn">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-5">
                  Monthly Overview
                </h2>

                {d.bars.every((b) => b.Income === 0 && b.Expenses === 0) ? (
                  <div className="h-56 flex flex-col items-center justify-center gap-2">
                    <div className="w-16 h-16 rounded-xl border-4 border-dashed border-gray-200 dark:border-gray-700" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      No data for {year}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="-ml-2 sm:ml-0">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={d.bars} barGap={2} barCategoryGap="20%">
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#374151' : '#f3f4f6'}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                            axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={fmtCompact}
                            tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: isDark ? 'rgba(55,65,81,.3)' : 'rgba(243,244,246,.7)' }}
                          />
                          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Custom legend */}
                    <div className="flex justify-center gap-6 mt-3">
                      {[
                        { color: '#10b981', label: 'Income' },
                        { color: '#f43f5e', label: 'Expenses' },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* ──────── Footer link ──────── */}
            <div className="text-center pb-6">
              <button
                onClick={() => nav('/personalExpense')}
                className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline underline-offset-4 transition-all"
              >
                View all transactions →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
