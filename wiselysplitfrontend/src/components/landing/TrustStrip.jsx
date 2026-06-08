import React from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  LockClosedIcon,
  WalletIcon,
} from '@heroicons/react/24/outline'
import useReducedMotion from '../../hooks/useReducedMotion'

const TRUST_ITEMS = [
  { icon: ShieldCheckIcon, label: 'Auto Expense logging' },
  { icon: LockClosedIcon, label: 'No sketchy Bank Connections' },
  { icon: WalletIcon, label: 'Your data, your wallets' },
]

export default function TrustStrip() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pb-8 md:pb-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex flex-col items-center justify-center gap-5 md:gap-6"
          initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-5 md:gap-10">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 text-gray-600 dark:text-gray-200 text-base sm:text-lg md:text-xl"
              >
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
