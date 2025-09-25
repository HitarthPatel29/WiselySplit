import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  // Load token from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        // You can check exp claim if needed
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          console.warn('Stored token expired, clearing it.')
          localStorage.removeItem('token')
        } else {
          setUser({ email: decoded.sub, ...decoded })
          setToken(storedToken)
        }
      } catch (err) {
        console.error('Invalid stored token, clearing it:', err)
        localStorage.removeItem('token')
      }
    }
  }, [])

  // Login (store token + decode user info)
  const login = (jwt) => {
    try {
      const decoded = jwtDecode(jwt)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        throw new Error('Token expired')
      }
      localStorage.setItem('token', jwt)
      setUser({ email: decoded.sub, ...decoded })
      setToken(jwt)
    } catch (err) {
      console.error('Login failed due to invalid token:', err)
      localStorage.removeItem('token')
      setUser(null)
      setToken(null)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)