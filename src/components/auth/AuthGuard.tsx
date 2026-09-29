'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken } from '@/lib/cookies'

const PUBLIC_ROUTES = ['/login']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Skip token and auth checks completely for public informational pages (about, privacy, contact, quality)
    if (
      pathname?.toLowerCase().includes('about') ||
      pathname?.toLowerCase().includes('privacy') ||
      pathname?.toLowerCase().includes('contact') ||
      pathname?.toLowerCase().includes('quality')
    ) {
      setChecked(true)
      return
    }

    const token = getAuthToken()
    const isPublic = PUBLIC_ROUTES.includes(pathname)

    if (!token && !isPublic) {
      // Not logged in, trying to access protected page → redirect to login
      router.replace('/login')
    } else if (token && isPublic) {
      // Already logged in, trying to access login → redirect to dashboard
      router.replace('/dashboard')
    } else {
      setChecked(true)
    }
  }, [pathname, router])

  const isPublicPage =
    pathname?.toLowerCase().includes('about') ||
    pathname?.toLowerCase().includes('privacy') ||
    pathname?.toLowerCase().includes('contact') ||
    pathname?.toLowerCase().includes('quality')
  if (!checked && !isPublicPage) return null

  return <>{children}</>
}
