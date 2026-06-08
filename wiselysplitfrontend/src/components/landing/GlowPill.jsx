import React from 'react'

/**
 * Logo container with emerald glow only — no white fill or border lines.
 */
export default function GlowPill({ children, className = '', rounded = 'rounded-2xl', padding = '' }) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`absolute -inset-1 ${rounded} bg-gradient-to-r from-emerald-500/50 via-emerald-500/20 to-emerald-500/50 blur-lg opacity-10`}
        aria-hidden="true"
      />
      <div
        className={`relative ${rounded} ${padding} shadow-[0_0_32px_rgba(16,185,129,0.5),0_0_12px_rgba(16,185,129,0.3)]`}
      >
        {children}
      </div>
    </div>
  )
}
