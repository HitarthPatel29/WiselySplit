// src/pages/Dashboard.jsx
// Option A: Bento Hero + Utility Rail layout.
// Dummy data only — API wiring deferred until design is approved.
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  ArrowRightIcon,
  UserIcon,
  UserGroupIcon,
  WalletIcon,
  CreditCardIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import DashboardHeader from '../components/DashboardHeader.jsx'

const DUMMY_USER = {
  name: 'Hitarth Patel',
  email: 'hitarth@wiselysplit.app',
  profilePicture: null,
}

const DUMMY_SUMMARY = {
  net: 245.5,
  totalOwed: 380.0,
  totalOwing: 134.5,
  weekly: [
    { day: 'Mon', amt: 120 },
    { day: 'Tue', amt: 80 },
    { day: 'Wed', amt: 210 },
    { day: 'Thu', amt: 150 },
    { day: 'Fri', amt: 245 },
    { day: 'Sat', amt: 90 },
    { day: 'Sun', amt: 60 },
  ],
}

const DUMMY_FRIENDS = [
  { id: 'f1', name: 'Alice Johnson', balance: 45.5 },
  { id: 'f2', name: 'Bob Smith', balance: -22.0 },
  { id: 'f3', name: 'Carol Wu', balance: 120.0 },
  { id: 'f4', name: 'Dave Lee', balance: 0 },
]

const DUMMY_GROUPS = [
  { id: 'g1', name: 'Roommates', memberCount: 4, balance: 150.0 },
  { id: 'g2', name: 'Trip to NYC', memberCount: 6, balance: -50.0 },
  { id: 'g3', name: 'Office Lunch', memberCount: 8, balance: 25.0 },
]

const DUMMY_WALLETS = [
  { id: 'w1', name: 'Daily', balance: 320.0 },
  { id: 'w2', name: 'Travel', balance: 850.0 },
  { id: 'w3', name: 'Savings', balance: 1240.0 },
]

const DUMMY_INVITES = [
  { id: 'i1', from: 'Sarah Chen', subtitle: 'wants to be friends', type: 'friend' },
  { id: 'i2', from: 'Trip to LA', subtitle: 'group invite from Mike R.', type: 'group' },
  { id: 'i3', from: 'Office Lunch', subtitle: 'group invite from Pat T.', type: 'group' },
]

const DUMMY_STRIPE_CONNECTED = false

const fmt = (n) =>
  `$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

function SignedAmount({ amount, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-lg' : 'text-sm'
  if (amount === 0) {
    return (
      <span className={`${sizeClass} font-semibold text-gray-500 dark:text-gray-400`}>
        Settled
      </span>
    )
  }
  const positive = amount > 0
  return (
    <span
      className={`${sizeClass} font-semibold ${
        positive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      {positive ? '+' : '−'}
      {fmt(amount)}
    </span>
  )
}

function TileCard({
  title,
  icon: Icon,
  action,
  actionLabel = 'View all',
  badge,
  children,
  className = '',
}) {
  return (
    <section
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between px-5 pt-5 pb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <Icon
                className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                aria-hidden="true"
              />
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h2>
            {badge != null && badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          {action && (
            <button
              onClick={action}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1"
            >
              <span className="hidden sm:inline">{actionLabel}</span>
              <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </header>
      )}
      <div className="px-5 pb-5 flex-1 flex flex-col">{children}</div>
    </section>
  )
}

function ListAvatar({ name, tone = 'emerald', size = 36, fallbackIcon: Icon }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
  const palette = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  }[tone]
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${palette}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.4) }}
      aria-hidden="true"
    >
      {Icon ? <Icon className="w-1/2 h-1/2" /> : initials || '?'}
    </div>
  )
}

