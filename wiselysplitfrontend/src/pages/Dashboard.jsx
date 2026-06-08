// src/pages/Dashboard.jsx
// Option A: Bento Hero + Utility Rail layout.
// Friends & groups from AuthContext; other sections use placeholder data for now.
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
import { useAuth } from '../context/AuthContext'
import DashboardHeader from '../components/DashboardHeader.jsx'
import WalletCarousel from '../components/IO/WalletCarousel.jsx'
import AddWallet from '../components/Modals/AddWallet.jsx'
import AlertModal from '../components/Modals/AlertModal.jsx'
import PrimaryButton from '../components/IO/PrimaryButton.jsx'
import api from '../api'
import {
  applyWalletOrder,
  getWalletId,
  setWalletOrder,
  syncWalletOrderWithWallets,
  walletIdsFromList,
} from '../utils/walletOrderStorage.js'

const DEFAULT_AVATAR =
  'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'


const fmt = (n) =>
  `$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

function getInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

function ProfileAvatar({ name, src, size = 72, fallbackIcon: FallbackIcon }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  if (showImage) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
        style={{ width: size, height: size }}
      />
    )
  }

  if (FallbackIcon) {
    return (
      <div
        className="rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-2 ring-gray-100 dark:ring-gray-700"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <FallbackIcon style={{ width: size * 0.45, height: size * 0.45 }} />
      </div>
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-gray-100 dark:ring-gray-700"
      style={{ width: size, height: size, fontSize: Math.max(14, size * 0.32) }}
      aria-hidden="true"
    >
      {getInitials(name) || '?'}
    </div>
  )
}

function TileCard({
  title,
  icon: Icon,
  action,
  actionLabel = 'View all',
  badge,
  titleAddon,
  children,
  className = '',
}) {
  return (
    <section
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col ${className}`}
    >
      {(title || action || titleAddon) && (
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
          {(titleAddon || action) && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {titleAddon}
              {action && (
                <button
                  onClick={action}
                  className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded px-1"
                >
                  <span className="hidden sm:inline">{actionLabel}</span>
                  <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </header>
      )}
      <div className="px-5 pb-5 flex-1 flex flex-col">{children}</div>
    </section>
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

function HorizontalProfileList({
  items,
  emptyMessage,
  onItemClick,
  showMemberCount = false,
  fallbackIcon,
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto scrollbar-thin -mx-5 px-5">
      <ul className="flex gap-4 sm:gap-5 pb-1" role="list">
        {items.map((item) => {
          const memberCount = showMemberCount
            ? item.members?.length ?? 0
            : null
          return (
            <li key={item.id} className="flex-shrink-0" role="listitem">
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className="flex flex-col items-center gap-2.5 w-[5.5rem] sm:w-24 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-xl p-1"
                aria-label={
                  showMemberCount && memberCount != null
                    ? `${item.name}, ${memberCount} members`
                    : item.name
                }
              >
                <ProfileAvatar
                  name={item.name}
                  src={
                    item.profilePicture ||
                    (fallbackIcon ? undefined : DEFAULT_AVATAR)
                  }
                  size={72}
                  fallbackIcon={fallbackIcon}
                />
                <span className="w-full text-sm font-medium text-gray-900 dark:text-gray-100 text-center truncate leading-tight">
                  {item.name}
                </span>
                {showMemberCount && memberCount != null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FriendsTile({ friends, onView, onSelect }) {
  return (
    <TileCard title="Friends" icon={UserIcon} action={onView}>
      <HorizontalProfileList
        items={friends}
        emptyMessage="No friends yet. Send an invite to get started."
        onItemClick={onSelect}
      />
    </TileCard>
  )
}

function GroupsTile({ groups, onView, onSelect }) {
  return (
    <TileCard title="Groups" icon={UserGroupIcon} action={onView}>
      <HorizontalProfileList
        items={groups}
        emptyMessage="No groups yet. Create one to split with others."
        onItemClick={onSelect}
        showMemberCount
        fallbackIcon={UserGroupIcon}
      />
    </TileCard>
  )
}

function WalletsTile({
  wallets,
  walletsLoading,
  total,
  userId,
  onView,
  onAddWallet,
  onWalletsReorder,
  onEditWallet,
  onDeleteWallet,
}) {
  return (
    <TileCard
      title="Your Wallet"
      icon={WalletIcon}
      action={onView}
      actionLabel="View all"
    >
      <WalletCarousel
        wallets={wallets}
        loading={walletsLoading}
        userId={userId}
        onWalletsReorder={onWalletsReorder}
        onEdit={onEditWallet}
        onDelete={onDeleteWallet}
      />
      
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Total Balance
          </p>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {fmt(total)}
          </p>
        </div>
        <PrimaryButton
          label="Add Wallet/Card"
          onClick={onAddWallet}
          className="flex-shrink-0 whitespace-nowrap"
          ariaLabel="Add wallet, card, or account"
        />
      </div>
    </TileCard>
  )
}

function SendInviteTile() {
  const navigate = useNavigate()
  return (
    <TileCard title="Send Invite" icon={PaperAirplaneIcon}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Invite a friend to split expenses with you.
      </p>
      <div className="flex flex-col gap-2">
          <PrimaryButton
            label="View Invites"
            onClick={() => navigate('/dashboard/invites')}
            className="flex-1"
            ariaLabel="View your invites"
          />
          <PrimaryButton
            label= "Send Invite"
            onClick={() => navigate('/invite')}
            className="flex-1"
            ariaLabel="Send a friend invite"
          />
      </div>
    </TileCard>
  )
}

function StripeTile({ connected, onManage }) {
  const steps = [
    'When settling up with a friend or in a group, choose "Stripe" as your payment method.',
    'Enter the amount you want to send and complete the secure checkout process.',
    'The recipient must have a connected Stripe account to receive payments.',
    'Payments are processed securely and funds are transferred directly to the recipient\'s account.',
  ]

  const statusPill = connected ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-full flex-shrink-0">
      <CheckIcon className="w-3 h-3" aria-hidden="true" />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full flex-shrink-0">
      Not connected
    </span>
  )

  return (
    <TileCard
      title="Stripe Payments"
      icon={CreditCardIcon}
      titleAddon={statusPill}
    >
      {/* How it works */}
      <div
        className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 mb-3"
        role="region"
        aria-labelledby="stripe-dash-how-it-works"
      >
        <h3
          id="stripe-dash-how-it-works"
          className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2"
        >
          How it works
        </h3>
        <ol className="flex flex-col gap-1.5" role="list">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0"
                aria-hidden="true"
              >
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Connect / Manage CTA */}
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
  const { friendsAndGroups, fetchConnections, userId, wallets, setWallets, fetchWallets } = useAuth()
  const [stripeAccountId, setStripeAccountId] = useState(null)
  const [user, setUser] = useState(null)
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [editWallet, setEditWallet] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [walletToDelete, setWalletToDelete] = useState(null)

  useEffect(() => {
    if (localStorage.getItem('firstLogin') === 'true') {
      navigate('/personalExpense')
    }
  }, [navigate])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!userId) {
        setWalletsLoading(false)
        return
      }
      setWalletsLoading(true)
      await fetchWallets()
      if (!cancelled) setWalletsLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId, fetchWallets])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return
      try {
        const res = await api.get(`/users/${userId}`)
        const data = res.data || {}
        setUser(data)
        if (data.stripeAccountId) {
          setStripeAccountId(data.stripeAccountId)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }
    fetchUserData()
  }, [userId])

  const friends = useMemo(
    () => friendsAndGroups.filter((item) => item.type === 'friend'),
    [friendsAndGroups]
  )

  const groups = useMemo(
    () => friendsAndGroups.filter((item) => item.type === 'group'),
    [friendsAndGroups]
  )

  const orderedWallets = useMemo(() => {
    if (!userId || !wallets.length) return wallets
    const savedOrder = syncWalletOrderWithWallets(userId, wallets)
    return applyWalletOrder(wallets, savedOrder)
  }, [wallets, userId])

  const walletTotal = useMemo(
    () => orderedWallets.reduce((sum, w) => sum + Number(w.walletBalance ?? w.balance ?? 0), 0),
    [orderedWallets]
  )

  const goAddEntry = () => navigate('/personalExpense/add')

  const handleAddWallet = async (data) => {
    if (!userId) return
    try {
      await api.post(`/users/${userId}/wallets`, {
        walletName: data.walletName,
        cardName: data.cardName,
        walletColor: data.walletColor,
        walletBalance: data.walletBalance,
      })
      await fetchWallets()
      setShowAddWallet(false)
      setEditWallet(null)
    } catch (err) {
      console.error('Failed to create wallet', err)
    }
  }

  const handleEditWallet = async (targetWalletId, data) => {
    if (!userId) return
    try {
      await api.put(`/users/${userId}/wallets/${targetWalletId}`, data)
      await fetchWallets()
      setEditWallet(null)
      setShowAddWallet(false)
    } catch (err) {
      console.error('Failed to update wallet', err)
    }
  }

  const handleDeleteWallet = async () => {
    if (!userId || !walletToDelete) return
    try {
      await api.delete(`/users/${userId}/wallets/${getWalletId(walletToDelete)}`)
      const deletedId = getWalletId(walletToDelete)
      setWallets((prev) => {
        const updatedWalletList = prev.filter((w) => getWalletId(w) !== deletedId)
        setWalletOrder(userId, walletIdsFromList(updatedWalletList))
        return updatedWalletList
      })
      setShowDeleteModal(false)
      setWalletToDelete(null)
    } catch (err) {
      console.error('Failed to delete wallet', err)
    }
  }

  const handleWalletsReorder = (ordered) => {
    setWallets(ordered)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <DashboardHeader user={user} />
      <main
        id="main-content"
        className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-5 sm:space-y-6"
        aria-labelledby="dashboard-heading"
      >
        <h1 id="dashboard-heading" className="sr-only">
          Dashboard
        </h1>

        <HeroAddEntry userName={user?.name} onClick={goAddEntry} />

        <QuickActionStrip
          onAddEntry={goAddEntry}
          onTransfer={goAddEntry}
          onSummary={() => navigate('/personalSummary')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
            <FriendsTile
              friends={friends}
              onView={() => navigate('/friends')}
              onSelect={(friend) => navigate(`/friends/${friend.id}`)}
            />
            <GroupsTile
              groups={groups}
              onView={() => navigate('/groups')}
              onSelect={(group) => navigate(`/groups/${group.id}`)}
            />
            <WalletsTile
              wallets={orderedWallets}
              walletsLoading={walletsLoading}
              total={walletTotal}
              userId={userId}
              onView={() => navigate('/personalExpense')}
              onAddWallet={() => setShowAddWallet(true)}
              onWalletsReorder={handleWalletsReorder}
              onEditWallet={(w) => {
                setEditWallet(w)
                setShowAddWallet(true)
              }}
              onDeleteWallet={(w) => {
                setWalletToDelete(w)
                setShowDeleteModal(true)
              }}
            />
          </div>

          <aside
            className="flex flex-col gap-5 sm:gap-6"
            aria-label="Invites and account utilities"
          >
            <SendInviteTile/>
            <StripeTile
              connected={!!stripeAccountId}
              onManage={() => navigate('/stripe/connect')}
            />
          </aside>
        </div>
      </main>

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
        message={
          walletToDelete
            ? `Are you sure you want to delete "${walletToDelete.walletName}"? This cannot be undone.`
            : ''
        }
        type="warning"
        confirmText="Confirm Delete"
        showCancel
        cancelText="Cancel"
        onConfirm={handleDeleteWallet}
      />
    </div>
  )
}
