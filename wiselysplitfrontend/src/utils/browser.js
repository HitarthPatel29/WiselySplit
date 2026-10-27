/**
 * Desktop Safari and iOS Safari. Chromium and other iOS browsers also
 * include "Safari" in the user agent, so those are excluded.
 */
export function isSafari() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return false
  return /Safari/i.test(ua) && !/Chrome|Chromium|Android|Edg\//i.test(ua)
}
