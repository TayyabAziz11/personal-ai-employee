'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  ImageIcon,
  Wand2,
  Upload,
  Clock,
  CalendarIcon,
  Send,
  Eye,
  Hash,
  AlignLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export type Channel = 'linkedin' | 'gmail' | 'whatsapp' | 'twitter' | 'instagram' | 'odoo'

export interface WizardPayload {
  // Step 1
  actionType: string
  intent: string
  // Step 2
  topic: string
  body: string
  tone: string
  length: string
  hashtags: string
  cta: string
  // Gmail specific
  recipient?: string
  subject?: string
  // Step 3 (image)
  imageMode: 'none' | 'generate' | 'upload'
  imageStyle?: string
  imageSubject?: string
  imageVibe?: string
  imageFile?: string
  previewImageUrl?: string
  // Step 4 (schedule)
  scheduleMode: 'now' | 'later'
  scheduledAt?: string
  timezone: string
}

interface WizardProps {
  channel: Channel
  onClose: () => void
  initialRecipient?: string
}

// ── Channel config ────────────────────────────────────────────────────────────

const channelConfig = {
  linkedin: {
    label: 'LinkedIn',
    actionTypes: [
      { value: 'post_text', label: 'Create Post (Text Only)', description: 'Text-only LinkedIn post' },
      { value: 'post_image', label: 'Create Post (with Image)', description: 'Post with an image' },
      { value: 'view_recent', label: 'View Recent Posts', description: 'Read-only — view your recent posts' },
    ],
    intents: ['Announcement', 'Educational', 'Story', 'Hiring', 'Thought Leadership', 'Product Launch', 'Event'],
    tones: ['Professional', 'Conversational', 'Inspirational', 'Analytical', 'Casual'],
    lengths: ['Short (~50 words)', 'Medium (~150 words)', 'Long (~300 words)'],
    hasImage: true,
    hasRecipient: false,
  },
  gmail: {
    label: 'Gmail',
    actionTypes: [
      { value: 'draft_email', label: 'Draft Email', description: 'Create a draft (no auto-send)' },
      { value: 'search_inbox', label: 'Search Inbox', description: 'Read-only — search your inbox' },
      { value: 'send_email', label: 'Send Email', description: 'Send requires approval' },
    ],
    intents: ['Follow-up', 'Introduction', 'Proposal', 'Meeting Request', 'Newsletter', 'Support', 'Thank You'],
    tones: ['Formal', 'Professional', 'Friendly', 'Concise', 'Persuasive'],
    lengths: ['Brief (~50 words)', 'Standard (~150 words)', 'Detailed (~400 words)'],
    hasImage: false,
    hasRecipient: true,
  },
  whatsapp: {
    label: 'WhatsApp',
    actionTypes: [
      { value: 'send_message', label: 'Send Message', description: 'Requires approval' },
      { value: 'view_recent', label: 'View Recent', description: 'Read-only' },
    ],
    intents: ['Follow-up', 'Greeting', 'Reminder', 'Notification'],
    tones: ['Casual', 'Friendly', 'Professional'],
    lengths: ['Short', 'Medium'],
    hasImage: false,
    hasRecipient: true,
  },
  twitter: {
    label: 'Twitter / X',
    actionTypes: [
      { value: 'post_tweet', label: 'Post Tweet', description: 'Requires approval' },
      { value: 'view_timeline', label: 'View Timeline', description: 'Read-only' },
    ],
    intents: ['Announcement', 'Opinion', 'Question', 'Engagement', 'Thread'],
    tones: ['Casual', 'Professional', 'Witty', 'Informative'],
    lengths: ['Tweet (<280 chars)', 'Thread (2-5 tweets)'],
    hasImage: false,
    hasRecipient: false,
  },
  instagram: {
    label: 'Instagram',
    actionTypes: [
      { value: 'post_image', label: 'Create Post (Image)', description: 'Publish an image post via Graph API — requires approval' },
      { value: 'view_ig_media', label: 'View Recent Media', description: 'Read-only — view your recent posts' },
    ],
    intents: ['Brand Awareness', 'Product Showcase', 'Behind the Scenes', 'Announcement', 'Educational', 'Engagement'],
    tones: ['Creative', 'Professional', 'Casual', 'Inspirational', 'Playful'],
    lengths: ['Short (~50 words)', 'Medium (~100 words)', 'Long (~150 words)'],
    hasImage: true,
    hasRecipient: false,
  },
  odoo: {
    label: 'Odoo Accounting',
    actionTypes: [
      { value: 'query_invoices', label: 'Query Invoices', description: 'Read-only — list unpaid/overdue invoices' },
      { value: 'revenue_summary', label: 'Revenue Summary', description: 'Read-only — total invoiced, paid, outstanding' },
      { value: 'ar_aging', label: 'AR Aging Report', description: 'Read-only — accounts receivable aging buckets' },
      { value: 'create_invoice', label: 'Create Invoice (Approval Required)', description: 'Draft new customer invoice — requires approval' },
    ],
    intents: ['Finance Review', 'Collections', 'Revenue Report', 'CEO Briefing', 'New Invoice'],
    tones: ['Professional', 'Formal', 'Concise'],
    lengths: ['Summary', 'Detailed'],
    hasImage: false,
    hasRecipient: false,
  },
}

