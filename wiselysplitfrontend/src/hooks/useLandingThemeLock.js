import { useEffect } from 'react'

/**
 * Locks the document to the landing page dark brand theme while mounted.
 * Prevents body/system color-scheme transitions from affecting the landing page.
 */
export default function useLandingThemeLock() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('landing-page')
    root.style.colorScheme = 'dark'

    return () => {
      root.classList.remove('landing-page')
      root.style.colorScheme = ''
    }
  }, [])
}
