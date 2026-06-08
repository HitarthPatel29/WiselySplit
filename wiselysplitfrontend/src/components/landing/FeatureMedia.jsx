import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'

function Placeholder({ Icon, headline }) {
  return (
    <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Icon className="w-8 h-8 text-emerald-500" />
        </div>
      )}
      <p className="text-gray-500 dark:text-gray-200 text-sm text-center">Screenshot coming soon</p>
      <div className="w-full max-w-xs space-y-2 opacity-40">
        <div className="h-3 rounded-full bg-emerald-500/20 w-3/4 mx-auto" />
        <div className="h-3 rounded-full bg-emerald-500/10 w-1/2 mx-auto" />
        <div className="h-20 rounded-xl bg-emerald-500/5 mt-4" />
      </div>
      {headline && <p className="sr-only">{headline}</p>}
    </div>
  )
}

function videoMimeType(src) {
  if (src.endsWith('.webm')) return 'video/webm'
  if (src.endsWith('.mov')) return 'video/quicktime'
  return 'video/mp4'
}

export default function FeatureMedia({ videoSrc, imageSrc, alt, icon: Icon, headline }) {
  const reducedMotion = useReducedMotion()
  const [mediaFailed, setMediaFailed] = useState(false)

  useEffect(() => {
    setMediaFailed(false)
  }, [videoSrc, imageSrc])

  const showVideo = Boolean(videoSrc) && !mediaFailed
  const showImage = !showVideo && Boolean(imageSrc) && !mediaFailed

  return (
    <motion.div
      className="relative w-full"
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/50 via-emerald-500/20 to-emerald-500/50 blur-md opacity-90" />
      <div className="relative rounded-2xl bg-white dark:bg-gray-800/80 overflow-hidden shadow-[0_0_28px_rgba(16,185,129,0.25),0_0_8px_rgba(16,185,129,0.15)] dark:shadow-[0_0_28px_rgba(16,185,129,0.4),0_0_8px_rgba(16,185,129,0.2)]">
        {showVideo ? (
          <video
            className="w-full aspect-video object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setMediaFailed(true)}
          >
            <source src={videoSrc} type={videoMimeType(videoSrc)} />
          </video>
        ) : showImage ? (
          <img
            src={imageSrc}
            alt={alt || headline}
            className="w-full aspect-video object-cover object-top"
            loading="lazy"
            onError={() => setMediaFailed(true)}
          />
        ) : (
          <Placeholder Icon={Icon} headline={alt || headline} />
        )}
      </div>
    </motion.div>
  )
}
