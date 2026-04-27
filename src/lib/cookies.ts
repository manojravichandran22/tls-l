import Cookies from 'js-cookie'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export function setAuthCookies(token: string, user: Record<string, unknown>) {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'Lax' })
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7, sameSite: 'Lax' })
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}

export function getAuthUser(): Record<string, unknown> | null {
  const raw = Cookies.get(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAuthCookies() {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(USER_KEY)
}
