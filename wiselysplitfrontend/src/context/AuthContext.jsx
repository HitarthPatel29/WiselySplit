import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { Navigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)  // 👈 new

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          console.warn('Stored token expired, clearing it.')
          logout()
        } else {
          console.log('Loaded valid token from storage. ' + storedToken)
          setToken(storedToken)
        }
      } catch (err) {
        console.error('Invalid stored token, clearing it:', err)
        logout()
      }
    }
    setLoading(false)  // 👈 done checking
  }, [])


  // Login (store token + remember me)
  const login = (jwt, remember = false) => {
  try {
    const decoded = jwtDecode(jwt)
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      throw new Error('Token expired')
    }
    if (remember) {
      localStorage.setItem('token', jwt)
      sessionStorage.removeItem('token')
    } else {
      sessionStorage.setItem('token', jwt)
      localStorage.removeItem('token')
    }
    setToken(jwt)
  } catch (err) {
    console.error('Login failed due to invalid token:', err)
    logout()
  }
}

  // Logout
  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setToken(null)
  }

   return (
    <AuthContext.Provider value={{ token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)