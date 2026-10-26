// src/auth/tokenStore.js
// The access token lives only in memory so XSS cannot read it from storage.
// The long-lived refresh token is an HttpOnly cookie the browser manages for us.

let accessToken = null
const listeners = new Set()

export const getAccessToken = () => accessToken

export const setAccessToken = (token) => {
  accessToken = token || null
  listeners.forEach((listener) => listener(accessToken))
}

export const clearAccessToken = () => setAccessToken(null)

export const subscribeAccessToken = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
