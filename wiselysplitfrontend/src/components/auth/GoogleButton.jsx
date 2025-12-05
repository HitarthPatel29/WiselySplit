// src/components/auth/GoogleButton.jsx
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../../context/NotificationContext'



function GoogleButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { showSuccess } = useNotification()
  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    // Load Google One Tap or button
    const interval = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(interval)

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse
        })

        const container = document.getElementById('googleSignInDiv');
        // // Clear the container before re-rendering
        // container.innerHTML = "";
        // Get the current width of the container
        const containerWidth = container.getBoundingClientRect().width;
        
        window.google.accounts.id.renderButton(
          container,
          { theme: 'outline', size: 'large' , with: containerWidth}
        )
      }
    }, 100)
    return () => clearInterval(interval)
  },[])
    
  const handleCredentialResponse = (response) => {
    // Google gives us the ID token (JWT)
    const idToken = response.credential
    console.log('Google ID Token:', idToken)
    const backendURL = import.meta.env.VITE_BACKEND_URL

    // Send token to backend
    fetch(backendURL + '/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Backend JWT:', data)
        if (data.token) {
          login(data.token, true) // remember me
          showSuccess('Google login successful!', { asSnackbar: true })
          navigate('/dashboard')
        }
      })
      .catch(err => console.error('Google login failed:', err))
  }

  return (
    <div 
      id='googleSignInDiv' 
      className='w-full'
      role="region"
      aria-label="Google Sign In"
    >
      <span className="sr-only">Sign in with your Google account</span>
    </div>
  )
}

export default GoogleButton;