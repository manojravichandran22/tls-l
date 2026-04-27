import { getAuthToken } from '@/lib/cookies'

export async function apiUpload<T = Record<string, unknown>>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getAuthToken()
  formData.set('_endpoint', endpoint)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  return res.json() as Promise<T>
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload?: Record<string, unknown>
  encrypt?: boolean
}

export async function apiCall<T = Record<string, unknown>>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'POST', payload, encrypt } = options
  const token = getAuthToken()

  // GET requests don't encrypt, POST/PUT/PATCH encrypt by default
  const shouldEncrypt = encrypt ?? (method !== 'GET')

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ endpoint, method, payload, encrypt: shouldEncrypt }),
  })

  const data = await res.json()

  if (!res.ok && res.status === 401) {
    if (typeof window !== 'undefined') {
      const { clearAuthCookies } = await import('@/lib/cookies')
      clearAuthCookies()
      window.location.href = '/login'
    }
  }

  return data as T
}
