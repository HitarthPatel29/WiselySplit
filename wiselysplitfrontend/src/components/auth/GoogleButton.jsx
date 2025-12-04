// src/components/auth/GoogleButton.jsx
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'



function GoogleButton() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
    const frontendURL = import.meta.env.VITE_FRONTEND_URL

    // Send token to backend
    fetch(frontendURL + '/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Backend JWT:', data)
        if (data.token) {
          login(data.token, true) // remember me
          alert('Google login successful!')
          navigate('/dashboard')
        }
      })
      .catch(err => console.error('Google login failed:', err))
  }

  return <div id='googleSignInDiv' className='w-full'></div>
}

export default GoogleButton;