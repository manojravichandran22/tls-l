'use client'

import { useState, useCallback } from 'react'
import type { User, LoginCredentials } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (_credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call
      // const response = await authService.login(credentials)
      // setUser(response.data.user)
      await new Promise(resolve => setTimeout(resolve, 1000)) // simulate API
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('auth_token')
  }, [])

  return { user, isLoading, error, login, logout, isAuthenticated: !!user }
}
