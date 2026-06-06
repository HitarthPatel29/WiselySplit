import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo, { DollarSlashMarkSvg } from '../Logo'
import GlowPill from './GlowPill'
import TrustStrip from './TrustStrip'
import useReducedMotion from '../../hooks/useReducedMotion'

const EMERALD = '#10b981'
const GLOW = 'url(#emeraldGlow)'
const GLOW_STRONG = 'url(#emeraldGlowStrong)'

/* ---------- SVG building blocks (responsive, scale with viewBox) ---------- */

function EmeraldGlowDefs() {
  return (
    <defs>
      <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feFlood floodColor={EMERALD} floodOpacity="0.65" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
        </feMerge>
      </filter>
      <filter id="emeraldGlowStrong" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4.5" result="blur" />
        <feFlood floodColor={EMERALD} floodOpacity="0.8" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="glow" />
        </feMerge>
      </filter>
    </defs>
  )
}

function Coin({ cx, cy, r, delay = 0, reducedMotion }) {
  const markSize = r * 0.7
  const content = (
    <>
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={EMERALD} strokeWidth="1.5" strokeOpacity="0.4" filter={GLOW} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={EMERALD} strokeWidth="2" strokeOpacity="0.7" filter={GLOW} />
      <DollarSlashMarkSvg cx={cx} cy={cy} size={markSize} color={EMERALD} filter={GLOW} />
    </>
  )

  if (reducedMotion) return <g>{content}</g>

  return (
    <motion.g
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {content}
    </motion.g>
  )
}

function Twinkle({ cx, cy, r, delay = 0, reducedMotion }) {
  if (reducedMotion) {
    return <circle cx={cx} cy={cy} r={r} fill={EMERALD} fillOpacity="0.6" filter={GLOW} />
  }
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={EMERALD}
      filter={GLOW}
      animate={{ opacity: [0.35, 0.9, 0.35] }}
      transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

function RotatingRing({ cx, cy, r, dash, duration, reverse, reducedMotion }) {
  const ring = (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={EMERALD}
      strokeOpacity="0.45"
      strokeWidth="1.5"
      strokeDasharray={dash}
      filter={GLOW}
    />
  )
  if (reducedMotion) return ring
  return (
    <motion.g
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {ring}
    </motion.g>
  )
}

function BrandBackdrop({ reducedMotion, offset }) {
  const far = reducedMotion
    ? undefined
    : { transform: `translate3d(${offset.x * 0.6}px, ${offset.y * 0.6}px, 0)`, transition: 'transform 0.25s ease-out' }
  const near = reducedMotion
    ? undefined
    : { transform: `translate3d(${offset.x * 1.4}px, ${offset.y * 1.4}px, 0)`, transition: 'transform 0.18s ease-out' }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* radial glow + base wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 42%, rgba(16,185,129,0.22) 0%, transparent 60%)',
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <EmeraldGlowDefs />

        {/* ---- far layer: large outlines + concentric circles ---- */}
        <g style={far}>
          {/* top-left big circles */}
          <circle cx="120" cy="120" r="170" fill="none" stroke={EMERALD} strokeOpacity="0.35" strokeWidth="1.5" filter={GLOW} />
          <circle cx="120" cy="120" r="118" fill="none" stroke={EMERALD} strokeOpacity="0.4" strokeWidth="1.5" filter={GLOW} />
          <RotatingRing cx="120" cy="120" r="150" dash="6 14" duration={70} reducedMotion={reducedMotion} />

          {/* bottom-right big circles */}
          <circle cx="1090" cy="710" r="180" fill="none" stroke={EMERALD} strokeOpacity="0.35" strokeWidth="1.5" filter={GLOW} />
          <circle cx="1090" cy="710" r="120" fill="none" stroke={EMERALD} strokeOpacity="0.4" strokeWidth="1.5" filter={GLOW} />
          <RotatingRing cx="1090" cy="710" r="155" dash="4 16" duration={90} reverse reducedMotion={reducedMotion} />

          {/* right-mid ring */}
          <RotatingRing cx="1140" cy="360" r="78" dash="3 12" duration={55} reducedMotion={reducedMotion} />

        </g>

        {/* ---- near layer: triangles, coins, dots, center split line ---- */}
        <g style={near}>
          {/* central dashed "split" line */}
          <line x1="600" y1="40" x2="600" y2="760" stroke={EMERALD} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 12" filter={GLOW_STRONG} />

          {/* triangles */}
          <polygon points="985,70 1035,152 935,152" fill="none" stroke={EMERALD} strokeOpacity="0.45" strokeWidth="1.5" filter={GLOW} />
          <polygon points="150,520 205,602 95,602" fill={EMERALD} fillOpacity="0.08" stroke={EMERALD} strokeOpacity="0.5" strokeWidth="1.5" filter={GLOW} />
          <polygon points="1010,545 1058,618 962,618" fill={EMERALD} fillOpacity="0.06" stroke={EMERALD} strokeOpacity="0.4" strokeWidth="1.5" filter={GLOW} />

          {/* coins */}
          <Coin cx="90" cy="300" r="26" delay={0} reducedMotion={reducedMotion} />
          <Coin cx="1015" cy="245" r="30" delay={1.1} reducedMotion={reducedMotion} />
          <Coin cx="210" cy="560" r="22" delay={0.6} reducedMotion={reducedMotion} />
          <Coin cx="950" cy="600" r="20" delay={1.6} reducedMotion={reducedMotion} />

          {/* twinkling dots */}
          <Twinkle cx="300" cy="180" r="4" delay={0} reducedMotion={reducedMotion} />
          <Twinkle cx="820" cy="150" r="3" delay={0.8} reducedMotion={reducedMotion} />
          <Twinkle cx="430" cy="640" r="3.5" delay={1.4} reducedMotion={reducedMotion} />
          <Twinkle cx="760" cy="660" r="3" delay={0.4} reducedMotion={reducedMotion} />
          <Twinkle cx="540" cy="120" r="2.5" delay={2} reducedMotion={reducedMotion} />
          <Twinkle cx="1080" cy="470" r="3" delay={1.2} reducedMotion={reducedMotion} />

      
        </g>
      </svg>
    </div>
  )
}

