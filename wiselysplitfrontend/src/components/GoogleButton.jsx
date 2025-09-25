import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Navigate } from 'react-router-dom'



function GoogleButton() {
  const { Login } = useAuth()
  useEffect(() => {
    /* global google */
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    // Load Google One Tap or button
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse
    })

    google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      { theme: 'outline', size: 'large' }
    )
  }, [])

  const handleCredentialResponse = (response) => {
    // Google gives us the ID token (JWT)
    const idToken = response.credential
    console.log('Google ID Token:', idToken)

    // Send token to backend
    fetch('http://localhost:8080/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: idToken })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Backend JWT:', data)
        if (data.jwt) {
          Login(data.jwt)
          alert('Google login successful!')
          Navigate('/dashboard')
        }
      })
      .catch(err => console.error('Google login failed:', err))
  }

  return <div id='googleSignInDiv'></div>
}

export default GoogleButton