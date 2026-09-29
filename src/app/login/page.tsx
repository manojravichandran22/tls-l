'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useWindowSize } from '@/hooks/useWindowSize'
import { apiCall } from '@/services/apiClient'
import { setAuthCookies } from '@/lib/cookies'
import FormInput from '@/components/ui/FormInput'
import Button from '@/components/ui/Button'
import Toast, { type ToastData } from '@/components/ui/Toast'

const loginSchema = z.object({
  username: z.string().min(1, 'Employee ID or Email ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>
type View = 'login' | 'forgot'

export default function LoginPage() {
  const [view, setView] = useState<View>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  const [forgotInput, setForgotInput] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

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
        encrypt: false,
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotInput.trim()) {
      setForgotError('Please enter your Employee ID or Email')
      return
    }
    setForgotLoading(true)
    setForgotError('')
    try {
      const res = await apiCall<{ success?: boolean; message?: string }>('/user/forgot-password', {
        payload: { username: forgotInput.trim() },
        encrypt: false,
      })
      if (res.success === false) {
        setForgotError(res.message || 'Failed to send reset link. Please try again.')
      } else {
        setForgotSent(true)
      }
    } catch {
      setForgotError('Failed to send reset link. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const goToForgot = () => {
    setForgotInput('')
    setForgotError('')
    setForgotSent(false)
    setView('forgot')
  }

  const goToLogin = () => {
    setView('login')
  }

  const usernameField = register('username')
  const passwordField = register('password')

  return (
    <div
      style={{
        '--color-input': '#ffffff',
        '--color-input-line': '#CBD5E0',
        '--color-t-primary': '#1A202C',
        '--color-t-secondary': '#2D3748',
        '--color-t-body': '#4A5568',
        '--color-t-light': '#718096',
        '--color-t-lighter': '#A0AEC0',
        '--color-card': '#ffffff',
        '--color-page': '#F5F6FA',
      } as React.CSSProperties}
      className={`fixed inset-0 flex ${isMobile ? 'flex-col' : 'flex-row'} m-0 p-0 bg-white`}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* LEFT: Illustration */}
      {!isMobile && (
        <div className="w-5/12 shrink-0 bg-login-bg rounded-r-[40px] overflow-hidden relative z-10">
          <Image src="/login_leftside.png" alt="" fill className="object-cover object-[50%_30%]" priority />
        </div>
      )}

      {/* RIGHT: Form panel */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className={`flex-1 flex items-center justify-center overflow-y-auto ${isMobile ? 'px-6 py-8' : 'px-8 py-8'}`}>
          <div className={`${isMobile ? 'w-full' : 'w-[400px]'} max-w-[440px]`}>

            {/* Logo */}
            <div className="text-center mb-2">
              <Image src="/logoo.png" alt="iQ2 TLS" width={150} height={150} className="inline-block" />
            </div>
            <div className="text-center mb-5">
              {/* <span className="text-base font-semibold text-t-secondary tracking-wider">iQ2 TLS</span> */}
            </div>

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <>
                <div className="text-center mb-7">
                  <h1 className="m-0 mb-2 text-2xl font-bold text-t-primary leading-tight">Login</h1>
                  <p className="m-0 text-sm text-t-light leading-relaxed">
                    Enter your Employee ID or Email ID and password to login to your account
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                  <FormInput
                    label="Employee ID / Email ID"
                    labelClassName="text-sm"
                    placeholder="Enter Employee ID or Email"
                    autoFocus
                    error={errors.username?.message}
                    required
                    {...usernameField}
                  />

                  {/* Password with inline Forgot link */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-t-body">
                        Password <span className="text-red-400 ml-0.5">*</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={goToForgot}
                        className="text-sm font-medium text-accent hover:underline p-0 h-auto hover:bg-transparent"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <FormInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                      error={errors.password?.message}
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
                  </div>

                  <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-1">
                    Login
                  </Button>
                </form>
              </>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === 'forgot' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goToLogin}
                  leftIcon={<ArrowLeft size={15} />}
                  className="text-sm text-t-light hover:text-accent mb-6 p-0 h-auto hover:bg-transparent gap-1.5"
                >
                  Back to Login
                </Button>

                {forgotSent ? (
                  <div className="text-center py-4">
                    <CheckCircle2 size={48} className="text-success-text mx-auto mb-4" />
                    <h2 className="m-0 mb-2 text-xl font-bold text-t-primary">Check your inbox</h2>
                    <p className="m-0 mb-6 text-sm text-t-light leading-relaxed">
                      If an account matches <span className="font-medium text-t-secondary">{forgotInput}</span>, a password reset link has been sent.
                    </p>
                    <Button variant="outline" size="lg" className="w-full" onClick={goToLogin}>
                      Back to Login
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-7">
                      <h1 className="m-0 mb-2 text-2xl font-bold text-t-primary leading-tight">Forgot Password</h1>
                      <p className="m-0 text-sm text-t-light leading-relaxed">
                        Enter your Employee ID or Email ID and we&apos;ll send you a link to reset your password.
                      </p>
                    </div>

                    <form onSubmit={handleForgotSubmit} noValidate className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-t-body">
                          Employee ID / Email ID <span className="text-red-400 ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          value={forgotInput}
                          onChange={e => { setForgotInput(e.target.value); setForgotError('') }}
                          placeholder="Enter Employee ID or Email"
                          autoFocus
                          className={`w-full h-input-h px-2.5 text-sm2 font-inherit
                            text-t-secondary bg-input border rounded-input
                            outline-none transition-colors
                            focus:border-accent focus:ring-2 focus:ring-focus-ring/15
                            placeholder:text-t-lighter
                            ${forgotError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : 'border-input-line'}`}
                        />
                        {forgotError && (
                          <span className="text-xs text-red-500 mt-0.5">{forgotError}</span>
                        )}
                      </div>

                      <Button type="submit" variant="primary" size="lg" isLoading={forgotLoading} className="w-full">
                        Send Reset Link
                      </Button>
                    </form>
                  </>
                )}
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-2.5 border-t border-table-line text-xs text-t-body bg-white">
          <span>&copy; 2026 iQ2 </span>
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
