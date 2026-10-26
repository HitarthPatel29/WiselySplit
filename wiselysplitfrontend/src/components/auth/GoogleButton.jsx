// src/components/auth/GoogleButton.jsx
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../../context/NotificationContext'
import api from '../../api'



function GoogleButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { showSuccess } = useNotification()
  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    let rendered = false

    const paint = () => {
      if (rendered) return true
      const container = document.getElementById('googleSignInDiv')
      if (!container || !window.google?.accounts?.id) return false

      const raw = container.getBoundingClientRect().width
      if (raw < 1) return false

      rendered = true
      // GIS long button width is clamped (~200–400px); match container up to API max
      const width = Math.min(400, Math.max(200, Math.round(raw)))

      container.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
      })
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width
      })
      return true
    }

    let intervalId
    const tick = () => {
      if (!window.google?.accounts?.id) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (paint()) clearInterval(intervalId)
        })
      })
    }

    intervalId = setInterval(tick, 100)

    return () => {
      clearInterval(intervalId)
      const container = document.getElementById('googleSignInDiv')
      if (container) container.innerHTML = ''
    }
  }, [])
    
  const handleCredentialResponse = (response) => {
    // Google gives us the ID token (JWT)
    const idToken = response.credential

    // Send token to backend; the shared api client accepts the refresh cookie it sets
    api.post('/auth/google', { token: idToken, remember: true })
      .then(({ data }) => {
        if (data.token) {
          login(data.token)
          showSuccess('Google login successful!', { asSnackbar: true })
          navigate('/dashboard')
        }
      })
      .catch(err => console.error('Google login failed:', err))
  }

  return (
    <>
      <span className="sr-only">Sign in with your Google account</span>
      <div
        id="googleSignInDiv"
        className="flex w-full justify-center [&_iframe]:max-w-full"
        role="region"
        aria-label="Google Sign In"
      />
    </>
  )
}

export default GoogleButton;