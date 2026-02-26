import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  Eye,
  Brain,
  ShieldCheck,
  Zap,
  FileText,
  ArrowRight,
  Bot,
  Github,
  Mail,
  Briefcase,
  MessageSquare,
  Twitter,
  LayoutDashboard,
} from 'lucide-react'

const steps = [
  {
    icon: Eye,
    title: 'Perception',
    description: 'Multi-channel watcher monitors Gmail, LinkedIn, Twitter, WhatsApp, and Odoo — 24/7.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    icon: Brain,
    title: 'Plan',
    description: 'Constitutional AI generates structured 12-section plans with risk assessment.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Approval',
    description: 'Human-in-the-loop gates. No action without explicit approval from you.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'Action',
    description: 'Executes approved plans via MCP servers. Real Gmail, LinkedIn, Odoo integrations.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  {
    icon: FileText,
    title: 'Logging',
    description: 'Complete audit trail with PII redaction. Every action logged to JSON + Markdown.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
]

const channels = [
  { icon: Mail, label: 'Gmail', sub: 'Email monitoring + send' },
  { icon: Briefcase, label: 'LinkedIn', sub: 'Posts + engagement' },
  { icon: Twitter, label: 'Twitter', sub: 'Tweets + DMs' },
  { icon: MessageSquare, label: 'WhatsApp', sub: 'Business messaging' },
  { icon: Briefcase, label: 'Odoo', sub: 'ERP + Accounting' },
]

const principles = [
  { title: 'Safety First', body: 'Dry-run default on all executors. Explicit flag required for real actions.' },
  { title: 'No Bypass', body: 'Approval gates cannot be programmatically bypassed. Human file movement required.' },
  { title: 'PII Redacted', body: 'Email addresses, phone numbers, and tokens are redacted from all logs.' },
  { title: 'Complete Audit', body: 'Every decision, plan, and action is logged with timestamps in UTC.' },
]

export default async function MarketingPage() {
  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session?.user
  const userName = session?.user?.name ?? session?.user?.email ?? null

  return (
    <div className="min-h-screen bg-[#07070f] bg-grid text-zinc-100">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.05] glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/30">
              <Bot className="h-4 w-4 text-teal-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">Personal AI Employee</span>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/app"
                className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-teal-400"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?mode=email"
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-radial from-teal-500/10 via-transparent to-transparent" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs text-teal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            Autonomous Gold Tier — Active
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Your{' '}
            <span className="text-gradient-teal">Personal AI&nbsp;Employee</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            A fully autonomous agent that monitors your inbox, plans actions, waits for your
            approval, and executes across Gmail, LinkedIn, Odoo, Twitter, and WhatsApp — with a
            complete audit trail and safety-first design.
          </p>

          {/* CTAs — change based on auth state */}
          {isLoggedIn ? (
            <div className="mt-10 flex flex-col items-center gap-3">
              {/* Welcome back banner */}
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/5 px-5 py-2.5 text-sm text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                {userName ? `Welcome back, ${userName.split(' ')[0]}!` : 'Welcome back!'} You&apos;re signed in.
              </div>
              <Link
                href="/app"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(20,184,166,0.35)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.5)] sm:w-auto"
              >
                <LayoutDashboard className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-xs text-zinc-600">Your session is active — no need to sign in again.</p>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_32px_rgba(20,184,166,0.5)] sm:w-auto"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login?mode=email"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                <Mail className="h-4 w-4" />
                Continue with Email
              </Link>
            </div>
          )}

          {!isLoggedIn && (
            <p className="mt-4 text-xs text-zinc-600">
              Secure authentication · No data shared with third parties
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-white">How It Works</h2>
          <p className="mt-2 text-sm text-zinc-500">Five-stage autonomous loop, safety-gated at every step</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`relative rounded-xl border ${step.border} ${step.bg} p-5`}
            >
              <div className="absolute right-3 top-3 text-[10px] font-mono text-zinc-700">
                0{i + 1}
              </div>
              <step.icon className={`h-6 w-6 ${step.color} mb-3`} />
              <h3 className="text-sm font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Channels */}
      <section className="border-y border-white/[0.05] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-8 text-center text-xs uppercase tracking-widest text-zinc-600">
            Connected Channels
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {channels.map((ch) => (
              <div
                key={ch.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3"
              >
                <ch.icon className="h-4 w-4 text-zinc-500" />
                <div>
                  <p className="text-xs font-medium text-zinc-200">{ch.label}</p>
                  <p className="text-[10px] text-zinc-600">{ch.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety principles */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-white">Safety Principles</h2>
          <p className="mt-2 text-sm text-zinc-500">Built for trust — every action is controlled and auditable</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="rounded-xl border border-white/[0.06] bg-[#0d0d1a] p-5">
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-zinc-100">{p.title}</h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-lg px-6">
          <h2 className="text-2xl font-bold text-white">
            {isLoggedIn ? 'Your dashboard is ready.' : 'Ready to command your AI employee?'}
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            {isLoggedIn
              ? 'Head back to your command center and take control.'
              : 'Sign in to access your personal command center.'}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400"
                >
                  <Github className="h-4 w-4" />
                  Sign in with GitHub
                </Link>
                <Link
                  href="/login?mode=email"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-3 text-sm font-semibold text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <Mail className="h-4 w-4" />
                  Sign in with Email
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 text-center text-xs text-zinc-700">
        <p>Personal AI Employee · Hackathon 0 · Built with Next.js + Neon + OpenAI</p>
      </footer>
    </div>
  )
}
