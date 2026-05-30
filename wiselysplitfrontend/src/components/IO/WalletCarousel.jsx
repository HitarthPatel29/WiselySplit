import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/solid'
import WalletCard from './WalletCard.jsx'
import ReorderWalletsModal from '../Modals/ReorderWalletsModal.jsx'
import {
  getWalletId,
  setWalletOrder,
  walletIdsFromList,
} from '../../utils/walletOrderStorage.js'

const SWIPE_THRESHOLD = 60
const LAYER_SPACING = 80

export default function WalletCarousel({
  wallets = [],
  loading = false,
  userId,
  activeWalletIndex: activeWalletIndexProp,
  onActiveWalletChange,
  onWalletsReorder,
  onEdit,
  onDelete,
  emptyMessage = 'No wallets yet. Add one using the button above.',
  className = '',
}) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0)
  const isControlled = activeWalletIndexProp !== undefined
  const activeWalletIndex = isControlled ? activeWalletIndexProp : internalActiveIndex

  const setActiveWalletIndex = useCallback(
    (updater) => {
      const nextIndex =
        typeof updater === 'function' ? updater(activeWalletIndex) : updater
      const clamped = Math.min(Math.max(0, nextIndex), Math.max(0, wallets.length - 1))
      if (clamped === activeWalletIndex) return
      if (!isControlled) setInternalActiveIndex(clamped)
      onActiveWalletChange?.(clamped)
    },
    [activeWalletIndex, isControlled, onActiveWalletChange, wallets.length]
  )
  const [dragOffset, setDragOffset] = useState(0)
  const dragOffsetRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [openMenuWalletId, setOpenMenuWalletId] = useState(null)
  const [showReorderWallets, setShowReorderWallets] = useState(false)
  const dragStartRef = useRef({ x: 0 })
  const isDraggingRef = useRef(false)
  const containerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (isControlled) return
    setInternalActiveIndex((i) => Math.min(i, Math.max(0, wallets.length - 1)))
  }, [wallets.length, isControlled])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuWalletId(null)
      }
    }
    if (openMenuWalletId != null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuWalletId])

  const goToPrev = useCallback(() => {
    setActiveWalletIndex((i) => Math.max(0, i - 1))
  }, [setActiveWalletIndex])

  const goToNext = useCallback(() => {
    setActiveWalletIndex((i) => Math.min(wallets.length - 1, i + 1))
  }, [setActiveWalletIndex, wallets.length])

  const getOffsetForWallet = useCallback(
    (walletIndex) => walletIndex - activeWalletIndex,
    [activeWalletIndex]
  )

  const getScaleForOffset = (offset) => {
    const abs = Math.abs(offset)
    if (abs === 0) return 1
    return Math.max(0.55, 1 - abs * 0.12)
  }

  const handleDragStart = useCallback((clientX) => {
    setIsDragging(true)
    isDraggingRef.current = true
    dragStartRef.current = { x: clientX }
    dragOffsetRef.current = 0
    setDragOffset(0)
  }, [])

  const handleDragMove = useCallback((clientX) => {
    if (!isDraggingRef.current) return
    const delta = clientX - dragStartRef.current.x
    const maxDrag = containerRef.current?.offsetWidth ? containerRef.current.offsetWidth * 0.4 : 150
    const clamped = Math.max(-maxDrag, Math.min(maxDrag, delta))
    dragOffsetRef.current = clamped
    setDragOffset(clamped)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)

    const current = dragOffsetRef.current
    if (Math.abs(current) > SWIPE_THRESHOLD) {
      if (current > 0 && activeWalletIndex > 0) goToPrev()
      else if (current < 0 && activeWalletIndex < wallets.length - 1) goToNext()
    }

    dragOffsetRef.current = 0
    setDragOffset(0)
  }, [goToPrev, goToNext, activeWalletIndex, wallets.length])

  const handleTouchStart = (e) => handleDragStart(e.touches[0].clientX)
  const handleTouchEnd = () => handleDragEnd()
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }

  useEffect(() => {
    if (!isDragging) return
    const onMouseMove = (e) => handleDragMove(e.clientX)
    const onMouseUp = () => handleDragEnd()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  const carouselMounted = !loading && wallets.length > 0
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onTouchMove = (e) => {
      if (isDraggingRef.current) e.preventDefault()
      handleDragMove(e.touches[0].clientX)
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [handleDragMove, carouselMounted])

  const handleReorderWalletsSave = (orderedWallets) => {
    const activeId = wallets[activeWalletIndex] ? getWalletId(wallets[activeWalletIndex]) : null
    if (userId) setWalletOrder(userId, walletIdsFromList(orderedWallets))
    onWalletsReorder?.(orderedWallets)
    if (activeId != null) {
      const newIndex = orderedWallets.findIndex((w) => getWalletId(w) === activeId)
      if (newIndex >= 0) setActiveWalletIndex(newIndex)
    }
  }

  return (
    <>
      <section className={`relative min-h-[180px] flex flex-col justify-between ${className}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm py-8">
            Loading wallets...
          </div>
        ) : wallets.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-center text-sm px-4 py-8">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="flex justify-end w-full relative z-40 h-8">
              {wallets.length > 1 && (
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setShowReorderWallets(true)}
                    className="p-1.5 rounded-lg bg-white/95 dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    aria-label="Reorder wallets"
                  >
                    <EllipsisHorizontalIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" aria-hidden="true" />
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                  >
                    Reorder wallets
                  </span>
                </div>
              )}
            </div>

            <div
              ref={containerRef}
              className="relative flex-1 min-h-[140px] flex items-center justify-center touch-none select-none overflow-x-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {wallets.map((wallet, idx) => {
                const offset = getOffsetForWallet(idx)
                const isActive = offset === 0
                const scale = getScaleForOffset(offset)
                const zIndex = 10 - Math.abs(offset)
                const translateX = offset * LAYER_SPACING + (isActive ? dragOffset : 0)
                const walletId = wallet.walletId ?? wallet.id

                return (
                  <WalletCard
                    key={walletId}
                    wallet={wallet}
                    openMenuId={openMenuWalletId}
                    onMenuToggle={(id) => setOpenMenuWalletId((prev) => (prev === id ? null : id))}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    menuRef={menuRef}
                    isDragging={isDragging}
                    isActive={offset === 0}
                    onMouseDown={offset === 0 ? handleMouseDown : undefined}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: '240px',
                      transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
                      zIndex,
                      transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                      transformOrigin: 'center',
                    }}
                  />
                )
              })}

              {wallets.length > 1 && (
                <>
                  {activeWalletIndex > 0 && (
                    <button
                      type="button"
                      onClick={goToPrev}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/95 dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                      aria-label="Previous wallet"
                    >
                      <ChevronLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                  )}
                  {activeWalletIndex < wallets.length - 1 && (
                    <button
                      type="button"
                      onClick={goToNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/95 dark:bg-gray-800 shadow-lg hover:scale-110 active:scale-95 transition-transform"
                      aria-label="Next wallet"
                    >
                      <ChevronRightIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 min-h-[20px] max-h-[20px]">
              {wallets.length > 1 &&
                wallets.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveWalletIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeWalletIndex ? 'bg-emerald-500 w-6' : 'bg-gray-400/60 w-2 hover:bg-gray-400/80'
                    }`}
                    aria-label={`Go to wallet ${i + 1}`}
                  />
                ))}
            </div>
          </>
        )}
      </section>

      <ReorderWalletsModal
        isOpen={showReorderWallets}
        onClose={() => setShowReorderWallets(false)}
        wallets={wallets}
        onSave={handleReorderWalletsSave}
      />
    </>
  )
}
