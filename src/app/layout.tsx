import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/hooks/useTheme'
import AuthGuard from '@/components/auth/AuthGuard'

export const metadata: Metadata = {
  title: ' iQ2 | Qone',
  description: 'iQ2 Thread Locked Stitches - Operations Management System',
  icons: {
    icon: '/q1.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}else{document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider><AuthGuard>{children}</AuthGuard></ThemeProvider>
      </body>
    </html>
  )
}
