import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useLandingThemeLock from '../hooks/useLandingThemeLock'
import LandingNav from '../components/landing/LandingNav'
import LandingHero from '../components/landing/LandingHero'
import FeatureSection from '../components/landing/FeatureSection'
import LandingCta from '../components/landing/LandingCta'
import LandingFooter from '../components/landing/LandingFooter'
import { LANDING_FEATURES_WITH_ASSETS } from '../constants/landingFeatures'

export default function Landing() {
  const { token, loading } = useAuth()
  useLandingThemeLock()

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center" role="status">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-emerald" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-brand-navy text-white font-landing antialiased [color-scheme:dark]">
      <LandingNav />
      <main id="main-content">
        <LandingHero />
        <div id="features">
          {LANDING_FEATURES_WITH_ASSETS.map((feature, index) => (
            <FeatureSection key={feature.id} feature={feature} index={index} />
          ))}
        </div>
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
