import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LandingNav from '../components/landing/LandingNav'
import LandingHero from '../components/landing/LandingHero'
import FeatureSection from '../components/landing/FeatureSection'
import LandingCta from '../components/landing/LandingCta'
import LandingFooter from '../components/landing/LandingFooter'
import { LANDING_FEATURES_WITH_ASSETS } from '../constants/landingFeatures'

export default function Landing() {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300" role="status">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white font-landing antialiased transition-colors duration-300">
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
