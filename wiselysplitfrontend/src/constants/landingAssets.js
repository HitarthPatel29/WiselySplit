/**
 * Landing page media paths (served from public/landing/).
 * Drop files into public/landing/; set USE_LANDING_ASSETS to true to enable.
 */
export const USE_LANDING_ASSETS = true

const landing = (name) => `/landing/${name}`

export const LANDING_ASSET_PATHS = {
  unified: {
    videoSrc: landing('Shared+Personal.webm'),
  },
  wallets: {
    videoSrc: landing('Wallet_Crousel.webm'),
  },
  split: {
    videoSrc: landing('ExpenseSplit.webm'),
  },
  import: {
    videoSrc: landing('CSV_Import.webm'),
  },
  apple: {
    imageSrc: landing('AppleAutomation.png'),
  },
  classifier: {
    videoSrc: landing('ClassifierModel.webm'),
  },
  summary: {
    videoSrc: landing('Summaries.webm'),
  },
}

export function withLandingAssets(feature) {
  if (!USE_LANDING_ASSETS) return feature
  const assets = LANDING_ASSET_PATHS[feature.id]
  if (!assets) return feature
  return { ...feature, ...assets }
}
