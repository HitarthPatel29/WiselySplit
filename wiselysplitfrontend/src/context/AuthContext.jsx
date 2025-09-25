import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)

  // Load token from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        // check exp claim if needed
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          console.warn('Stored token expired, clearing it.')
          localStorage.removeItem('token')
        } else {
          setToken(storedToken)
        }
      } catch (err) {
        console.error('Invalid stored token, clearing it:', err)
        localStorage.removeItem('token')
      }
    }
  }, [])

  // Login (store token + remember me)
  const login = (jwt, remember = false) => {
    try {
      const decoded = jwtDecode(jwt)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        throw new Error('Token expired')
      }
      if (remember){
        localStorage.setItem('token', jwt);
      }
      else{ 
        sessionStorage.setItem('token');
      }
      setToken(jwt)
    } catch (err) {
      console.error('Login failed due to invalid token:', err)
      localStorage.removeItem('token')
      setToken(null)
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)