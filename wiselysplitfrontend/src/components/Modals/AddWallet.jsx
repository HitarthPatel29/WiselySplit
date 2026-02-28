import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import InputField from '../IO/InputField'
import { WALLET_COLORS } from '../../constants/walletColors'

export default function AddWallet({ isOpen, onClose, onAdd, editWallet = null, onEdit }) {
  const modalRef = useRef(null)
  const isEdit = !!editWallet
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('emerald')

  useEffect(() => {
    if (isOpen) {
      if (editWallet) {
        setName(editWallet.name || '')
        setBalance(String(editWallet.balance ?? ''))
        setColor(editWallet.color || 'emerald')
      } else {
        setName('')
        setBalance('')
        setColor('emerald')
      }
    }
  }, [isOpen, editWallet])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      if (firstElement) firstElement.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
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

  const handleSubmit = () => {
    const balanceNum = parseFloat(balance)
    if (!name.trim()) return
    const data = {
      name: name.trim(),
      balance: isNaN(balanceNum) ? 0 : balanceNum,
      color,
    }
    if (isEdit && onEdit) {
      onEdit(editWallet.id, data)
    } else {
      onAdd(data)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4"
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-wallet-modal-title"
        className="bg-gray-100 dark:bg-gray-800 w-full max-w-md rounded-xl p-6 shadow-2xl shadow-black relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="add-wallet-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Wallet' : 'Add Wallet / Card / Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <InputField
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Main Wallet, Credit Card"
          id="wallet-name"
        />

        <InputField
          label="Current Balance"
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0.00"
          id="wallet-balance"
          step="0.01"
        />

        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-900 dark:text-gray-100">
            Card Color
          </label>
          <div className="flex flex-wrap gap-2">
            {WALLET_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                aria-pressed={color === c.id}
                aria-label={`Select ${c.name} color`}
                className={`w-10 h-10 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                  color === c.id
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <span
                  className={`block w-full h-full rounded-md bg-gradient-to-br ${c.gradient}`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
