import React, { createContext, useContext, useState, useCallback } from 'react'
import AlertModal from '../components/Modals/AlertModal'
import Snackbar from '../components/Modals/Snackbar'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [alert, setAlert] = useState(null)
  const [snackbar, setSnackbar] = useState(null)

  const showAlert = useCallback(
    ({ title, message, type = 'info', confirmText, onConfirm, showCancel, cancelText }) => {
      return new Promise((resolve) => {
        setAlert({
          isOpen: true,
          title,
          message,
          type,
          confirmText,
          onConfirm: () => {
            if (onConfirm) onConfirm()
            resolve(true)
          },
          showCancel,
          cancelText,
          onClose: () => {
            setAlert(null)
            resolve(false)
          },
        })
      })
    },
    []
  )

  const showSnackbar = useCallback(
    ({ message, type = 'info', duration = 4000, position = 'top-center' }) => {
      setSnackbar({
        isOpen: true,
        message,
        type,
        duration,
        position,
        onClose: () => setSnackbar(null),
      })
    },
    []
  )

  // Helper methods for common use cases
  const showSuccess = useCallback(
    (message, options = {}) => {
      if (options.asSnackbar) {
        showSnackbar({ message, type: 'success', ...options })
      } else {
        showAlert({ message, type: 'success', title: 'Success', ...options })
      }
    },
    [showAlert, showSnackbar]
  )

  const showError = useCallback(
    (message, options = {}) => {
      if (options.asSnackbar) {
        showSnackbar({ message, type: 'error', ...options })
      } else {
        showAlert({ message, type: 'error', title: 'Error', ...options })
      }
    },
    [showAlert, showSnackbar]
  )

  const showInfo = useCallback(
    (message, options = {}) => {
      if (options.asSnackbar) {
        showSnackbar({ message, type: 'info', ...options })
      } else {
        showAlert({ message, type: 'info', title: 'Information', ...options })
      }
    },
    [showAlert, showSnackbar]
  )

  const showWarning = useCallback(
    (message, options = {}) => {
      if (options.asSnackbar) {
        showSnackbar({ message, type: 'warning', ...options })
      } else {
        showAlert({ message, type: 'warning', title: 'Warning', ...options })
      }
    },
    [showAlert, showSnackbar]
  )

  const value = {
    showAlert,
    showSnackbar,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {alert && <AlertModal {...alert} />}
      {snackbar && <Snackbar {...snackbar} />}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

