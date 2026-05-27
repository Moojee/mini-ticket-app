import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Mini Ticket App',
  description: 'Internal task management with Slack notifications',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}