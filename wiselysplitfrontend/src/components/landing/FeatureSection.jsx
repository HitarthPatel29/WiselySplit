import React from 'react'
import { motion } from 'framer-motion'
import FeatureMedia from './FeatureMedia'
import AppleAutomationSteps from './AppleAutomationSteps'
import useReducedMotion from '../../hooks/useReducedMotion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

export default function FeatureSection({ feature, index }) {
  const reducedMotion = useReducedMotion()
  const isReversed = index % 2 === 1
  const Icon = feature.icon

  return (
    <section
      id={feature.id}
      className="scroll-mt-24 py-16 md:py-24"
      aria-labelledby={`${feature.id}-heading`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
            isReversed ? 'lg:[&>*:first-child]:order-2' : ''
          }`}
          initial={reducedMotion ? 'visible' : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.div variants={fadeUp} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/10 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              {Icon && <Icon className="w-4 h-4 text-brand-emerald" />}
              <span className="text-xs font-medium text-brand-emerald uppercase tracking-wider">
                Feature {index + 1}
              </span>
            </div>
            <h2
              id={`${feature.id}-heading`}
              className="text-3xl md:text-4xl font-bold text-white leading-tight"
            >
              {feature.headline}
            </h2>
            <p className="text-lg text-brand-slate leading-relaxed">{feature.description}</p>
            {feature.bullets?.length > 0 && (
              <ul className="space-y-2">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-brand-slate">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
            {feature.showAppleSteps && <AppleAutomationSteps />}
          </motion.div>

          <motion.div variants={fadeUp}>
            <FeatureMedia
              imageSrc={feature.imageSrc}
              imageSrcMobile={feature.imageSrcMobile}
              videoSrc={feature.videoSrc}
              videoSrcMobile={feature.videoSrcMobile}
              posterSrc={feature.posterSrc}
              alt={feature.alt}
              icon={Icon}
              headline={feature.headline}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
