import {
  HomeIcon,
  WalletIcon,
  ScissorsIcon,
  DocumentArrowUpIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'
import { withLandingAssets } from './landingAssets'

/**
 * Asset paths are served from /public/landing/ (see landingAssets.js).
 * videoSrc for most features; imageSrc for Apple only. null shows placeholder UI.
 */
export const LANDING_FEATURES = [
  {
    id: 'unified',
    headline: 'Shared + Personal, One Roof',
    description:
      'Split dinner with friends and track your own budget — without switching apps.',
    bullets: ['Friends & groups', 'Personal wallets', 'One dashboard'],
    icon: HomeIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'WiselySplit dashboard showing friends, groups, and wallets together',
  },
  {
    id: 'wallets',
    headline: 'Unlimited Wallets, Tracked Independently',
    description:
      'Create as many wallets as you need. Expenses, income, and wallet-to-wallet transfers — each tracked independently.',
    bullets: ['Expense entries', 'Income tracking', 'Wallet transfers'],
    icon: WalletIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'Wallet carousel with expense, income, and transfer entries',
  },
  {
    id: 'split',
    headline: 'Split Bills Your Way — Including Itemization',
    description:
      'Equal split, custom amounts, or itemize the bill line by line. However the night went, WiselySplit handles it.',
    bullets: ['Equal or custom splits', 'Line-item itemization', 'Groups & friends'],
    icon: ScissorsIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'Bill split flow with itemized line items',
  },
  {
    id: 'import',
    headline: 'Start Tracking in Minutes — Import CSV',
    description:
      'Already have history? Import CSV from your bank and start tracking in minutes.',
    bullets: ['Column mapping', 'Review before import', 'Auto-categorization'],
    icon: DocumentArrowUpIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'CSV import wizard with field mapping and review',
  },
  {
    id: 'apple',
    headline: 'Log Apple Pay Automatically — No Bank Connect',
    description:
      'Connect Apple Pay through Shortcuts — not your bank password. Set your card name once; every tap logs automatically.',
    bullets: ['No bank linking', 'Apple Shortcuts', 'Instant expense logging'],
    icon: DevicePhoneMobileIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'Add wallet modal showing Card Name field for Apple Automation',
    showAppleSteps: true,
  },
  {
    id: 'classifier',
    headline: 'Smart Categories That Learn From You',
    description:
      'Our on-server category model suggests labels as you type — and learns when you correct it.',
    bullets: ['Live predictions', 'Learns from feedback', 'Runs on our servers'],
    icon: SparklesIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'Expense form with AI category suggestion chip',
  },
  {
    id: 'summary',
    headline: 'Summaries You Can Actually Read',
    description:
      'Monthly or yearly. Income or expenses. By category. Summaries that answer questions, not create more.',
    bullets: ['Monthly & yearly views', 'Category breakdown', 'Net balance at a glance'],
    icon: ChartPieIcon,
    videoSrc: null,
    imageSrc: null,
    alt: 'Personal summary with donut chart and net balance',
  },
]

export const LANDING_NAV_LINKS = LANDING_FEATURES.map((f) => ({
  id: f.id,
  label: f.headline.split('—')[0].trim().split(',')[0].trim(),
}))

/** Features with asset paths applied when USE_LANDING_ASSETS is true in landingAssets.js */
export const LANDING_FEATURES_WITH_ASSETS = LANDING_FEATURES.map(withLandingAssets)