function HeroAddEntry({ userName, onClick }) {
  const firstName = (userName || '').split(' ')[0] || 'there'
  return (
    <button
      onClick={onClick}
      className="group w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
      aria-label="Add a new entry"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <PlusIcon className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-50/90">
            Hey {firstName}
          </p>
          <p className="text-lg sm:text-xl font-bold leading-tight">
            Add a new entry
          </p>
          <p className="text-sm text-emerald-50/90 mt-0.5 hidden sm:block">
            Log an expense, settlement, or transfer in seconds.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 bg-white/15 group-hover:bg-white/25 transition rounded-xl px-3 sm:px-4 py-2 sm:py-2.5">
        <span className="hidden sm:inline font-semibold text-sm">Add Entry</span>
        <ArrowRightIcon
          className="w-5 h-5 group-hover:translate-x-0.5 transition-transform"
          aria-hidden="true"
        />
      </div>
    </button>
  )
}

function SummaryTile({ data, onView }) {
  const positive = data.net >= 0
  return (
    <TileCard
      title="Summary"
      icon={ChartBarIcon}
      action={onView}
      actionLabel="View summary"
    >
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            Net balance
          </p>
          <p
            className={`text-3xl sm:text-4xl font-bold mt-1 ${
              positive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {positive ? '+' : '−'}
            {fmt(data.net)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Overall, {positive ? "you're owed" : 'you owe'} this much across friends and groups.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wide">
                You're owed
              </p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {fmt(data.totalOwed)}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 border border-red-100 dark:border-red-900/40">
              <p className="text-xs text-red-700 dark:text-red-300 font-semibold uppercase tracking-wide">
                You owe
              </p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
                {fmt(data.totalOwing)}
              </p>
            </div>
          </div>
        </div>
        <div className="lg:w-52 lg:flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
              This week
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">7 days</p>
          </div>
          <div className="h-28 sm:h-32 -mx-2" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.weekly}
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(17,24,39,0.92)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                    padding: '6px 10px',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value) => [`$${value}`, 'Net']}
                  cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="amt"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#balanceFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </TileCard>
  )
}

function FriendsTile({ friends, onView }) {
  return (
    <TileCard title="Friends" icon={UserIcon} action={onView}>
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 -mx-1">
        {friends.slice(0, 4).map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-3 py-2.5 px-1 first:pt-0 last:pb-0"
          >
            <ListAvatar name={f.name} tone="indigo" size={32} />
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {f.name}
            </span>
            <SignedAmount amount={f.balance} />
          </li>
        ))}
      </ul>
    </TileCard>
  )
}

function GroupsTile({ groups, onView }) {
  return (
    <TileCard title="Groups" icon={UserGroupIcon} action={onView}>
      <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700 -mx-1">
        {groups.slice(0, 4).map((g) => (
          <li
            key={g.id}
            className="flex items-center gap-3 py-2.5 px-1 first:pt-0 last:pb-0"
          >
            <ListAvatar name={g.name} tone="purple" size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {g.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {g.memberCount} members
              </p>
            </div>
            <SignedAmount amount={g.balance} />
          </li>
        ))}
      </ul>
    </TileCard>
  )
}

function WalletsTile({ wallets, total, onView, onAdd }) {
  return (
    <TileCard
      title="Wallets"
      icon={WalletIcon}
      action={onView}
      actionLabel="View all"
    >
      <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-2">
        Personal expense wallets
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        {wallets.slice(0, 3).map((w) => (
          <div
            key={w.id}
            className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col justify-between"
          >
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
              {w.name}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
              {fmt(w.balance)}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Total across wallets
          </p>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {fmt(total)}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-2 py-1"
        >
          <PlusIcon className="w-4 h-4" aria-hidden="true" />
          Add expense
        </button>
      </div>
    </TileCard>
  )
}

function InvitesTile({ invites, onView }) {
  return (
    <TileCard
      title="Invites"
      icon={EnvelopeIcon}
      badge={invites.length}
      action={onView}
      actionLabel="View all"
    >
      {invites.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No pending invites.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {invites.slice(0, 2).map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50"
            >
              <ListAvatar
                name={inv.from}
                tone={inv.type === 'group' ? 'purple' : 'indigo'}
                size={32}
                fallbackIcon={inv.type === 'group' ? UserGroupIcon : undefined}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {inv.from}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {inv.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  aria-label={`Accept invite from ${inv.from}`}
                >
                  <CheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label={`Decline invite from ${inv.from}`}
                >
                  <XMarkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {invites.length > 2 && (
        <button
          onClick={onView}
          className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1 py-0.5 text-left"
        >
          + {invites.length - 2} more pending
        </button>
      )}
    </TileCard>
  )
}

function SendInviteTile({ onSend }) {
  const [email, setEmail] = useState('')
  return (
    <TileCard title="Send Invite" icon={PaperAirplaneIcon}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Invite a friend to split expenses with you.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSend?.(email)
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="invite-email" className="sr-only">
          Friend's email
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@email.com"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
        />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400"
        >
          <PaperAirplaneIcon className="w-4 h-4" aria-hidden="true" />
          Send invite
        </button>
      </form>
    </TileCard>
  )
}

function StripeTile({ connected, onManage }) {
  return (
    <TileCard title="Stripe Payments" icon={CreditCardIcon}>
      <div className="flex items-center gap-2 mb-3">
        {connected ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
            <CheckIcon className="w-3 h-3" aria-hidden="true" />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full">
            Not connected
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {connected
          ? 'Your account is ready to receive payments when friends settle up.'
          : 'Connect Stripe to receive payments directly when friends settle up with you.'}
      </p>
      <button
        onClick={onManage}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          connected
            ? 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-400'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-400'
        }`}
      >
        {connected ? 'Manage account' : 'Connect Stripe'}
        <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
      </button>
    </TileCard>
  )
}

