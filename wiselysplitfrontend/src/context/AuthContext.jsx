// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [friendsAndGroups, setFriendsAndGroups] = useState([])
  const [wallets, setWallets] = useState([])
  // RBAC: role + profile are not in the JWT; they are loaded from /auth/me.
  const [role, setRole] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

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
          setUserId(decoded.userId || null) // extract userId from JWT claim
        }
      } catch (err) {
        console.error('Invalid stored token, clearing it:', err)
        logout()
      }
    }
    setLoading(false)
  }, [userId])

  // Fetch the authenticated user's profile + RBAC role from the backend.
  // The JWT only carries identity, so role is the source of truth from the DB.
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setRole(null)
      setCurrentUser(null)
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    api.get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return
        setCurrentUser(data)
        setRole(data?.role || null)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load current user role:', err)
        setRole(null)
        setCurrentUser(null)
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // Fetch connections method
  const fetchConnections = useCallback(async () => {
    if (!userId) return

    try {
      const res = await api.get(`/users/${userId}/connections`)
      const { friends, groups } = res.data
      setFriendsAndGroups([...friends, ...groups])
      console.log('Fetched connections:', [...friends, ...groups])
    } catch (err) {
      console.error('Failed to fetch connections:', err)
    }
  }, [userId])

  // Fetch wallets method
  const fetchWallets = useCallback(async () => {
    if (!userId) return

    try {
      const res = await api.get(`/users/${userId}/wallets`)
      setWallets(res.data || [])
      console.log('Fetched wallets:', res.data)
    } catch (err) {
      console.error('Failed to fetch wallets:', err)
    }
  }, [userId])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections]) // runs when userId changes

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

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
    setRole(null)
    setCurrentUser(null)
  }

  const isAdmin = role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, loading, friendsAndGroups, setFriendsAndGroups, fetchConnections, wallets, setWallets, fetchWallets, role, isAdmin, currentUser, roleLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)