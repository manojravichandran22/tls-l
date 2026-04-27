'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { useWindowSize } from '@/hooks/useWindowSize'
import { apiCall } from '@/services/apiClient'
import { setAuthCookies } from '@/lib/cookies'
import FormInput from '@/components/ui/FormInput'
import Button from '@/components/ui/Button'
import Toast, { type ToastData } from '@/components/ui/Toast'

const loginSchema = z.object({
  username: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const router = useRouter()
  const width = useWindowSize()
  const isMobile = width < 640

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setToast(null)
    try {
      const result = await apiCall<{
        status?: boolean
        success?: boolean
        message?: string
        data?: Record<string, unknown>
      }>('/user/login', {
        payload: { username: data.username, password: data.password },
      })

      const resData = (result.data ?? result) as Record<string, unknown>
      const token = (resData.token ?? resData.accessToken) as string | undefined
      const message = (result.message ?? 'Login successful') as string

      if (token) {
        const { token: _t, accessToken: _at, ...user } = resData
        setAuthCookies(token, user)
        setToast({ message, type: 'success' })
        setTimeout(() => router.push('/dashboard'), 800)
      } else {
        setToast({ message: message || 'Login failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'Login failed. Please try again.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const usernameField = register('username')
  const passwordField = register('password')

  return (
    <div className={`fixed inset-0 flex ${isMobile ? 'flex-col' : 'flex-row'} m-0 p-0 bg-white`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* LEFT: Illustration */}
      {!isMobile && (
        <div className="w-1/2 shrink-0 bg-login-bg rounded-r-[40px] overflow-hidden relative z-10">
          <Image src="/login_leftside.png" alt="" fill className="object-cover object-[50%_30%]" priority />
        </div>
      )}

      {/* RIGHT: Login */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className={`flex-1 flex items-center justify-center overflow-y-auto ${isMobile ? 'px-4 py-5' : 'py-5'}`}>
          <div className={`${isMobile ? 'w-full' : 'w-[300px]'} max-w-[360px]`}>

            {/* Logo */}
            <div className="text-center mb-1.5">
              <Image src="/logo.png" alt="iQ2 TLS" width={48} height={48} className="inline-block" />
            </div>
            <div className="text-center mb-4">
              <span className="text-sm font-semibold text-t-secondary tracking-wider">iQ2 TLS</span>
            </div>

            {/* Heading */}
            <div className="text-center mb-5">
              <h1 className="m-0 mb-1.5 text-xl font-bold text-t-primary leading-tight">Login</h1>
              <p className="m-0 text-sm text-t-light leading-normal">
                Enter your email below to login to your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3.5">
              <FormInput
                label="Employee ID"
                placeholder="EMP4903"
                autoFocus
                error={errors.username?.message}
                required
                {...usernameField}
              />

              <FormInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                error={errors.password?.message}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    className="bg-transparent border-none p-0 cursor-pointer text-t-lighter flex items-center leading-none hover:text-t-light"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                {...passwordField}
              />

              <Button variant="link" type="button" size="sm" className="self-start -mt-1">
                Forgot your password?
              </Button>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
                Login
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-2.5 border-t border-table-line text-xs text-t-lighter bg-white">
          <span>&copy; 2026 iQ2 TLS</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            help@tlssystem
          </span>
        </div>
      </div>
    </div>
  )
}
