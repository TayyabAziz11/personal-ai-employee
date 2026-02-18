'use client'

import { signIn } from 'next-auth/react'
import { Github, Bot, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleGithubSignIn() {
    setLoading(true)
    await signIn('github', { callbackUrl: '/app' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070f] bg-grid px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-gradient-radial from-teal-500/8 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/30 glow-teal">
              <Bot className="h-6 w-6 text-teal-400" />
            </div>
            <div className="text-center">
              <h1 className="text-base font-semibold text-zinc-100">Personal AI Employee</h1>
              <p className="text-xs text-zinc-500">Command Center Access</p>
            </div>
          </div>

          {/* Sign in */}
          <button
            onClick={handleGithubSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/[0.07] border border-white/[0.10] py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Github className="h-4 w-4" />
            )}
            {loading ? 'Signing in...' : 'Continue with GitHub'}
          </button>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
            Access is controlled. Only authorized GitHub accounts can access this dashboard.
          </p>
        </div>

        <p className="mt-6 text-center text-[10px] text-zinc-700">
          Personal AI Employee · Hackathon 0
        </p>
      </div>
    </div>
  )
}
