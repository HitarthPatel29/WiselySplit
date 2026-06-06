import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '../../hooks/useReducedMotion'

function Placeholder({ Icon, headline }) {
  return (
    <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-navy-light to-brand-navy p-8">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-brand-emerald/10 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <Icon className="w-8 h-8 text-brand-emerald" />
        </div>
      )}
      <p className="text-brand-slate text-sm text-center">Screenshot coming soon</p>
      <div className="w-full max-w-xs space-y-2 opacity-40">
        <div className="h-3 rounded-full bg-brand-emerald/20 w-3/4 mx-auto" />
        <div className="h-3 rounded-full bg-brand-emerald/10 w-1/2 mx-auto" />
        <div className="h-20 rounded-xl bg-brand-emerald/5 mt-4" />
      </div>
      {headline && <p className="sr-only">{headline}</p>}
    </div>
  )
}

export default function FeatureMedia({
  imageSrc,
  imageSrcMobile,
  videoSrc,
  videoSrcMobile,
  posterSrc,
  alt,
  icon: Icon,
  headline,
}) {
  const reducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [videoFailed, setVideoFailed] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setVideoFailed(false)
    setImageFailed(false)
  }, [imageSrc, imageSrcMobile, videoSrc, videoSrcMobile])

  const activeVideo = isMobile && videoSrcMobile ? videoSrcMobile : videoSrc
  const activeImage = isMobile && imageSrcMobile ? imageSrcMobile : imageSrc
  const showVideo = activeVideo && !videoFailed
  const showImage = !showVideo && activeImage && !imageFailed

  return (
    <motion.div
      className="relative w-full"
      whileHover={reducedMotion ? {} : { scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-emerald/50 via-brand-emerald/20 to-brand-emerald/50 blur-md opacity-90" />
      <div className="relative rounded-2xl bg-brand-navy-light/80 overflow-hidden shadow-[0_0_28px_rgba(16,185,129,0.4),0_0_8px_rgba(16,185,129,0.2)]">
        {showVideo ? (
          <video
            className="w-full aspect-video object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={posterSrc || activeImage || undefined}
            preload="metadata"
            onError={() => setVideoFailed(true)}
          >
            <source src={activeVideo} type={activeVideo.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          </video>
        ) : showImage ? (
          <img
            src={activeImage}
            alt={alt || headline}
            className="w-full aspect-video object-cover object-top"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Placeholder Icon={Icon} headline={alt || headline} />
        )}
      </div>
    </motion.div>
  )
}
