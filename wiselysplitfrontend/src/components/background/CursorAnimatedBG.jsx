import React, { useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { DollarSlashMarkSvg } from '../Logo'
import useReducedMotion from '../../hooks/useReducedMotion'

const EMERALD = '#10b981'
const GLOW = 'url(#emeraldGlow)'
const GLOW_STRONG = 'url(#emeraldGlowStrong)'

const FAR_SPRING = { stiffness: 160, damping: 26 }
const NEAR_SPRING = { stiffness: 200, damping: 28 }

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
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={EMERALD} strokeWidth="1.5" strokeOpacity="0.5" filter={GLOW} />
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

function BarChartGlyph({ x, y, width, height, bars, fillOpacity = 0, strokeOpacity = 0.45, delay = 0, reducedMotion }) {
  const gap = width * 0.14
  const barWidth = (width - gap * (bars.length - 1)) / bars.length
  const baseline = y + height
  const axisOpacity = strokeOpacity * 0.75

  const content = (
    <g>
      <line
        x1={x}
        y1={baseline}
        x2={x + width}
        y2={baseline}
        stroke={EMERALD}
        strokeOpacity={axisOpacity}
        strokeWidth="1.5"
        filter={GLOW}
      />
      {bars.map((ratio, i) => {
        const barH = height * ratio
        const bx = x + i * (barWidth + gap)
        const by = baseline - barH
        return (
          <rect
            key={i}
            x={bx}
            y={by}
            width={barWidth}
            height={barH}
            rx={Math.min(barWidth * 0.2, 3)}
            fill={EMERALD}
            fillOpacity={fillOpacity}
            stroke={EMERALD}
            strokeOpacity={strokeOpacity}
            strokeWidth="1.5"
            filter={GLOW}
          />
        )
      })}
    </g>
  )

  if (reducedMotion) return content

  return (
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {content}
    </motion.g>
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

export function useBrandBackdropMotion() {
  const reducedMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const onMouseMove = useCallback(
    (e) => {
      if (reducedMotion) return
      mouseX.set((e.clientX - window.innerWidth / 2) * 0.02)
      mouseY.set((e.clientY - window.innerHeight / 2) * 0.02)
    },
    [reducedMotion, mouseX, mouseY]
  )

  return { mouseX, mouseY, onMouseMove, reducedMotion }
}

export default function BrandBackdrop({ reducedMotion, mouseX, mouseY }) {
  const farSmoothX = useSpring(mouseX, FAR_SPRING)
  const farSmoothY = useSpring(mouseY, FAR_SPRING)
  const nearSmoothX = useSpring(mouseX, NEAR_SPRING)
  const nearSmoothY = useSpring(mouseY, NEAR_SPRING)

  const farX = useTransform(farSmoothX, (v) => v * 0.6)
  const farY = useTransform(farSmoothY, (v) => v * 0.6)
  const nearX = useTransform(nearSmoothX, (v) => v * 1.4)
  const nearY = useTransform(nearSmoothY, (v) => v * 1.4)

  const FarLayer = reducedMotion ? 'g' : motion.g
  const NearLayer = reducedMotion ? 'g' : motion.g
  const farLayerStyle = reducedMotion ? undefined : { x: farX, y: farY, willChange: 'transform' }
  const nearLayerStyle = reducedMotion ? undefined : { x: nearX, y: nearY, willChange: 'transform' }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,rgba(16,185,129,0.1)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_42%,rgba(16,185,129,0.22)_0%,transparent_60%)]" />

      <svg
        className="absolute inset-0 w-full h-full opacity-50"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <EmeraldGlowDefs />

        <FarLayer style={farLayerStyle}>
          <circle cx="120" cy="120" r="170" fill="none" stroke={EMERALD} strokeOpacity="0.35" strokeWidth="1.5" filter={GLOW} />
          <circle cx="120" cy="120" r="118" fill="none" stroke={EMERALD} strokeOpacity="0.4" strokeWidth="1.5" filter={GLOW} />
          <RotatingRing cx="120" cy="120" r="150" dash="6 14" duration={70} reducedMotion={reducedMotion} />

          <circle cx="1090" cy="710" r="180" fill="none" stroke={EMERALD} strokeOpacity="0.35" strokeWidth="1.5" filter={GLOW} />
          <circle cx="1090" cy="710" r="120" fill="none" stroke={EMERALD} strokeOpacity="0.4" strokeWidth="1.5" filter={GLOW} />
          <RotatingRing cx="1090" cy="710" r="155" dash="4 16" duration={90} reverse reducedMotion={reducedMotion} />

          <RotatingRing cx="1140" cy="360" r="78" dash="3 12" duration={55} reducedMotion={reducedMotion} />
        </FarLayer>

        <NearLayer style={nearLayerStyle}>
          <line x1="600" y1="40" x2="600" y2="760" stroke={EMERALD} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 12" filter={GLOW_STRONG} />

          <BarChartGlyph x={935} y={70} width={100} height={82} bars={[0.45, 0.75, 0.55, 0.9]} strokeOpacity={0.45} delay={0} reducedMotion={reducedMotion} />
          <BarChartGlyph x={95} y={520} width={110} height={82} bars={[0.7, 0.5, 0.85, 0.6]} fillOpacity={0.08} strokeOpacity={0.5} delay={0.8} reducedMotion={reducedMotion} />
          <BarChartGlyph x={962} y={545} width={96} height={73} bars={[0.55, 0.8, 0.65]} fillOpacity={0.06} strokeOpacity={0.4} delay={1.4} reducedMotion={reducedMotion} />

          <Coin cx="90" cy="300" r="26" delay={0} reducedMotion={reducedMotion} />
          <Coin cx="1015" cy="245" r="30" delay={1.1} reducedMotion={reducedMotion} />
          <Coin cx="210" cy="560" r="22" delay={0.6} reducedMotion={reducedMotion} />
          <Coin cx="950" cy="600" r="20" delay={1.6} reducedMotion={reducedMotion} />

          <Twinkle cx="300" cy="180" r="4" delay={0} reducedMotion={reducedMotion} />
          <Twinkle cx="820" cy="150" r="3" delay={0.8} reducedMotion={reducedMotion} />
          <Twinkle cx="430" cy="640" r="3.5" delay={1.4} reducedMotion={reducedMotion} />
          <Twinkle cx="760" cy="660" r="3" delay={0.4} reducedMotion={reducedMotion} />
          <Twinkle cx="540" cy="120" r="2.5" delay={2} reducedMotion={reducedMotion} />
          <Twinkle cx="1080" cy="470" r="3" delay={1.2} reducedMotion={reducedMotion} />
        </NearLayer>
      </svg>
    </div>
  )
}
