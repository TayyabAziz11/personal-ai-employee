'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Bot, Github, Loader2, Mail } from 'lucide-react'
import { useState, Suspense } from 'react'

type Tab = 'github' | 'email'
type Mode = 'signin' | 'signup'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/app'

  const [tab, setTab] = useState<Tab>('github')
  const [mode, setMode] = useState<Mode>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Email form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleGithubSignIn() {
    setLoading(true)
    setError(null)
    await signIn('github', { callbackUrl })
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Signup failed.')
        setLoading(false)
        return
      }
      setSuccess('Account created! Signing you in…')
    }

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password.')
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070f] bg-grid px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-gradient-radial from-teal-500/8 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d1a] p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/30 glow-teal">
              <Bot className="h-6 w-6 text-teal-400" />
            </div>
            <div className="text-center">
              <h1 className="text-base font-semibold text-zinc-100">Personal AI Employee</h1>
              <p className="text-xs text-zinc-500">Command Center Access</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex rounded-lg bg-white/[0.04] p-1">
            {(['github', 'email'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null) }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all ${
                  tab === t
                    ? 'bg-white/[0.08] text-zinc-100 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'github' ? <Github className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                {t === 'github' ? 'GitHub' : 'Email'}
              </button>
            ))}
          </div>

          {/* GitHub panel */}
          {tab === 'github' && (
            <div>
              <button
                onClick={handleGithubSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/[0.07] border border-white/[0.10] py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                {loading ? 'Signing in…' : 'Continue with GitHub'}
              </button>
              <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-600">
                Only authorized GitHub accounts can access this dashboard.
              </p>
            </div>
          )}

          {/* Email panel */}
          {tab === 'email' && (
            <div>
              {/* Sign in / Sign up toggle */}
              <div className="mb-4 flex items-center justify-center gap-1 text-xs text-zinc-500">
                <button
                  onClick={() => { setMode('signin'); setError(null); setSuccess(null) }}
                  className={`px-2 py-0.5 rounded transition-colors ${mode === 'signin' ? 'text-teal-400 font-medium' : 'hover:text-zinc-300'}`}
                >
                  Sign in
                </button>
                <span>·</span>
                <button
                  onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}
                  className={`px-2 py-0.5 rounded transition-colors ${mode === 'signup' ? 'text-teal-400 font-medium' : 'hover:text-zinc-300'}`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                {mode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                />
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
                />

                {error && (
                  <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2 text-xs text-teal-400">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500/90 py-3 text-sm font-medium text-white transition-all hover:bg-teal-500 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] text-zinc-700">
          Personal AI Employee · Hackathon 0
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
