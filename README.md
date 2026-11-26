# ThinkInProducts

A notebook for learning product management. It has four sections:

- **Articles**: one PM idea, explained by making you decide first.
- **Case studies**: one company's big decision, start to finish.
- **Product breakdowns**: a product or business model taken apart.
- **Newsletter**: the weekly issue. It's the only thing sent by email. It links to the week's new pieces.

Pieces are built from blocks: make the call, marked-up screenshots, animated charts, timelines, big numbers, diagrams and TiP (Think in Products) tips. The admin has a live preview, and Claude can write drafts through an MCP server.

Built with Next.js 16, Supabase (database, login, images) and Resend (email).

## Run it on your computer

You need [Node.js 20 or newer](https://nodejs.org).

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without any setup the site runs in **local mode**:

- The site shows the 4 sample pieces: *What is product management?*, the Netflix case study, the Amazon flywheel breakdown and newsletter issue #1.
- The admin at http://localhost:3000/admin needs a sign-in (see **Set up the admin sign-in** below). Pieces, authors and inbox messages are saved in the `.data` folder of this project, and uploaded images go in `public/uploads`. Both are ignored by git.
- Subscribe and login forms explain that Supabase isn't connected yet.

To start again from the samples, delete the `.data` folder.

## Set up the admin sign-in

The admin is protected by your email, a password and a 6-digit code from an authenticator app (two-factor authentication). Set it up once:

```bash
npm run admin:setup
```

1. Enter your email and a password of at least 12 characters (it doesn't show while you type).
2. Scan the QR code with an authenticator app: Google Authenticator, Microsoft Authenticator, 1Password or similar.
3. Type the 6-digit code the app shows, to confirm it works.
4. Restart `npm run dev` and sign in at http://localhost:3000/admin.

The script saves `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET` and `AUTH_SECRET` to `.env.local`. For the live site, copy the same four values into your host's environment variables. The password itself is never stored, only a scrambled version of it.

- **Session timeout:** you're signed out after 30 minutes without activity, and after 12 hours no matter what. Two minutes before an idle sign-out, the admin asks if you're still there. Change these with `ADMIN_IDLE_MINUTES` and `ADMIN_MAX_HOURS`.
- **Sign out everywhere:** change `ADMIN_SESSION_VERSION` (e.g. from 1 to 2) and restart.
- **Lost your phone or forgot the password:** run `npm run admin:setup` again. It replaces both, and the old codes stop working.
- After 5 wrong passwords from one address, sign-in is paused for 15 minutes.

## The admin

`/admin` has a sidebar with **Dashboard**, **Articles**, **Case studies**, **Product breakdowns**, **Newsletters**, **Inbox** and **Authors**.

- **Inbox**: messages from the contact form (`/contact`) and pitches from "Write for ThinkInProducts" (`/write-for-us`). Open one to read it, reply by email, archive or delete it. A red number in the sidebar shows unread ones. Set `INBOX_NOTIFY_EMAIL` to also get an email when one arrives.
- **Authors**: name, role, bio, photo and links for each author. Every piece has an author (pick it in the piece's settings); the byline links to the author's page at `/authors/<name>`. Author pages aren't in the menu, but Google finds them through bylines and the sitemap.

- **Dashboard**: subscribers (active, waiting to confirm, unsubscribed, new per day), accounts and paid members, page views per day, content per section, and the most-read pieces.
- **Each section**: search, filters (All, Published, Drafts, Featured), and a **New** button. The list shows reading time and views. The newsletter list also shows subscribers, and recipients, open rate and click rate for each sent issue.

While writing:

- **Save draft** (or Ctrl+S). Reading time is worked out as you type (230 words a minute, plus 10 seconds per visual).
- **Publish** asks you to confirm. **Unpublish** asks too, and takes the piece off the site.
- **Feature** (published pieces only) puts a piece in the Featured row of its section and on the home page. Each section allows 3. When it's full, you get a list of the featured pieces with **Remove from featured** next to each.
- **Settings, cover and Google**: category, tags, who can read it, web address, cover image with credit, and the search title and description with a Google preview.
- **Preview** on the right uses the same components as the live site. Click any part to jump to it. **Open full page** shows it in a new tab.
- Newsletters only: **Email** preview tab, and **Send by email** (test to yourself first, then subscribers).

Add a block with the **+** between blocks, or type `/` in an empty text block.

## Let Claude write drafts (MCP)

The site has an MCP server at `/api/mcp`. Claude can read the house writing guide, look at existing pieces and save **drafts**. It can't publish: you review drafts in the admin and publish them yourself.

Tools: `get_writing_guide`, `list_pieces`, `get_piece`, `create_draft`, `update_draft`.

1. Set `MCP_API_KEY` in `.env.local` (and in Vercel) to a long random string, e.g. the output of `openssl rand -hex 32`. In local development the key is optional.
2. Connect Claude:
   - **Claude Code**:
     ```bash
     claude mcp add --transport http thinkinproducts https://YOUR-DOMAIN/api/mcp --header "Authorization: Bearer YOUR_MCP_API_KEY"
     ```
     For local testing use `http://localhost:3000/api/mcp`.
   - **Claude Desktop**: add this to `claude_desktop_config.json`:
     ```json
     {
       "mcpServers": {
         "thinkinproducts": {
           "command": "npx",
           "args": ["mcp-remote", "https://YOUR-DOMAIN/api/mcp", "--header", "Authorization: Bearer YOUR_MCP_API_KEY"]
         }
       }
     }
     ```
   - **claude.ai**: Settings → Connectors → Add custom connector, with the URL `https://YOUR-DOMAIN/api/mcp?key=YOUR_MCP_API_KEY`. Treat that URL like a password.
3. Ask Claude something like: *"Read the ThinkInProducts writing guide, then draft a case study on Slack's pivot from a game company."*

The writing guide Claude reads is in `src/lib/writing-guide.ts`. Edit it to change the house style.

## Connect Supabase (database, login, images)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: run `supabase/migrations/0001_init.sql`, then `0002_sections_seo_metrics.sql`, then `0003_authors_inbox.sql`. They create the tables, access rules, an image bucket called `media`, page-view counting and email stats.
3. **Project settings → API**: copy the URL, the `anon` key and the `service_role` key into `.env.local` (copy `.env.example` first).
4. **Authentication → URL configuration**: set Site URL to your site address, and add `http://localhost:3000/auth/callback` and `https://YOUR-DOMAIN/auth/callback` to Redirect URLs.
5. **Google login**: in Google Cloud Console create an OAuth client (type: Web application). Add `https://YOUR-PROJECT.supabase.co/auth/v1/callback` as an authorised redirect URI. Paste the client ID and secret into Supabase under **Authentication → Providers → Google**.
6. Restart `npm run dev`. Reader accounts (for Plus and Pro) sign up at `/login`. The admin has its own sign-in, set up with `npm run admin:setup`.
7. In an empty section of the admin, click **Import the 4 sample pieces** to copy them into the database.

## Connect Resend (newsletter email)

1. Sign up at [resend.com](https://resend.com) and verify your domain (add the DNS records it gives you).
2. Create an API key and set `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local`.
3. For open, click and bounce numbers: **Resend → Webhooks → Add endpoint** with `https://YOUR-DOMAIN/api/webhooks/resend`, and tick the `email.*` events. Copy the signing secret into `RESEND_WEBHOOK_SECRET`. Bounces and spam complaints unsubscribe that address automatically.
4. Until Resend is set up, confirmation links are printed in the terminal running `npm run dev`.

Resend's free plan sends 3,000 emails a month with a limit of 100 a day. A weekly issue to more than about 100 people needs a paid plan.

## Get found on Google

Already built in:

- A title, description and canonical address on every page, and Open Graph and Twitter cards with a share image made for each piece (`/og`).
- Structured data that Google reads: Organization and WebSite (with site search) on the home page, Article or BlogPosting plus breadcrumbs on every piece, and CollectionPage on section pages.
- `/sitemap.xml` (updated as you publish), `/robots.txt` (keeps the admin, login and API out of search), `/rss.xml`, and a web app manifest with icons.
- Clean addresses like `/case-studies/netflix-dvd-to-streaming`. Old `/p/...` links redirect permanently.

After you deploy:

1. Set `NEXT_PUBLIC_SITE_URL` to your real domain (e.g. `https://thinkinproducts.com`) and `NEXT_PUBLIC_AUTHOR_NAME` to your name.
2. Go to [Google Search Console](https://search.google.com/search-console), add your domain as a property and verify it. The easiest way is a DNS record. Or choose "HTML tag", copy only the `content` value into `GOOGLE_SITE_VERIFICATION`, and redeploy.
3. In Search Console → **Sitemaps**, submit `https://YOUR-DOMAIN/sitemap.xml`.
4. Use **URL inspection → Request indexing** for the home page and each new piece you want found quickly.
5. Do the same in [Bing Webmaster Tools](https://www.bing.com/webmasters) (it can import from Search Console).
6. Check a piece with Google's [Rich Results Test](https://search.google.com/test/rich-results).

Writing habits that help: fill in the search title (under 60 characters) and search description (140 to 160 characters) in each piece's settings, give every image a description, and link between related pieces.

## Security

- **Admin**: password + two-factor code, signed HttpOnly session cookie (SameSite=Strict, Secure on the live site), idle and absolute timeouts, sign-in rate limits, and a check on every admin page and admin API call (twice: once in `src/proxy.ts`, once in the page or route).
- **Forms** (contact, write for us, subscribe): requests from other sites are refused; a hidden field catches bots; a signed token rejects forms sent too fast or too late; limits per address; spammy messages (lots of links) are dropped quietly. For extra protection add free Cloudflare Turnstile keys to `.env.local`.
- **Every page**: security headers, including a Content Security Policy, HSTS on the live site, no framing by other sites, and no browser access to camera, microphone or location.
- **Content**: Markdown can't contain HTML or scripts. Image uploads accept only real PNG, JPG, WebP, GIF and AVIF files under 8 MB (no SVG, which can carry scripts).
- **Database**: Supabase row-level security on every table. The inbox has no public access at all; only the server reads it.
- **MCP**: needs `MCP_API_KEY` on the live site; it's switched off without one.

Rate limits are kept in memory, so on a host with many server instances each has its own count. The forms also count stored messages per (hashed) address, which holds across instances.

## Before launch

- **Images**: the samples use photos from Wikimedia Commons, credited under each image. Open each credit link and check its licence allows your use and that the credit matches what the licence asks for.
- **Newsletter issue #1** is signed "[Your name]". Change it in the admin.
- **Your author page**: check the bio in **Admin → Authors** (I drafted it), and add your LinkedIn or other links.
- **Privacy page** (`/privacy`) is a draft. Have it checked before you collect emails or payments.

## Deploy

Push to GitHub, import the repo in [Vercel](https://vercel.com), and add the same environment variables there. Set `NEXT_PUBLIC_SITE_URL` to your real domain.

Local mode stores data in files, which doesn't work on Vercel. Connect Supabase before deploying.

## What's where

| Path | What it is |
| --- | --- |
| `src/lib/types.ts` | The content model: sections, pieces and every block type |
| `src/lib/blocks.ts` | The "add block" menu, defaults for new blocks, reading time |
| `src/lib/repo.ts` | Where pieces are saved: Supabase, or `.data/` in local mode |
| `src/components/blocks/` | How each block looks and animates on the site |
| `src/lib/email/PieceEmail.tsx` | How each block looks in email |
| `src/components/admin/` | Dashboard, section lists, editor, block forms |
| `src/app/api/mcp/route.ts` | The MCP server for Claude |
| `src/lib/seo.tsx`, `src/app/sitemap.ts`, `robots.ts` | Search engine setup |
| `src/lib/seed.ts` | The 4 sample pieces |
| `supabase/migrations/` | Database tables and access rules |

**Adding a new block type:** add it to `types.ts`, give it a menu entry and defaults in `blocks.ts`, a form in `admin/BlockEditors.tsx`, a web view in `blocks/PieceView.tsx`, an email view in `PieceEmail.tsx`, and a schema in `src/lib/mcp-schema.ts` so Claude can use it.

## Still to build

- Payments with Razorpay Subscriptions (plans table and memberships are ready)
- Account page: plan and invoices
- Scheduled newsletter sends
