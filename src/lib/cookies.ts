import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function setAuthCookies(token: string, user: Record<string, unknown>) {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'Lax' })
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      window.dispatchEvent(new Event('auth_user_updated'))
    } catch (err) {
      console.error('Failed to save auth_user to localStorage:', err)
    }
  }
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function getAuthUser(): Record<string, unknown> | null {
  if (typeof window !== 'undefined') {
    const rawLocal = localStorage.getItem(USER_KEY)
    if (rawLocal) {
      try {
        return JSON.parse(rawLocal)
      } catch {
        // Fallback to cookie
      }
    }
  }
  const rawCookie = Cookies.get(USER_KEY)
  if (!rawCookie) return null
  try {
    return JSON.parse(rawCookie)
  } catch {
    return null
  }
}

export function clearAuthCookies() {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(USER_KEY)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event('auth_user_updated'))
  }
}
