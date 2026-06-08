import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'

export default function LandingCta() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="py-20 md:py-28" aria-labelledby="cta-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative overflow-hidden rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
          }}
          initial={reducedMotion ? {} : { opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-gray-900/20 blur-2xl" />
          </div>
          <div className="relative z-10">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-gray-100 mb-3">
              Wisely Shared. Wisely Spent.
            </h2>
            <p className="text-gray-100 text-lg mb-8 max-w-lg mx-auto">
              Join WiselySplit and take control of shared and personal finances today.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center min-h-[48px] px-10 py-3 rounded-full bg-gray-100 text-emerald-500 font-semibold text-base hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors shadow-xl"
            >
              Create Free Account
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
