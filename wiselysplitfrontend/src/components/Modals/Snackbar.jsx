import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Snackbar({
  isOpen,
  onClose,
  message,
  type = 'info', // 'info' | 'success' | 'error' | 'warning'
  duration = 4000,
  position = 'top-center', // 'bottom-right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  const typeStyles = {
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ️',
    },
    success: {
      bg: 'bg-emerald-500',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
    },
  }

  const styles = typeStyles[type] || typeStyles.info

  return createPortal(
    <div
      className={`fixed ${positionClasses[position]} z-50 animate-fadeIn`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        className={`flex items-center gap-3 rounded-xl ${styles.bg} px-4 py-3 shadow-lg text-white min-w-[300px] max-w-md`}
      >
        <span className="text-xl" aria-hidden="true">{styles.icon}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
          aria-label="Close notification"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>,
    document.body
  )
}

