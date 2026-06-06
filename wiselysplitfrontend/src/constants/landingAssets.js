/**
 * Landing page media paths (served from public/landing/).
 * Drop files into the matching folders; set USE_LANDING_ASSETS to true to enable.
 */
export const USE_LANDING_ASSETS = true

const desktop = (folder, name) => `/landing/${folder}/desktop/${name}`
const mobile = (folder, name) => `/landing/${folder}/mobile/${name}`

export const LANDING_ASSET_PATHS = {
  unified: {
    imageSrc: desktop('screenshots', 'Shared+Personal.png'),
    imageSrcMobile: desktop('screenshots', 'Shared+Personal.png'),
    videoSrc: desktop('videos', 'Shared+Personal.mov'),
    videoSrcMobile: desktop('videos', 'Shared+Personal.mov'),
    posterSrc: desktop('screenshots', 'Shared+Personal.png'),
  },
  wallets: {
    imageSrc: null,
    videoSrc: desktop('videos', 'Wallet_Crousel.mov'),
    videoSrcMobile: desktop('videos', 'Wallet_Crousel.mov'),
    posterSrc: null,
  },
  split: {
    videoSrc: desktop('videos', 'ExpenseSplit.mov'),
    posterSrc: null,
  },
  import: {
    videoSrc: desktop('videos', 'CSV_Import.mov'),
  },
  apple: {
    imageSrc: desktop('screenshots', 'AppleAutomation.png'),
    posterSrc: desktop('screenshots', 'AppleAutomation.png'),
  },
  classifier: {
    videoSrc: desktop('videos', 'ClassifierModel.mov'),
  },
  summary: {
    videoSrc: desktop('videos', 'Summaries.mov'),
  },
}

export function withLandingAssets(feature) {
  if (!USE_LANDING_ASSETS) return feature
  const assets = LANDING_ASSET_PATHS[feature.id]
  if (!assets) return feature
  return { ...feature, ...assets }
}
