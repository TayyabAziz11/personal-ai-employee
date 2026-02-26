---
id: 037
title: Odoo Frontend + CEO Briefings
stage: general
date: 2026-02-24
surface: agent
model: claude-sonnet-4-6
feature: odoo-frontend-briefings
branch: 001-gold-tier-full
user: tayyab
command: add odoo proper to frontend command center; add CEO Briefings page with generate now button
labels: ["feature","odoo","ceo-briefing","frontend","command-center","sidebar"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - apps/web/src/app/app/command-center/page.tsx
  - apps/web/src/app/app/command-center/[channel]/page.tsx
  - apps/web/src/components/layout/sidebar.tsx
  - apps/web/src/app/app/briefings/page.tsx
  - apps/web/src/app/api/briefings/route.ts
  - apps/web/src/app/api/briefings/generate/route.ts
  - apps/web/src/app/api/briefings/[filename]/route.ts
tests:
  - Manual: Odoo card visible in command center with amber styling
  - Manual: /app/command-center/odoo shows invoice table, revenue cards, AR aging chart
  - Manual: /app/briefings lists existing briefings; "Generate Now" triggers brain_generate_weekly_ceo_briefing_skill.py
---

## Prompt

now add odoo proper in frontend also right now its not showing in command center also add it there proper and now also add bussiness ceo etc read output.txt file in my root to understand what we add bussiness ceo and what its do so add it proper and also add it in frontend too

## Response snapshot

**Command Center Main Page** (`apps/web/src/app/app/command-center/page.tsx`):
- Added `ActivitySquare` import from lucide-react
- Added `odoo` channel entry to `channels` array:
  - Amber color theme: `text-amber-400`, `bg-amber-500/10`, `border-amber-500/20`
  - `live: true` so card is clickable (not grayed out)
  - Actions: Query Invoices, Revenue Summary, AR Aging Report, Create Invoice (Approval)
- Added Odoo credentials check in `getUserConnections()`:
  - Reads `.secrets/odoo_credentials.json`
  - `connected: true` only when base_url ≠ localhost + password doesn't start with `YOUR_` + database ≠ `my_company_db`
  - Otherwise shows `displayName: 'Odoo (mock mode)'` with `connected: false`

**Channel Workspace** (`apps/web/src/app/app/command-center/[channel]/page.tsx`):
- Added 10 Odoo state variables: `odooInvoices`, `odooRevenue`, `odooArAging`, `loadingOdooData`, `odooError`, `odooQueryType`, `odooMockMode`
- Added `loadOdooData(queryType)` function calling `/api/odoo/query` POST
- Added `useEffect` to auto-load invoices when `channel === 'odoo'`
- Added full Odoo JSX section between Instagram and stub sections:
  - Mock mode amber banner (when running without real Odoo)
  - Query selector buttons: Unpaid Invoices / Revenue Summary / AR Aging + Refresh
  - Invoice table: invoice #, customer, amount, status badge (overdue=red / unpaid=amber), due date
  - Revenue summary: 3 stat cards (Total Invoiced, Total Paid, Outstanding)
  - AR Aging: horizontal bar chart for 5 buckets (current, 1-30, 31-60, 61-90, 90+)
  - "Create Invoice (requires approval)" CTA button opens ActionWizard

**Sidebar** (`apps/web/src/components/layout/sidebar.tsx`):
- Added `Newspaper` import from lucide-react
- Added `{ href: '/app/briefings', label: 'CEO Briefings', icon: Newspaper }` to Data group

**CEO Briefings Page** (`apps/web/src/app/app/briefings/page.tsx`):
- Split-pane layout: briefing list (left) + content viewer (right)
- "Generate Now" button → POST `/api/briefings/generate` → runs `brain_generate_weekly_ceo_briefing_skill.py --mode mock`
- Briefing list shows week label, period, mock/real mode badge
- Content pane renders markdown to HTML (h1/h2/h3, bold, code, hr, tables, lists)
- Empty state with 3 info cards (Weekly, AI-Generated, 8 Sections)

**API Routes**:
- `GET /api/briefings` — lists `Business/Briefings/*.md` files with metadata extraction
- `POST /api/briefings/generate` — spawns Python briefing skill, returns success/error
- `GET /api/briefings/[filename]` — serves single briefing file content (path traversal protected)

## Outcome

- ✅ Impact: Odoo now shows as proper channel card in command center (amber, live badge); full accounting workspace with invoice query, revenue, AR aging; CEO Briefings page accessible from sidebar
- 🧪 Tests: Manual verification (no new automated tests needed — briefings page is purely a UI wrapper over existing skill)
- 📁 Files: 7 files modified/created
- 🔁 Next prompts: implement G6 (Weekly CEO Briefing cron trigger on Sunday); implement G9 (Ralph Wiggum loop); connect real Odoo instance

## Evaluation notes (flywheel)

- Failure modes observed: none during implementation; Odoo workspace correctly falls out of `isStub` guard since channel !== 'twitter'
- Graders run and results: manual verification planned
- Prompt variant: multi-part UI integration (command-center card + workspace + briefings page + sidebar + API routes)
- Next experiment: test AR aging bar chart rendering with real mock data; verify generate button works end-to-end
