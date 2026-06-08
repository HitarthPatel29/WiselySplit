// src/components/invite/InviteCard.jsx
import React from 'react'
import { UserGroupIcon } from '@heroicons/react/24/solid'

const DEFAULT_AVATAR =
  'https://res.cloudinary.com/dwq5yfjsd/image/upload/v1758920140/default-avatar-profile_esweq0.webp'

function StatusBadge({ status }) {
  const styles = {
    PENDING:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    WAITING:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    ACCEPTED:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    REJECTED:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    EXPIRED:
      'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300',
  }
  const labels = {
    PENDING: 'Pending',
    WAITING: 'Waiting',
    ACCEPTED: 'Accepted',
    REJECTED: 'Declined',
    EXPIRED: 'Expired',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
        styles[status] || styles.EXPIRED
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

export default function InviteCard({ invite, currentUserId, onRespond, respondingId }) {
  const status = (invite.Status || '').toUpperCase()
  const isSender = invite.SenderID === currentUserId
  const isGroup = (invite.Type || '').toUpperCase() === 'GROUP'
  const daysAgo = Number(invite.daysAgo ?? 0)
  const daysLeft = Number(invite.daysLeft ?? 0)
  const isExpired = status === 'EXPIRED' || daysLeft <= 0
  const isPending = status === 'PENDING'
  const canAct = !isSender && isPending && !isExpired
  const receiverExists = invite.ReceiverID != null
  const isResponding = respondingId === invite.InviteID

  const senderName = invite.SenderName || 'Someone'
  const receiverName = invite.ReceiverName || invite.ReceiverEmail || 'someone'
  const groupName = invite.GroupName || 'a group'

  // Avatar: group invite -> group picture; otherwise the "other" person's picture
  const personPic = isSender ? invite.ReceiverPicture : invite.SenderPicture
  const badgePic = invite.SenderPicture // sender mini-avatar shown on group cards

  // Effective status used for the badge (treat sub-day expiry as expired)
  const effectiveStatus = isPending && isExpired ? 'EXPIRED' : status
  const badgeStatus = isSender && effectiveStatus === 'PENDING' ? 'WAITING' : effectiveStatus

  let title = ''
  if (isGroup) {
    if (canAct) {
      title = `${senderName} invited you to join ${groupName}.`
    } else if (isSender && isPending && !isExpired) {
      title = `You invited ${receiverName} to join ${groupName}.`
    } else if (effectiveStatus === 'ACCEPTED') {
      title = isSender
        ? `${receiverName} joined ${groupName}.`
        : `You joined ${groupName}.`
    } else if (effectiveStatus === 'REJECTED') {
      title = isSender
        ? `${receiverName} declined to join ${groupName}.`
        : `You declined to join ${groupName}.`
    } else {
      title = isSender
        ? `Your invite to ${receiverName} for ${groupName} expired.`
        : `Invite to join ${groupName} expired.`
    }
  } else {
    if (canAct) {
      title = `${senderName} invited you to share expenses.`
    } else if (isSender && isPending && !isExpired) {
      title = receiverExists
        ? `You invited ${receiverName}.`
        : `You invited ${invite.ReceiverEmail} (not on WiselySplit yet).`
    } else if (effectiveStatus === 'ACCEPTED') {
      title = isSender
        ? `${receiverName} accepted your invite.`
        : `You and ${senderName} are now sharing expenses.`
    } else if (effectiveStatus === 'REJECTED') {
      title = isSender
        ? `${receiverName} declined your invite.`
        : `You declined ${senderName}'s invite.`
    } else {
      title = isSender
        ? `Your invite to ${receiverName} expired.`
        : `Invite from ${senderName} expired.`
    }
  }

  const metaTime = daysAgo <= 0 ? 'Today' : `${daysAgo}d ago`
  let metaExpiry = null
  if (isPending && !isExpired) {
    metaExpiry = daysLeft <= 1 ? 'Expires today' : `Expires in ${daysLeft} days`
  } else if (isPending && isExpired) {
    metaExpiry = 'Expired'
  }

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {isGroup ? (
          <>
            {invite.GroupPicture ? (
              <img
                src={invite.GroupPicture}
                alt={`${groupName} group`}
                className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                <UserGroupIcon className="w-7 h-7 text-purple-600 dark:text-purple-300" aria-hidden="true" />
              </div>
            )}
            <img
              src={badgePic || DEFAULT_AVATAR}
              alt={`${senderName} avatar`}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full object-cover border-2 border-white dark:border-gray-800"
            />
          </>
        ) : (
          <img
            src={personPic || DEFAULT_AVATAR}
            alt={`${isSender ? receiverName : senderName} avatar`}
            className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-grow min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{title}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {metaTime}
          {metaExpiry && <> &bull; {metaExpiry}</>}
        </p>

        {canAct ? (
          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={() => onRespond(invite.InviteID, 'ACCEPTED')}
              disabled={isResponding}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50"
            >
              {isResponding ? 'Working...' : 'Accept'}
            </button>
            <button
              onClick={() => onRespond(invite.InviteID, 'REJECTED')}
              disabled={isResponding}
              className="px-4 py-1.5 rounded-lg border border-rose-500 text-rose-500 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-400 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : null}
      </div>

      {/* Status badge */}
      {!canAct && (
        <div className="shrink-0 self-start">
          <StatusBadge status={badgeStatus} />
        </div>
      )}
    </div>
  )
}
