import React from 'react'
import { motion } from 'framer-motion'
import Logo from '../Logo'
import BrandBackdrop, { useBrandBackdropMotion } from '../background/CursorAnimatedBG'
import GlowPill from './GlowPill'
import TrustStrip from './TrustStrip'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
}

function scrollToFeatures() {
  const el = document.getElementById('unified')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingHero() {
  const { mouseX, mouseY, onMouseMove, reducedMotion } = useBrandBackdropMotion()

  return (
    <section
      className="relative overflow-hidden min-h-[88vh] md:min-h-screen flex flex-col px-4 pt-28 md:pt-32 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300"
      onMouseMove={reducedMotion ? undefined : onMouseMove}
      aria-labelledby="hero-heading"
    >
      <BrandBackdrop reducedMotion={reducedMotion} mouseX={mouseX} mouseY={mouseY} />

      <motion.div
        className="relative z-10 flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-6 pb-8"
        variants={reducedMotion ? undefined : container}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
      >
        <motion.div variants={item} className="w-full flex justify-center px-1">
          <div className="scale-[0.62] sm:scale-[0.8] md:scale-100 lg:scale-110 origin-center">
            <GlowPill padding="px-10 py-6">
              <Logo size={100} />
            </GlowPill>
          </div>
        </motion.div>

        <motion.p variants={item} className="text-gray-700 dark:text-gray-200 text-xl sm:text-2xl">
          From Group Dinners to Personal Financial Goals.
        </motion.p>

        <motion.p
          variants={item}
          className="text-2xl sm:text-3xl font-bold text-emerald-500"
        >
          Wisely Shared. Wisely Spent.
        </motion.p>

        <motion.p
          variants={item}
          className="text-gray-700 dark:text-gray-200 text-base sm:text-lg max-w-xl"
        >
          Track Personal Spendings, Share Expenses with friends and groups, Track wallets, import CSV, log
          expenses directly from Apple Pay <br /> and much more under one roof.
        </motion.p>

        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-2 w-50 sm:w-auto"
        >
          <button
            type="button"
            onClick={scrollToFeatures}
            className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full border border-emerald-500/40 text-emerald-500 font-medium text-base hover:bg-emerald-500/10 transition-colors"
          >
            See How It Works
          </button>
        </motion.div>
      </motion.div>

      <TrustStrip />
    </section>
  )
}
