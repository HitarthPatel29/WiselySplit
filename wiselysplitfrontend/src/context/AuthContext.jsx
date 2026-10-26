// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import api, { refreshAccessToken, setAuthFailureHandler } from '../api'
import { setAccessToken, clearAccessToken, subscribeAccessToken } from '../auth/tokenStore'

const AuthContext = createContext(null)

// Keeps login/logout in sync across tabs that share the same refresh cookie.
const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth') : null

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

  // Mirror the in-memory access token (set by login or a silent refresh) into React state.
  useEffect(() => subscribeAccessToken((jwt) => {
    if (!jwt) {
      setToken(null)
      setUserId(null)
      return
    }
    try {
      const decoded = jwtDecode(jwt)
      setToken(jwt)
      setUserId(decoded.userId || null) // extract userId from JWT claim
    } catch (err) {
      console.error('Invalid access token, clearing it:', err)
      clearAccessToken()
    }
  }), [])

  // Local-only teardown; the server session is either already dead or revoked by logout().
  const clearSession = useCallback(() => {
    clearAccessToken()
    setRole(null)
    setCurrentUser(null)
    setFriendsAndGroups([])
    setWallets([])
  }, [])

  useEffect(() => {
    setAuthFailureHandler(clearSession)
    return () => setAuthFailureHandler(null)
  }, [clearSession])

  // Restore the session on page load by exchanging the HttpOnly refresh cookie.
  useEffect(() => {
    let cancelled = false
    refreshAccessToken()
      .catch(() => { /* no valid refresh cookie: stay logged out */ })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authChannel) return
    const onMessage = ({ data }) => {
      if (data === 'logout') clearSession()
      if (data === 'login') refreshAccessToken().catch(() => {})
    }
    authChannel.addEventListener('message', onMessage)
    return () => authChannel.removeEventListener('message', onMessage)
  }, [clearSession])

  // Fetch the authenticated user's profile + RBAC role from the backend.
  // The JWT only carries identity, so role is the source of truth from the DB.
  // Keyed on userId (not token) so silent refreshes don't refetch it every few minutes.
  useEffect(() => {
    let cancelled = false
    if (!userId) {
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
  }, [userId])

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

  // Login: keep the access token in memory only. "Remember me" is handled server-side
  // by making the refresh cookie persistent, so it is sent with the login request instead.
  const login = (jwt) => {
    try {
      const decoded = jwtDecode(jwt)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) throw new Error('Token expired')
      setAccessToken(jwt)
      authChannel?.postMessage('login')
    } catch (err) {
      console.error('Login failed due to invalid token:', err)
      clearSession()
    }
  }

  // Logout: revoke the refresh token on the server, then clear local state in every tab.
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Server logout failed:', err)
    }
    clearSession()
    authChannel?.postMessage('logout')
  }, [clearSession])

  const isAdmin = role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, loading, friendsAndGroups, setFriendsAndGroups, fetchConnections, wallets, setWallets, fetchWallets, role, isAdmin, currentUser, roleLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)