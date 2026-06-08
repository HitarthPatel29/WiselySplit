import React from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'

const STEPS = [
  {
    number: '1',
    title: 'Set Card Name on wallet',
    description: 'Match the exact card name from your Apple Automation app.',
  },
  {
    number: '2',
    title: 'Create Apple Shortcut',
    description: 'Set up a Shortcut to post transactions to WiselySplit.',
  },
  {
    number: '3',
    title: 'Pay with Apple Pay',
    description: 'Every tap logs an expense automatically — no bank connect.',
  },
]

export default function AppleAutomationSteps() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="mt-6 pt-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">How Apple Automation Works</h3>
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.number}
            className="relative p-4 rounded-xl bg-white dark:bg-gray-900/60 border border-emerald-500/10 dark:border-transparent shadow-[0_0_16px_rgba(16,185,129,0.1)] dark:shadow-[0_0_16px_rgba(16,185,129,0.15)]"
            initial={reducedMotion ? {} : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-gray-900 text-sm font-bold mb-2">
              {step.number}
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">{step.description}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
