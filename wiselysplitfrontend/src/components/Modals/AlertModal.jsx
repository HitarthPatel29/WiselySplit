import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'error' | 'warning'
  confirmText = 'OK',
  onConfirm,
  showCancel = false,
  cancelText = 'Cancel',
}) {
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)
  const confirmButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus trap - focus first focusable element
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      if (firstElement) {
        firstElement.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const typeStyles = {
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      role: 'dialog',
    },
    success: {
      icon: '✓',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      role: 'alertdialog',
    },
    error: {
      icon: '✕',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
      button: 'bg-red-500 hover:bg-red-600 text-white',
      role: 'alertdialog',
    },
    warning: {
      icon: '⚠',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      role: 'alertdialog',
    },
  }

  const styles = typeStyles[type] || typeStyles.info

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        role={styles.role}
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby="modal-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
            aria-hidden="true"
          >
            <span className={`text-2xl font-semibold ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1">
            {title && (
              <h3 
                id="modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h3>
            )}
            <p 
              id="modal-description"
              className="mt-2 text-sm text-gray-600 dark:text-gray-400"
            >
              {message}
            </p>

            {/* Actions */}
            <div className="mt-6 flex gap-3 justify-end">
              {showCancel && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  {cancelText}
                </button>
              )}
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirm}
                className={`rounded-xl px-4 py-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
              >
                {confirmText}
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
            aria-label="Close modal"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

