// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friendsAndGroups, setFriendsAndGroups] = useState([])

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken)
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          console.warn('Stored token expired, clearing it.')
          logout()
        } else {
          setToken(storedToken)
          setUserId(decoded.userId || null) // ✅ extract userId from JWT claim
        }
      } catch (err) {
        console.error('Invalid stored token, clearing it:', err)
        logout()
      }
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const fetchConnections = async () => {
      try {
        const res = await api.get(`/users/${userId}/connections`)
        const { friends, groups } = res.data
        setFriendsAndGroups([...friends, ...groups])
        console.log('Fetched connections:', [...friends, ...groups])
      } catch (err) {
        console.error('Failed to fetch connections:', err)
      }
    }

    fetchConnections()
  }, [userId]) // runs only when userId is set

  // Login (store token + remember me)
  const login = (jwt, remember = false) => {
    try {
      const decoded = jwtDecode(jwt)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) throw new Error('Token expired')

      if (remember) {
        localStorage.setItem('token', jwt)
        sessionStorage.removeItem('token')
      } else {
        sessionStorage.setItem('token', jwt)
        localStorage.removeItem('token')
      }

      setToken(jwt)
      setUserId(decoded.userId || null) //store userId
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
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, loading, friendsAndGroups, setFriendsAndGroups }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)