# Think In Products

A startup PM's learning journal — documented in public for anyone on the same journey.

Built with Next.js 14, Supabase, Resend, and Framer Motion.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account (for email)

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/your-username/thinkinproducts.git
cd thinkinproducts
npm install

# 2. Copy env file and fill in values
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev        # http://localhost:3001
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**server-only**) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `FROM_EMAIL` | Sender name + address, e.g. `Think in Products <hello@thinkinproducts.com>` |
| `NEXT_PUBLIC_SITE_URL` | Full site URL — `http://localhost:3001` locally, `https://thinkinproducts.com` in prod |
| `ADMIN_EMAIL` | Your email — used for contact form notifications |

---

## Supabase Setup

### 1. Run migrations

In the Supabase SQL editor (or via the CLI), run the migration files in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually — paste these files into the SQL editor:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_functions.sql
```

### 2. Enable Auth

- Dashboard → Authentication → Providers → Email — enable **Email/Password**
- Create your admin account: Dashboard → Authentication → Users → **Invite user**

### 3. Row-Level Security

The migrations set up RLS automatically. Public routes use the anon key; admin routes use the service role key server-side.

---

## Admin Portal

Navigate to `/admin` — you'll be redirected to `/admin/login`. Sign in with the user you created in Supabase Auth.

From the admin dashboard you can manage:
- **Roadmap** — phases and nodes, drag-to-reorder, move between phases
- **Articles** — markdown editor with live preview
- **Portfolio** — case studies with metrics and featured toggle
- **Newsletter** — subscriber list, broadcast composer, welcome email template
- **Settings** — profile, bio, social links, SEO
- **Audit Log** — all admin activity

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo in the [Vercel dashboard](https://vercel.com) and it will auto-deploy on push to `main`.

### Required environment variables in Vercel

Add all variables from `.env.local.example` to your Vercel project:
**Dashboard → Project → Settings → Environment Variables**

Make sure to set `NEXT_PUBLIC_SITE_URL=https://thinkinproducts.com` (not localhost).

### Custom domain

Dashboard → Project → Settings → Domains → Add `thinkinproducts.com`.

---

## Project Structure

```
app/
  (public)/          # Public-facing pages
  (admin)/admin/     # Admin portal (protected by middleware)
  api/               # API routes (subscribe, unsubscribe, contact)
  actions/           # Server actions (articles, roadmap, portfolio, settings…)
components/
  sections/          # Homepage sections (Hero, Roadmap, Portfolio, About…)
  roadmap/           # Roadmap interactive components
  admin/             # Admin UI components
  3d/                # Three.js canvas
  ui/                # Design system (Button, Badge, Card…)
lib/                 # Supabase client, utils, email helpers
supabase/migrations/ # Database schema
```

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router |
| Database | Supabase (Postgres + Auth + Storage) |
| Email | Resend |
| Animations | Framer Motion |
| 3D | Three.js |
| Styling | Tailwind CSS |
| Markdown | `@uiw/react-md-editor`, `react-markdown` |
| Validation | Zod |
| Drag & Drop | `@dnd-kit` |

---

Built by [Madan](https://thinkinproducts.com) · Learning in public · 2026
