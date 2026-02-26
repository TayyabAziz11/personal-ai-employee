import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Personal AI Employee',
    template: '%s | Personal AI Employee',
  },
  description:
    'Autonomous AI agent system — Gmail, LinkedIn, Odoo, Twitter, WhatsApp. Full perception-plan-approval-action loop.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-zinc-100 antialiased">{children}</body>
    </html>
  )
}
