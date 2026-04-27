import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/hooks/useTheme'
import AuthGuard from '@/components/auth/AuthGuard'

export const metadata: Metadata = {
  title: 'iQ2 TLS',
  description: 'iQ2 Thread Locked Stitches - Operations Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider><AuthGuard>{children}</AuthGuard></ThemeProvider>
      </body>
    </html>
  )
}
