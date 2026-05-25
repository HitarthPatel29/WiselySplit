import React, { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/solid'
import { WALLET_COLOR_MAP } from '../../constants/walletColors'
import { getWalletId } from '../../utils/walletOrderStorage'

function SortableWalletRow({ wallet }) {
  const id = getWalletId(wallet)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const colorKey = wallet.walletColor || wallet.color
  const colorClasses = colorKey && WALLET_COLOR_MAP[colorKey]
    ? `bg-gradient-to-br ${WALLET_COLOR_MAP[colorKey]}`
    : 'bg-gradient-to-br from-emerald-400 to-emerald-700'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 ${
        isDragging ? 'shadow-lg opacity-90 z-10' : ''
      }`}
    >
      <button
        type="button"
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label={`Drag to reorder ${wallet.walletName ?? wallet.name}`}
        {...attributes}
        {...listeners}
      >
        <Bars3Icon className="w-5 h-5" aria-hidden="true" />
      </button>
      <span
        className={`w-10 h-10 rounded-lg shrink-0 ${colorClasses}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {wallet.walletName ?? wallet.name ?? 'Wallet'}
        </p>
        {wallet.cardName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {wallet.cardName}
          </p>
        )}
      </div>
    </li>
  )
}

export default function ReorderWalletsModal({ isOpen, onClose, wallets = [], onSave }) {
  const modalRef = useRef(null)
  const [items, setItems] = useState([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (isOpen) {
      setItems([...wallets])
    }
  }, [isOpen, wallets])

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

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable[0]
      if (first) first.focus()
    }
  }, [isOpen])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((w) => getWalletId(w) === active.id)
      const newIndex = prev.findIndex((w) => getWalletId(w) === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleSave = () => {
    onSave(items)
    onClose()
  }

  if (!isOpen) return null

  const sortableIds = items.map(getWalletId).filter((id) => id != null)

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
        aria-labelledby="reorder-wallets-modal-title"
        className="bg-gray-100 dark:bg-gray-800 w-full max-w-md rounded-xl p-6 shadow-2xl shadow-black relative animate-fadeIn max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 id="reorder-wallets-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Reorder Wallets
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 shrink-0">
          Drag wallets to change their order in the carousel. The first wallet appears when you open this page.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
              {items.map((wallet) => (
                <SortableWalletRow key={getWalletId(wallet)} wallet={wallet} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="flex gap-3 mt-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            Save order
          </button>
        </div>
      </div>
    </div>
  )
}
