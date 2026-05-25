const STORAGE_PREFIX = 'wiselysplit.walletOrder'

export function getWalletId(wallet) {
  return wallet?.walletId ?? wallet?.id
}

export function getWalletOrderKey(userId) {
  return `${STORAGE_PREFIX}.${userId}`
}

export function getWalletOrder(userId) {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(getWalletOrderKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
  } catch {
    return []
  }
}

export function setWalletOrder(userId, walletIds) {
  if (!userId) return
  localStorage.setItem(getWalletOrderKey(userId), JSON.stringify(walletIds))
}

export function walletIdsFromList(wallets) {
  return (wallets || []).map(getWalletId).filter((id) => id != null)
}

/** Merge saved order with current wallets; drop removed ids; append new wallets at end. */
export function syncWalletOrderWithWallets(userId, wallets) {
  const ids = walletIdsFromList(wallets)
  if (!ids.length) {
    if (userId) setWalletOrder(userId, [])
    return []
  }
  const saved = getWalletOrder(userId)
  const idSet = new Set(ids)
  const ordered = saved.filter((id) => idSet.has(id))
  const appended = ids.filter((id) => !ordered.includes(id))
  const merged = [...ordered, ...appended]
  setWalletOrder(userId, merged)
  return merged
}

export function applyWalletOrder(wallets, savedIds) {
  if (!wallets?.length) return []
  if (!savedIds?.length) return wallets
  const byId = new Map(wallets.map((w) => [getWalletId(w), w]))
  const ordered = savedIds.map((id) => byId.get(id)).filter(Boolean)
  const savedSet = new Set(savedIds)
  const rest = wallets.filter((w) => !savedSet.has(getWalletId(w)))
  return [...ordered, ...rest]
}