function QuickActionStrip({ onAddEntry, onTransfer, onSummary }) {
  const actions = [
    { label: 'Add expense', icon: PlusIcon, onClick: onAddEntry },
    { label: 'Transfer', icon: ArrowsRightLeftIcon, onClick: onTransfer },
    { label: 'Personal summary', icon: ChartBarIcon, onClick: onSummary },
  ]
  return (
    <div className="grid grid-cols-3 gap-2 sm:hidden">
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="text-[11px] font-medium leading-tight text-center">
              {a.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('firstLogin') === 'true') {
      navigate('/invite')
    }
  }, [navigate])

  const user = DUMMY_USER
  const summary = DUMMY_SUMMARY
  const friends = DUMMY_FRIENDS
  const groups = DUMMY_GROUPS
  const wallets = DUMMY_WALLETS
  const invites = DUMMY_INVITES
  const stripeConnected = DUMMY_STRIPE_CONNECTED

  const walletTotal = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance, 0),
    [wallets]
  )

  const goAddEntry = () => navigate('/personalExpense/add')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <DashboardHeader user={user} pendingInvites={invites.length} />

      <main
        id="main-content"
        className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-5 sm:space-y-6"
        aria-labelledby="dashboard-heading"
      >
        <h1 id="dashboard-heading" className="sr-only">
          Dashboard
        </h1>

        <HeroAddEntry userName={user.name} onClick={goAddEntry} />

        <QuickActionStrip
          onAddEntry={goAddEntry}
          onTransfer={goAddEntry}
          onSummary={() => navigate('/personalSummary')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Main bento — 2 cols on lg */}
          <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
            <SummaryTile
              data={summary}
              onView={() => navigate('/personalSummary')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <FriendsTile
                friends={friends}
                onView={() => navigate('/friends')}
              />
              <GroupsTile groups={groups} onView={() => navigate('/groups')} />
            </div>
            <WalletsTile
              wallets={wallets}
              total={walletTotal}
              onView={() => navigate('/personalExpense')}
              onAdd={goAddEntry}
            />
          </div>

          {/* Utility rail — 1 col on lg, full width below on mobile/tablet */}
          <aside
            className="flex flex-col gap-5 sm:gap-6"
            aria-label="Invites and account utilities"
          >
            <InvitesTile
              invites={invites}
              onView={() => navigate('/dashboard/invites')}
            />
            <SendInviteTile onSend={() => navigate('/invite')} />
            <StripeTile
              connected={stripeConnected}
              onManage={() => navigate('/stripe/connect')}
            />
          </aside>
        </div>

        <footer className="pt-2 pb-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Showing sample data — APIs not yet wired up.
        </footer>
      </main>
    </div>
  )
}
