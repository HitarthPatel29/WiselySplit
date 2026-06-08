//InviteNotifications.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import Header from '../../components/Header.jsx'
import InviteCard from '../../components/invite/InviteCard.jsx'

export default function InviteNotifications() {
  const { userId } = useAuth()
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState('received')
  const [respondingId, setRespondingId] = useState(null)

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await api.get(`/invite/user/${userId}`)
        setInvites(res.data || [])
      } catch (err) {
        console.error(err)
        setMessage(err.response?.data?.error || 'Failed to fetch invites.')
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchInvites()
  }, [userId])

  const handleRespond = async (inviteId, status) => {
    const previous = invites
    setRespondingId(inviteId)
    // Optimistically update UI right away
    setInvites((prev) =>
      prev.map((invite) =>
        invite.InviteID === inviteId ? { ...invite, Status: status } : invite
      )
    )

    try {
      await api.put(`/invite/${inviteId}/status`, { status })
    } catch (err) {
      console.error(err)
      setInvites(previous) // revert on failure
      setMessage(err.response?.data?.error || 'Failed to update invite.')
    } finally {
      setRespondingId(null)
    }
  }

  const isPendingActive = (inv) => {
    const status = (inv.Status || '').toUpperCase()
    const daysLeft = Number(inv.daysLeft ?? 0)
    return status === 'PENDING' && daysLeft > 0
  }

  // Sort: actionable/pending first, then everything else (already CreatedAt DESC from API)
  const sortInvites = (list) =>
    [...list].sort((a, b) => Number(isPendingActive(b)) - Number(isPendingActive(a)))

  const { received, sent } = useMemo(() => {
    const received = sortInvites(invites.filter((i) => i.SenderID !== userId))
    const sent = sortInvites(invites.filter((i) => i.SenderID === userId))
    return { received, sent }
  }, [invites, userId])

  const activeList = tab === 'received' ? received : sent

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Invite Notifications" />
        <div
          className="flex items-center justify-center p-6"
          role="status"
          aria-live="polite"
          aria-label="Loading invites"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" aria-hidden="true"></div>
            <p className="sr-only">Loading invites...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Invite Notifications" />
      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          {/* Segmented tabs */}
          <div
            className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-5"
            role="tablist"
            aria-label="Invite categories"
          >
            <button
              role="tab"
              aria-selected={tab === 'received'}
              onClick={() => setTab('received')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                tab === 'received'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Received ({received.length})
            </button>
            <button
              role="tab"
              aria-selected={tab === 'sent'}
              onClick={() => setTab('sent')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                tab === 'sent'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Sent ({sent.length})
            </button>
          </div>

          {message && (
            <p
              className="mb-4 text-center text-sm text-rose-600 dark:text-rose-400"
              role="alert"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <div className="space-y-4" role="list">
            {activeList.map((invite) => (
              <div key={invite.InviteID} role="listitem">
                <InviteCard
                  invite={invite}
                  currentUserId={userId}
                  onRespond={handleRespond}
                  respondingId={respondingId}
                />
              </div>
            ))}

            {activeList.length === 0 && (
              <p
                className="text-gray-500 dark:text-gray-400 text-center mt-10"
                role="status"
                aria-live="polite"
              >
                {tab === 'received'
                  ? 'No invites received yet.'
                  : "You haven't sent any invites."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