/* ---------- Hero content ---------- */

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
  const reducedMotion = useReducedMotion()
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const onMouseMove = useCallback(
    (e) => {
      if (reducedMotion) return
      const x = (e.clientX - window.innerWidth / 2) * 0.02
      const y = (e.clientY - window.innerHeight / 2) * 0.02
      setOffset({ x, y })
    },
    [reducedMotion]
  )

  return (
    <section
      className="relative overflow-hidden min-h-[88vh] md:min-h-screen flex flex-col px-4 pt-28 md:pt-32"
      onMouseMove={onMouseMove}
      aria-labelledby="hero-heading"
    >
      <BrandBackdrop reducedMotion={reducedMotion} offset={offset} />

      <motion.div
        className="relative z-10 flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-6 pb-8"
        variants={reducedMotion ? undefined : container}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
      >
        {/* Brand logo pill */}
        <motion.div variants={item}>
          <GlowPill padding="px-6 py-4 sm:px-10 sm:py-6">
            <div className="scale-100 sm:scale-100 md:scale-110 origin-center">
              <Logo size={100} onDarkBackground={true}/>
            </div>
          </GlowPill>
        </motion.div>

        <motion.p variants={item} className="text-brand-slate text-xl sm:text-2xl">
          From Group Dinners to Personal Financial Goals.
        </motion.p>

        {/* <motion.h1
          id="hero-heading"
          variants={item}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight"
        >
          Shared &amp; Personal Expenses.{' '}
          <span className="text-brand-emerald">One Roof.</span>
        </motion.h1> */}

        <motion.p
          variants={item}
          className="text-2xl sm:text-3xl font-bold text-emerald-500"
        >
          Wisely Shared. Wisely Spent.
        </motion.p>

        <motion.p
          variants={item}
          className="text-brand-slate text-base sm:text-lg max-w-xl"
        >
          Track Personal Spendings, Share Expenses with friends and groups, Track wallets, import CSV, log
          expenses directly from Apple Pay <br /> and much more under one roof.
        </motion.p>

        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-2 w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={scrollToFeatures}
            className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-full border border-brand-emerald/40 text-brand-emerald font-medium text-base hover:bg-brand-emerald/10 transition-colors"
          >
            See How It Works
          </button>
        </motion.div>
      </motion.div>

      <TrustStrip />
    </section>
  )
}
