import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { formatCurrency } from '../../utils/settleUp.js'

export default function MemberSelectModal({
  open,
  members = [],
  onClose,
  onSelect,
}) {
  const modalRef = useRef(null)
  const firstButtonRef = useRef(null)

  // Filter members you owe money to (negative balance)
  const membersToSettle = members.filter((m) => m.balance < 0)

  useEffect(() => {
    if (open && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      if (firstElement) {
        firstElement.focus()
      }
    }
  }, [open])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  const handleSelect = (member) => {
    onSelect(member)
    onClose()
  }

  return createPortal(
    <div
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4'
      role="presentation"
      aria-hidden={!open}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900'
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-select-title"
        aria-describedby="member-select-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start justify-between'>
          <div>
            <h3
              id="member-select-title"
              className='text-xl font-semibold text-gray-900 dark:text-gray-100'
            >
              Select Member to Settle Up
            </h3>
            <p
              id="member-select-description"
              className='mt-1 text-sm text-gray-500 dark:text-gray-400'
            >
              Choose a member you owe money to
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded'
            aria-label='Close member selection modal'
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className='mt-5 max-h-96 overflow-y-auto'>
          {membersToSettle.length === 0 ? (
            <p
              className='text-center text-gray-500 dark:text-gray-400 py-8'
              role="status"
            >
              No members to settle up with. You're all settled!
            </p>
          ) : (
            <div className='space-y-2' role="list">
              {membersToSettle.map((member) => {
                const owedAmount = Math.abs(member.balance)
                return (
                  <button
                    key={member.userId}
                    type='button'
                    onClick={() => handleSelect(member)}
                    className='w-full rounded-xl border border-gray-600 dark:border-gray-400 px-4 py-3 text-left transition hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400'
                    role="listitem"
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900 dark:text-gray-100'>
                          {member.name}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
                          You owe {formatCurrency(owedAmount)}
                        </p>
                      </div>
                      <span
                        className='text-emerald-600 dark:text-emerald-400 font-semibold'
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className='mt-6'>
          <button
            type='button'
            onClick={onClose}
            className='w-full border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl py-3 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-gray-400'
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

