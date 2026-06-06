// src/pages/admin/AdminPanel.jsx
// Admin console for account & role management (RBAC).

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowPathIcon,
  CpuChipIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'
import Header from '../../components/Header.jsx'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'

const ROLES = ['ADMIN', 'TEST_PROFILE', 'USER']
const PAGE_SIZE = 10

const inputClass =
  'w-full appearance-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'

function formatTimestamp(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          {Icon ? <Icon className="w-5 h-5 text-emerald-500" aria-hidden /> : null}
          <h2 className="font-semibold">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      {hint ? <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</span> : null}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" aria-hidden />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      {children}
    </label>
  )
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const { showSuccess, showError, showAlert } = useNotification()
  const { currentUser } = useAuth()
  const myId = currentUser?.userId ?? null

  const [stats, setStats] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [rowBusy, setRowBusy] = useState(null) // userId currently mutating

  const [audit, setAudit] = useState([])
  const [showAudit, setShowAudit] = useState(false)

  // Modal state: { mode: 'create' | 'edit' | 'reset', account? }
  const [modal, setModal] = useState(null)

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats')
      setStats(data)
    } catch (e) {
      console.error('Failed to load admin stats', e)
    }
  }, [])

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    try {
      const params = { page, size: PAGE_SIZE }
      if (roleFilter) params.role = roleFilter
      if (search) params.search = search
      const { data } = await api.get('/admin/accounts', { params })
      setAccounts(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch (e) {
      console.error('Failed to load accounts', e)
      showError(e.response?.data?.error || 'Failed to load accounts', { asSnackbar: true })
    } finally {
      setLoadingAccounts(false)
    }
  }, [page, roleFilter, search, showError])

  const loadAudit = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/audit', { params: { limit: 25, offset: 0 } })
      setAudit(data.rows || [])
    } catch (e) {
      console.error('Failed to load audit log', e)
    }
  }, [])

  useEffect(() => {
    loadStats()
    loadAudit()
  }, [loadStats, loadAudit])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadAccounts(), loadAudit()])
    setRefreshing(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const afterMutation = async () => {
    await Promise.all([loadStats(), loadAccounts(), loadAudit()])
  }

  const handleRoleChange = (account, newRole) => {
    if (newRole === account.role) return
    showAlert({
      title: 'Change role?',
      message: `Set ${account.email} from ${account.role} to ${newRole}?`,
      type: 'warning',
      confirmText: 'Change role',
      showCancel: true,
      onConfirm: async () => {
        setRowBusy(account.userId)
        try {
          await api.patch(`/admin/accounts/${account.userId}/role`, { role: newRole })
          showSuccess(`${account.email} is now ${newRole}`, { asSnackbar: true })
          await afterMutation()
        } catch (err) {
          showError(err.response?.data?.error || 'Failed to change role', { asSnackbar: true })
        } finally {
          setRowBusy(null)
        }
      },
    })
  }

  const handleDelete = (account) => {
    showAlert({
      title: 'Delete account?',
      message: `Permanently delete ${account.email}? This cannot be undone.`,
      type: 'error',
      confirmText: 'Delete',
      showCancel: true,
      onConfirm: async () => {
        setRowBusy(account.userId)
        try {
          await api.delete(`/admin/accounts/${account.userId}`)
          showSuccess(`Deleted ${account.email}`, { asSnackbar: true })
          await afterMutation()
        } catch (err) {
          showError(err.response?.data?.error || 'Failed to delete account', { asSnackbar: true })
        } finally {
          setRowBusy(null)
        }
      },
    })
  }

  const byRole = stats?.byRole || {}

  return (
    <div className="min-h-screen">
      <Header title="Admin Panel" />
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-5 flex flex-col gap-5" role="main">
        {/* Overview */}
        <SectionCard
          title="Overview"
          icon={ShieldCheckIcon}
          action={
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Total accounts" value={stats?.total ?? '—'} hint="All registered users" />
            <Stat label="Admins" value={byRole.ADMIN ?? '—'} hint="Full access" />
            <Stat label="Test profiles" value={byRole.TEST_PROFILE ?? '—'} hint="000000 OTP allowed" />
            <Stat label="Users" value={byRole.USER ?? '—'} hint="Generated OTP only" />
          </div>
        </SectionCard>

        {/* Quick link to Classifier Admin */}
        <button
          type="button"
          onClick={() => navigate('/admin/classifier')}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-5 py-4 text-left hover:border-emerald-400 hover:shadow transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <CpuChipIcon className="w-6 h-6 text-emerald-500" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Classifier Admin</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inspect, retrain and curate the expense-category model.
              </p>
            </div>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition" aria-hidden />
        </button>

        {/* Accounts */}
        <SectionCard
          title="Accounts"
          icon={UsersIcon}
          action={
            <button
              type="button"
              onClick={() => setModal({ mode: 'create' })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white text-sm font-medium px-3 py-1.5 hover:bg-emerald-600 transition"
            >
              <PlusIcon className="w-4 h-4" aria-hidden />
              New account
            </button>
          }
        >
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[12rem] flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, username or email"
                className={inputClass}
                aria-label="Search accounts"
              />
              <button
                type="submit"
                className="rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Search
              </button>
            </form>
            <select
              value={roleFilter}
              onChange={(e) => {
                setPage(0)
                setRoleFilter(e.target.value)
              }}
              className="appearance-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400"
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {loadingAccounts ? (
            <div role="status" aria-live="polite" className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" aria-hidden />
              <p className="mt-2">Loading accounts…</p>
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">No accounts match your filters.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Role</th>
                      <th className="py-2 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => {
                      const isSelf = myId != null && acc.userId === myId
                      const busy = rowBusy === acc.userId
                      return (
                        <tr key={acc.userId} className="border-b border-gray-100 dark:border-gray-800 last:border-0 align-middle">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              {acc.profilePicture ? (
                                <img src={acc.profilePicture} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700">
                                  <UserIcon className="w-4 h-4 text-gray-500" aria-hidden />
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {acc.name}
                                  {isSelf ? <span className="ml-1 text-xs text-gray-400">(you)</span> : null}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{acc.userName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-gray-700 dark:text-gray-200 max-w-[14rem] truncate">{acc.email}</td>
                          <td className="py-2 pr-3">
                            <select
                              value={acc.role}
                              disabled={busy || isSelf}
                              onChange={(e) => handleRoleChange(acc, e.target.value)}
                              className="appearance-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                              title={isSelf ? 'You cannot change your own role' : 'Change role'}
                              aria-label={`Role for ${acc.email}`}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-0">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setModal({ mode: 'edit', account: acc })}
                                disabled={busy}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
                                title="Edit account"
                                aria-label={`Edit ${acc.email}`}
                              >
                                <PencilSquareIcon className="w-4 h-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => setModal({ mode: 'reset', account: acc })}
                                disabled={busy}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                                title="Reset password"
                                aria-label={`Reset password for ${acc.email}`}
                              >
                                <KeyIcon className="w-4 h-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(acc)}
                                disabled={busy || isSelf}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isSelf ? 'You cannot delete your own account' : 'Delete account'}
                                aria-label={`Delete ${acc.email}`}
                              >
                                <TrashIcon className="w-4 h-4" aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {page + 1} of {totalPages} · {total} account{total === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= totalPages}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </SectionCard>

        {/* Audit log */}
        <SectionCard
          title="Audit log"
          icon={ClipboardDocumentListIcon}
          action={
            <button
              type="button"
              onClick={() => setShowAudit((v) => !v)}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {showAudit ? 'Hide' : 'Show'}
            </button>
          }
        >
          {!showAudit ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {audit.length} recent admin action{audit.length === 1 ? '' : 's'} recorded.
            </p>
          ) : audit.length === 0 ? (
            <p className="text-sm italic text-gray-400 dark:text-gray-500">No admin actions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Actor</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((row) => (
                    <tr key={row.Id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTimestamp(row.CreatedAt)}
                      </td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-200 max-w-[12rem] truncate">
                        {row.ActorEmail ?? row.ActorUserId ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">{row.Action}</td>
                      <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 tabular-nums">{row.TargetUserId ?? '—'}</td>
                      <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 max-w-[18rem] truncate">{row.Details ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </main>

      {modal?.mode === 'create' && (
        <AccountFormModal
          title="Create account"
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null)
            await afterMutation()
          }}
        />
      )}
      {modal?.mode === 'edit' && (
        <AccountFormModal
          title="Edit account"
          account={modal.account}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null)
            await afterMutation()
          }}
        />
      )}
      {modal?.mode === 'reset' && (
        <ResetPasswordModal
          account={modal.account}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}
    </div>
  )
}

function AccountFormModal({ title, account, onClose, onSaved }) {
  const { showSuccess, showError } = useNotification()
  const isEdit = !!account
  const [form, setForm] = useState({
    name: account?.name || '',
    userName: account?.userName || '',
    email: account?.email || '',
    phoneNum: account?.phoneNum != null ? String(account.phoneNum) : '',
    password: '',
    role: account?.role || 'USER',
  })
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        userName: form.userName,
        email: form.email,
        role: form.role,
      }
      if (form.phoneNum.trim()) payload.phoneNum = form.phoneNum.trim()
      if (form.password.trim()) payload.password = form.password.trim()

      if (isEdit) {
        await api.put(`/admin/accounts/${account.userId}`, payload)
        showSuccess('Account updated', { asSnackbar: true })
      } else {
        await api.post('/admin/accounts', payload)
        showSuccess('Account created', { asSnackbar: true })
      }
      await onSaved()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save account', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Name">
          <input className={inputClass} value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Username">
          <input className={inputClass} value={form.userName} onChange={set('userName')} required />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email} onChange={set('email')} required />
        </Field>
        <Field label="Phone number (optional)">
          <input className={inputClass} value={form.phoneNum} onChange={set('phoneNum')} inputMode="numeric" />
        </Field>
        <Field label="Role">
          <select className={inputClass} value={form.role} onChange={set('role')}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label={isEdit ? 'New password (leave blank to keep current)' : 'Password'}>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={set('password')}
            required={!isEdit}
            autoComplete="new-password"
            placeholder={isEdit ? '••••••••' : ''}
          />
        </Field>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Passwords must include upper, lower, digit, special and be 8+ characters.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-500 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-600 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ account, onClose, onSaved }) {
  const { showSuccess, showError } = useNotification()
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/admin/accounts/${account.userId}/reset-password`, { newPassword: password.trim() })
      showSuccess(`Password reset for ${account.email}`, { asSnackbar: true })
      onSaved()
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reset password', { asSnackbar: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Reset password — ${account.email}`} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="New password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Must include upper, lower, digit, special and be 8+ characters.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-amber-500 text-white text-sm font-medium px-4 py-2 hover:bg-amber-600 transition disabled:opacity-60"
          >
            {saving ? 'Resetting…' : 'Reset password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