const defaultPayload: WizardPayload = {
  actionType: '',
  intent: '',
  topic: '',
  body: '',
  tone: 'Professional',
  length: 'Medium (~150 words)',
  hashtags: '',
  cta: '',
  imageMode: 'none',
  scheduleMode: 'now',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done = step < current
  const active = step === current
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
          done
            ? 'bg-teal-500 text-white'
            : active
            ? 'border-2 border-teal-500 bg-teal-500/10 text-teal-400'
            : 'border border-zinc-700 text-zinc-600'
        }`}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
      </div>
      <span className={`text-[9px] uppercase tracking-wider ${active ? 'text-teal-400' : 'text-zinc-600'}`}>
        {label}
      </span>
    </div>
  )
}

// ── Field components ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20"
    />
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 resize-none"
    />
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/[0.08] bg-[#0d0d1a] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-500/50"
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Steps ────────────────────────────────────────────────────────────────────

function Step1({ channel, p, set }: { channel: Channel; p: WizardPayload; set: (k: keyof WizardPayload, v: string) => void }) {
  const cfg = channelConfig[channel]
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">Choose Action</h3>
        <p className="text-xs text-zinc-500">What would you like to do on {cfg.label}?</p>
      </div>
      <div className="grid gap-2">
        {cfg.actionTypes.map((at) => (
          <button
            key={at.value}
            onClick={() => set('actionType', at.value)}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
              p.actionType === at.value
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15] hover:bg-white/[0.04]'
            }`}
          >
            <div className={`mt-0.5 h-4 w-4 rounded-full border flex-shrink-0 flex items-center justify-center ${p.actionType === at.value ? 'border-teal-500 bg-teal-500' : 'border-zinc-600'}`}>
              {p.actionType === at.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <p className="text-sm font-medium">{at.label}</p>
              <p className="text-xs text-zinc-600">{at.description}</p>
            </div>
          </button>
        ))}
      </div>

      {p.actionType && !p.actionType.includes('view') && !p.actionType.includes('search') && (
        <Field label="Intent / Goal">
          <div className="flex flex-wrap gap-2">
            {cfg.intents.map((i) => (
              <button
                key={i}
                onClick={() => set('intent', i)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
                  p.intent === i
                    ? 'bg-teal-500 text-white'
                    : 'border border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06]'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </Field>
      )}
    </div>
  )
}

function Step2({ channel, p, set }: { channel: Channel; p: WizardPayload; set: (k: keyof WizardPayload, v: string) => void }) {
  const cfg = channelConfig[channel]
  const isReadOnly = p.actionType.includes('view') || p.actionType.includes('search')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function generateContent() {
    if (!p.topic.trim()) {
      setGenError('Enter a topic first')
      return
    }
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: p.topic,
          tone: p.tone,
          length: p.length,
          channel,
          intent: p.intent,
          hashtags: p.hashtags,
          cta: p.cta,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      set('body', data.content)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  if (isReadOnly) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Eye className="mb-3 h-8 w-8 text-zinc-500" />
        <p className="text-sm text-zinc-400">This is a read-only action.</p>
        <p className="mt-1 text-xs text-zinc-600">No content required — skip to the next step.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">Content</h3>
        <p className="text-xs text-zinc-500">Define what you want to communicate.</p>
      </div>

      {cfg.hasRecipient && (
        <Field label={channel === 'whatsapp' ? 'To (contact name or phone number)' : 'To / Recipient'}>
          <Input
            value={p.recipient ?? ''}
            onChange={(v) => set('recipient', v)}
            placeholder={
              channel === 'whatsapp'
                ? 'Saved contact name (e.g. Mom) or +923001234567'
                : 'email@example.com or contact name'
            }
          />
          {channel === 'whatsapp' && (
            <p className="text-[10px] text-zinc-600">
              Use the exact name you saved the contact as in WhatsApp, or enter a full phone number with country code.
            </p>
          )}
        </Field>
      )}

      {channel === 'gmail' && (
        <Field label="Subject">
          <Input value={p.subject ?? ''} onChange={(v) => set('subject', v)} placeholder="Email subject line" />
        </Field>
      )}

      <Field label="Topic / Key Message">
        <Input value={p.topic} onChange={(v) => set('topic', v)} placeholder="What's the main point?" />
      </Field>

      <Field label="Content / Body">
        <div className="relative">
          <Textarea
            value={p.body}
            onChange={(v) => set('body', v)}
            placeholder={
              channel === 'linkedin' || channel === 'instagram'
                ? 'Write your post caption here, or click "Generate with AI" to create content from your topic…'
                : 'Write your message body here…'
            }
            rows={5}
          />
        </div>
        <div className="flex items-center justify-between">
          {(channel === 'linkedin' || channel === 'instagram') && (
            <p className="text-[10px] text-zinc-600">
              {p.body.length} chars
              {channel === 'linkedin' && p.body.length > 3000 && ' — LinkedIn max is ~3000 chars'}
              {channel === 'instagram' && p.body.length > 2200 && ' — Instagram caption max is 2200 chars'}
            </p>
          )}
          <button
            type="button"
            onClick={generateContent}
            disabled={generating || !p.topic.trim()}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
          >
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {generating ? 'Generating…' : 'Generate with AI'}
          </button>
        </div>
        {genError && (
          <p className="text-[10px] text-red-400">{genError}</p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tone">
          <Select
            value={p.tone}
            onChange={(v) => set('tone', v)}
            options={cfg.tones.map((t) => ({ value: t, label: t }))}
          />
        </Field>
        <Field label="Length">
          <Select
            value={p.length}
            onChange={(v) => set('length', v)}
            options={cfg.lengths.map((l) => ({ value: l, label: l }))}
          />
        </Field>
      </div>

      {(channel === 'linkedin' || channel === 'instagram') && (
        <>
          <Field label="Hashtags (comma-separated)">
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                value={p.hashtags}
                onChange={(e) => set('hashtags', e.target.value)}
                placeholder="AI, innovation, tech"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-teal-500/50"
              />
            </div>
          </Field>
          {channel === 'linkedin' && (
            <Field label="Call to Action (optional)">
              <Input value={p.cta} onChange={(v) => set('cta', v)} placeholder="Visit us at example.com" />
            </Field>
          )}
        </>
      )}
    </div>
  )
}

function Step3({ p, set }: { p: WizardPayload; set: (k: keyof WizardPayload, v: string) => void }) {
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  async function generatePreview() {
    setGenerating(true)
    setGenError(null)
    setImgError(false)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageSubject: p.imageSubject,
          imageStyle: p.imageStyle,
          imageVibe: p.imageVibe,
          topic: p.topic,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      set('previewImageUrl', data.imageUrl)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">Image Options</h3>
        <p className="text-xs text-zinc-500">Add a visual to increase engagement.</p>
      </div>

      <div className="grid gap-2">
        {[
          { value: 'none', icon: AlignLeft, label: 'No image', desc: 'Text-only post' },
          { value: 'generate', icon: Wand2, label: 'AI Generate', desc: 'Describe an image to generate with DALL-E' },
          { value: 'upload', icon: Upload, label: 'Upload', desc: 'Provide an image URL or file path' },
        ].map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            onClick={() => set('imageMode', value)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
              p.imageMode === value
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]'
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-zinc-600">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {p.imageMode === 'generate' && (
        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <Field label="Style">
            <Select
              value={p.imageStyle ?? ''}
              onChange={(v) => set('imageStyle', v)}
              options={['Photorealistic', 'Illustration', 'Abstract', 'Minimalist', 'Corporate', 'Futuristic'].map((s) => ({ value: s, label: s }))}
            />
          </Field>
          <Field label="Subject / Scene">
            <Input value={p.imageSubject ?? ''} onChange={(v) => set('imageSubject', v)} placeholder="A professional working at a modern desk with AI elements" />
          </Field>
          <Field label="Vibe / Mood">
            <Input value={p.imageVibe ?? ''} onChange={(v) => set('imageVibe', v)} placeholder="Inspiring, optimistic, tech-forward" />
          </Field>

          {/* Image preview */}
          {p.previewImageUrl && !imgError ? (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewImageUrl}
                  alt="AI-generated preview"
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                  onError={() => setImgError(true)}
                />
              </div>
              <button
                onClick={generatePreview}
                disabled={generating}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {generating ? 'Regenerating…' : 'Regenerate Image'}
              </button>
            </div>
          ) : (
            <button
              onClick={generatePreview}
              disabled={generating || (!p.imageSubject?.trim() && !p.topic?.trim())}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-xs font-medium text-violet-400 hover:bg-violet-500/20 disabled:opacity-40 transition-all"
            >
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {generating ? 'Generating Preview…' : 'Generate Preview Image'}
            </button>
          )}

          {genError && <p className="text-[10px] text-red-400">{genError}</p>}
        </div>
      )}

      {p.imageMode === 'upload' && (
        <div className="space-y-3">
          <Field label="Image URL or file path">
            <Input value={p.imageFile ?? ''} onChange={(v) => set('imageFile', v)} placeholder="https://example.com/image.jpg or /path/to/image.jpg" />
          </Field>
          {p.imageFile?.startsWith('http') && (
            <div className="overflow-hidden rounded-xl border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageFile}
                alt="Upload preview"
                className="w-full object-cover"
                style={{ maxHeight: 200 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Step4({ p, set }: { p: WizardPayload; set: (k: keyof WizardPayload, v: string) => void }) {
  // Format now + 1 hour as default datetime-local value
  const defaultDt = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">Scheduling</h3>
        <p className="text-xs text-zinc-500">When should this action execute after approval?</p>
      </div>

      <div className="grid gap-2">
        {[
          { value: 'now', icon: Send, label: 'Post Now', desc: 'Execute immediately upon approval' },
          { value: 'later', icon: CalendarIcon, label: 'Schedule for Later', desc: 'Set a date and time' },
        ].map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            onClick={() => set('scheduleMode', value)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
              p.scheduleMode === value
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/[0.15]'
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-zinc-600">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {p.scheduleMode === 'later' && (
        <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <Field label="Date & Time">
            <input
              type="datetime-local"
              defaultValue={defaultDt}
              onChange={(e) => set('scheduledAt', e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0d0d1a] px-3 py-2 text-sm text-zinc-200 outline-none focus:border-teal-500/50"
            />
          </Field>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <p className="text-xs text-zinc-500">Your timezone: <span className="text-zinc-300">{p.timezone}</span></p>
          </div>
          <p className="text-[10px] text-zinc-600">
            Scheduled plans appear in your Plans queue. Use the &quot;Execute&quot; button in Plans when ready.
          </p>
        </div>
      )}
    </div>
  )
}

function Step5({ channel, p }: { channel: Channel; p: WizardPayload }) {
  const cfg = channelConfig[channel]
  const actionLabel = cfg.actionTypes.find((a) => a.value === p.actionType)?.label ?? p.actionType
  const hashtagArr = p.hashtags
    ? p.hashtags.split(',').map((h) => h.trim()).filter(Boolean)
    : []

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-200">Review Plan</h3>
        <p className="text-xs text-zinc-500">Review before submitting for approval.</p>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0d0d1a] p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">You</div>
          <div>
            <p className="text-xs font-medium text-zinc-200">Your {cfg.label} {actionLabel}</p>
            <p className="text-[10px] text-zinc-500">{p.scheduleMode === 'now' ? 'Executes immediately after approval' : `Scheduled for ${p.scheduledAt ?? 'later'}`}</p>
          </div>
        </div>

        {p.body ? (
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{p.body}</p>
        ) : p.topic ? (
          <p className="text-sm text-zinc-500 italic">Content based on: &ldquo;{p.topic}&rdquo;</p>
        ) : null}

        {hashtagArr.length > 0 && (
          <p className="mt-3 text-xs text-sky-400">{hashtagArr.map((h) => `#${h}`).join(' ')}</p>
        )}

        {p.cta && <p className="mt-2 text-xs text-teal-400">→ {p.cta}</p>}

        {p.imageMode !== 'none' && (
          <div className="mt-3">
            {p.previewImageUrl ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewImageUrl}
                  alt="Post image preview"
                  className="w-full object-cover"
                  style={{ maxHeight: 220 }}
                />
                <div className="flex items-center gap-1.5 border-t border-white/[0.04] bg-white/[0.02] px-3 py-1.5">
                  <ImageIcon className="h-3 w-3 text-zinc-600" />
                  <span className="text-[10px] text-zinc-500">
                    {p.imageMode === 'generate' ? 'AI-generated preview' : 'Uploaded image'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <ImageIcon className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-400">
                  {p.imageMode === 'generate'
                    ? `AI image: ${p.imageSubject ?? 'to be generated'} — go back to Step 3 to preview`
                    : `Upload: ${p.imageFile ?? 'provided'}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Channel', value: cfg.label },
          { label: 'Action', value: actionLabel },
          { label: 'Intent', value: p.intent || '—' },
          { label: 'Tone', value: p.tone },
          { label: 'Image', value: p.imageMode },
          { label: 'Schedule', value: p.scheduleMode === 'now' ? 'Immediate' : p.scheduledAt ?? 'Later' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] text-zinc-600">{label}</p>
            <p className="font-medium text-zinc-300 truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <p className="text-[11px] text-amber-400 leading-relaxed">
          <strong>Approval required.</strong> Submitting creates a plan in &ldquo;Pending Approval&rdquo; status.
          No action executes until you explicitly approve it in the Plans section.
        </p>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

const STEP_LABELS = ['Action', 'Content', 'Image', 'Schedule', 'Review']
const MAX_STEP = 5

function hasImage(channel: Channel, p: WizardPayload) {
  return channelConfig[channel].hasImage && p.actionType !== 'view_recent' && p.actionType !== 'search_inbox'
}

export function ActionWizard({ channel, onClose, initialRecipient }: WizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [p, setP] = useState<WizardPayload>({
    ...defaultPayload,
    actionType: channelConfig[channel].actionTypes[0]?.value ?? '',
    recipient: initialRecipient ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function set(k: keyof WizardPayload, v: string) {
    setP((prev) => ({ ...prev, [k]: v }))
  }

  function canNext(): boolean {
    if (step === 1) return !!p.actionType
    if (step === 2) {
      const isReadOnly = p.actionType.includes('view') || p.actionType.includes('search')
      if (isReadOnly) return true
      if (channel === 'gmail') return !!(p.recipient || p.subject || p.body || p.topic)
      if (channel === 'whatsapp') return !!(p.recipient?.trim()) && !!(p.body?.trim() || p.topic?.trim())
      return !!(p.topic || p.body)
    }
    return true
  }

  // Skip image step if channel doesn't support it
  function nextStep() {
    if (step === 2 && !hasImage(channel, p)) {
      setStep(4) // skip step 3
    } else {
      setStep((s) => Math.min(s + 1, MAX_STEP))
    }
  }

  function prevStep() {
    if (step === 4 && !hasImage(channel, p)) {
      setStep(2) // skip back over step 3
    } else {
      setStep((s) => Math.max(s - 1, 1))
    }
  }

  async function submit() {
    setLoading(true)
    setError(null)

    const hashtags = p.hashtags
      ? p.hashtags.split(',').map((h) => h.trim()).filter(Boolean)
      : []

    const payload = {
      ...p,
      hashtags,
      scheduledAt: p.scheduleMode === 'later' ? p.scheduledAt : undefined,
    }

    const title = `${channelConfig[channel].label} — ${channelConfig[channel].actionTypes.find((a) => a.value === p.actionType)?.label ?? p.actionType}${p.topic ? `: ${p.topic.slice(0, 30)}` : ''}`

    try {
      const res = await fetch('/api/plans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, actionType: p.actionType, title, payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create plan')
      setDone(true)
      setTimeout(() => {
        router.push('/app/plans')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10 ring-1 ring-teal-500/30">
          <CheckCircle2 className="h-8 w-8 text-teal-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-100">Plan Created!</p>
          <p className="mt-1 text-xs text-zinc-500">Redirecting to Plans for approval…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Create {channelConfig[channel].label} Plan</h2>
          <p className="text-[11px] text-zinc-500">Step {step} of {MAX_STEP}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-6 border-b border-white/[0.06] px-6 py-3">
        {STEP_LABELS.map((label, i) => (
          <StepDot key={label} step={i + 1} current={step} label={label} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {step === 1 && <Step1 channel={channel} p={p} set={set} />}
        {step === 2 && <Step2 channel={channel} p={p} set={set} />}
        {step === 3 && <Step3 p={p} set={set} />}
        {step === 4 && <Step4 p={p} set={set} />}
        {step === 5 && <Step5 channel={channel} p={p} />}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
        <button
          onClick={step === 1 ? onClose : prevStep}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        {step < MAX_STEP ? (
          <button
            onClick={nextStep}
            disabled={!canNext()}
            className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-400 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-teal-400 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating Plan…' : 'Create Plan'}
          </button>
        )}
      </div>
    </div>
  )
}
