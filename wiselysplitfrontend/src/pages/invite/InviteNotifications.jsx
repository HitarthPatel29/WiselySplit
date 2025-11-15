//InviteNotifications.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'
import BackButton from '../../components/IO/BackButton'
import Header from '../../components/Header.jsx'

export default function InviteNotifications() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [invites, setInvites] = useState([])
  const [fadingIds, setFadingIds] = useState([]) // 👈 Track fading cards
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await api.get(`/invite/user/${userId}`)
        setInvites(res.data || [])
        if (res.data.length === 0) setMessage('No invites right now.')
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
    try {
      // Optimistically update UI right away
      setInvites((prev) =>
        prev.map((invite) =>
          invite.InviteID === inviteId ? { ...invite, Status: status, justUpdated: true } : invite
        )
      )

      // Send update to backend
      await api.put(`/invite/${inviteId}/status`, { status })

      // After animation (~2s), remove highlight
      setTimeout(() => {
        setInvites((prev) =>
          prev.map((invite) =>
            invite.InviteID === inviteId ? { ...invite, justUpdated: false } : invite
          )
        )
      }, 2000)
    } catch (err) {
      console.error(err)
      setMessage(err.response?.data?.error || 'Failed to update invite.')
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Loading invites...</div>

  return (
    
    <div className="flex justify-center px-4 py-6">
      <div className="w-full max-w-2xl space-y-5">
        
        <Header title='Invite Notifications' />
        {message && (
          <p className="mb-4 text-center text-sm text-gray-600">{message}</p>
        )}

        <div className="space-y-4">
          {invites.map((invite) => {
            const isFading = fadingIds.includes(invite.InviteID)
            const isSender = invite.SenderID === userId
            const receiverExists = invite.ReceiverID !== null && invite.ReceiverName !== null
            const otherUserName = isSender ? invite.ReceiverName : invite.SenderName
            const otherUserPic = isSender ? invite.ReceiverPicture : invite.SenderPicture
            const daysAgo = invite.daysAgo
            const daysLeft = invite.daysLeft
            const status = (invite.Status || '').toUpperCase()

            let displayMsg = ''
            let statusColor = ''
            let actionButtons = null

            if (!isSender && status === 'PENDING' && daysLeft > 0) {
              displayMsg = `${invite.SenderName} invited you to share expenses.`
              actionButtons = (
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={() => handleRespond(invite.InviteID, 'ACCEPTED')}
                    className="px-4 py-1 rounded-lg border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    Accept Invite
                  </button>
                  <button
                    onClick={() => handleRespond(invite.InviteID, 'REJECTED')}
                    className="px-4 py-1 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Reject Invite
                  </button>
                </div>
              )
            } else if (isSender && status === 'PENDING' && daysLeft > 0 && receiverExists) {
              displayMsg = `You invited ${invite.ReceiverName} to share expenses.`
              statusColor = 'text-blue-500'
            } else if (isSender && status === 'PENDING' && daysLeft > 0 && !receiverExists) {
              displayMsg = `You invited ${invite.ReceiverEmail} (not yet on WiselySplit).`
              statusColor = 'text-blue-500'
            } else if (status === 'ACCEPTED') {
              displayMsg = isSender
                ? `${otherUserName || 'User'} accepted your invite.`
                : `You accepted ${otherUserName || 'User'}'s invite.`
              statusColor = 'text-emerald-600'
            } else if (status === 'REJECTED') {
              displayMsg = isSender
                ? `${otherUserName || 'User'} rejected your invite.`
                : `You rejected ${otherUserName || 'User'}'s invite.`
              statusColor = 'text-red-500'
            } else if (status === 'EXPIRED' || daysLeft <= 0) {
              displayMsg = `Invite between you and ${otherUserName || 'User'} has expired.`
              statusColor = 'text-gray-400'
            }

            return (
              <div
                key={invite.InviteID}
                className={`flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 dark:border shadow-sm hover:shadow-md transition-all duration-500 ${
                  isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <img
                  src={
                    otherUserPic ||
                    'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'
                  }
                  alt={otherUserName}
                  className="w-14 h-14 rounded-full object-cover border mx-auto sm:mx-0"
                />

                <div className="flex flex-col flex-grow text-center sm:text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{displayMsg}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {daysAgo}d ago
                    {status === 'PENDING' && daysLeft > 0 && (
                      <> • Invite expires in {daysLeft} days</>
                    )}
                    {status === 'PENDING' && daysLeft <= 0 && <> • Invite expired</>}
                  </p>

                  {actionButtons ? (
                    actionButtons
                  ) : (
                    <p className={`mt-2 font-semibold ${statusColor}`}>
                      {status === 'PENDING' ? 'Decision Pending' : status}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}