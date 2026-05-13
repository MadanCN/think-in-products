-- ============================================================
-- 001_initial_schema.sql
-- Think In Products — initial database schema + seed data
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- future full-text search on titles


-- ============================================================
-- TABLES
-- ============================================================

-- 1. roadmap_phases
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  description  text,
  order_index  integer     NOT NULL DEFAULT 0,
  color        text        NOT NULL DEFAULT '#00E5CC',  -- hex accent colour
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  roadmap_phases               IS 'Top-level learning phases (e.g. Foundations, Core Skills)';
COMMENT ON COLUMN roadmap_phases.color         IS 'Hex colour used in UI phase indicators';
COMMENT ON COLUMN roadmap_phases.order_index   IS 'Display order (ascending)';


-- 2. roadmap_nodes
CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id         uuid        NOT NULL REFERENCES roadmap_phases(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  summary          text,                                   -- one-line card description
  description      text,                                   -- full markdown body
  difficulty       text        NOT NULL DEFAULT 'beginner'
                               CHECK (difficulty IN ('beginner','intermediate','advanced')),
  estimated_hours  integer     NOT NULL DEFAULT 2 CHECK (estimated_hours > 0),
  order_index      integer     NOT NULL DEFAULT 0,
  is_published     boolean     NOT NULL DEFAULT true,
  resources        jsonb       NOT NULL DEFAULT '[]',
    -- each element: { "label": string, "url": string, "type": "article"|"book"|"video"|"tool" }
  tags             text[]      NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  roadmap_nodes              IS 'Individual learning modules within a phase';
COMMENT ON COLUMN roadmap_nodes.resources    IS 'JSONB array: [{label, url, type}]';
COMMENT ON COLUMN roadmap_nodes.summary      IS 'Short blurb shown on cards';
COMMENT ON COLUMN roadmap_nodes.description  IS 'Full markdown content for the node detail page';

CREATE INDEX idx_roadmap_nodes_phase_id     ON roadmap_nodes(phase_id);
CREATE INDEX idx_roadmap_nodes_is_published ON roadmap_nodes(is_published);
CREATE INDEX idx_roadmap_nodes_tags         ON roadmap_nodes USING gin(tags);


-- 3. articles
CREATE TABLE IF NOT EXISTS articles (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text        UNIQUE NOT NULL,
  title               text        NOT NULL,
  excerpt             text,
  content             text,       -- markdown / MDX
  cover_image         text,
  author              text        NOT NULL DEFAULT 'Think in Products',
  difficulty          text        NOT NULL DEFAULT 'beginner'
                                  CHECK (difficulty IN ('beginner','intermediate','advanced')),
  tags                text[]      NOT NULL DEFAULT '{}',
  status              text        NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft','published','archived')),
  read_time_minutes   integer     NOT NULL DEFAULT 5 CHECK (read_time_minutes > 0),
  view_count          integer     NOT NULL DEFAULT 0,
  published_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  articles            IS 'Long-form PM articles and framework breakdowns';
COMMENT ON COLUMN articles.view_count IS 'Incremented by increment_article_views() function';

CREATE INDEX idx_articles_status       ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_tags         ON articles USING gin(tags);
CREATE INDEX idx_articles_slug         ON articles(slug);
CREATE INDEX idx_articles_title_trgm   ON articles USING gin(title gin_trgm_ops);


-- 4. portfolio_cases
CREATE TABLE IF NOT EXISTS portfolio_cases (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  company          text,
  role             text,
  timeline         text,
  problem          text,
  approach         text,       -- markdown
  outcome          text,       -- markdown
  learnings        text,       -- markdown
  tags             text[]      NOT NULL DEFAULT '{}',
  figma_url        text,
  cover_image_url  text,
  metrics          jsonb       NOT NULL DEFAULT '[]',
    -- each element: { "label": string, "value": string }
  is_featured      boolean     NOT NULL DEFAULT false,
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','published')),
  order_index      integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  portfolio_cases         IS 'Product case studies with annotated problem/approach/outcome';
COMMENT ON COLUMN portfolio_cases.metrics IS 'JSONB array: [{label, value}]';

CREATE INDEX idx_portfolio_cases_status      ON portfolio_cases(status);
CREATE INDEX idx_portfolio_cases_is_featured ON portfolio_cases(is_featured);
CREATE INDEX idx_portfolio_cases_tags        ON portfolio_cases USING gin(tags);


-- 5. newsletter_subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        UNIQUE NOT NULL,
  name             text,
  status           text        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active','unsubscribed')),
  source           text,       -- 'homepage', 'roadmap', 'article', etc.
  subscribed_at    timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at  timestamptz
);

COMMENT ON TABLE  newsletter_subscribers        IS 'Email list subscribers';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Page or component the user subscribed from';

CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_subscribers_email  ON newsletter_subscribers(email);


-- 6. newsletter_broadcasts
CREATE TABLE IF NOT EXISTS newsletter_broadcasts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text        NOT NULL,
  preview_text     text,
  content          text,       -- HTML
  status           text        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','sent')),
  sent_at          timestamptz,
  recipient_count  integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE newsletter_broadcasts IS 'Sent and draft email campaigns';

CREATE INDEX idx_newsletter_broadcasts_status ON newsletter_broadcasts(status);


-- 7. site_settings  (key-value store for CMS-managed content)
CREATE TABLE IF NOT EXISTS site_settings (
  key         text    PRIMARY KEY,
  value       jsonb   NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE site_settings IS 'Admin-editable site-wide settings stored as JSONB';


-- ============================================================
-- updated_at TRIGGER (applied to all tables with that column)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_roadmap_nodes_updated_at
  BEFORE UPDATE ON roadmap_nodes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_portfolio_cases_updated_at
  BEFORE UPDATE ON portfolio_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_newsletter_broadcasts_updated_at
  BEFORE UPDATE ON newsletter_broadcasts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE roadmap_phases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_cases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_broadcasts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings           ENABLE ROW LEVEL SECURITY;

-- Public: read all phases (phase visibility controlled at node level)
CREATE POLICY "public_read_roadmap_phases"
  ON roadmap_phases FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public: read only published nodes
CREATE POLICY "public_read_published_nodes"
  ON roadmap_nodes FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Public: read only published articles
CREATE POLICY "public_read_published_articles"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Public: read only published portfolio cases
CREATE POLICY "public_read_published_portfolio"
  ON portfolio_cases FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Public: read site settings
CREATE POLICY "public_read_site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- No public write on any table — admin ops go through service role (bypasses RLS)
-- newsletter_subscribers: allow anon insert only (for the subscribe form)
CREATE POLICY "anon_insert_subscriber"
  ON newsletter_subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

-- newsletter_subscribers: users can update their own row to unsubscribe
CREATE POLICY "anon_update_own_subscription"
  ON newsletter_subscribers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (status IN ('active','unsubscribed'));


-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Phase UUIDs (hardcoded so node inserts can reference them) ──
DO $$
DECLARE
  phase1_id uuid := 'a0000001-0000-0000-0000-000000000001';
  phase2_id uuid := 'a0000002-0000-0000-0000-000000000002';
  phase3_id uuid := 'a0000003-0000-0000-0000-000000000003';
  phase4_id uuid := 'a0000004-0000-0000-0000-000000000004';
BEGIN

-- ── Phases ──────────────────────────────────────────────────

INSERT INTO roadmap_phases (id, title, description, order_index, color) VALUES
  (
    phase1_id,
    'Phase 1 — Foundations',
    'Build the mental models that every PM needs before writing a single line of spec. This phase is about thinking, not doing — and doing it in the right order.',
    1,
    '#00E5CC'
  ),
  (
    phase2_id,
    'Phase 2 — Core Skills',
    'The craft layer. Learn how to write docs that get things built, prioritise ruthlessly, define success metrics that actually measure what matters, and build roadmaps that communicate strategy.',
    2,
    '#6366F1'
  ),
  (
    phase3_id,
    'Phase 3 — Execution',
    'Shipping is a team sport. This phase covers the rituals, communication patterns, and data skills you need to take a feature from discovery to live — and measure what happened.',
    3,
    '#F59E0B'
  ),
  (
    phase4_id,
    'Phase 4 — Advanced',
    'For PMs who can execute and want to think bigger. Growth loops, platform strategy, zero-to-one bets, and the craft of leading other PMs.',
    4,
    '#EC4899'
  );


-- ── Phase 1 Nodes ────────────────────────────────────────────

INSERT INTO roadmap_nodes
  (phase_id, title, summary, description, difficulty, estimated_hours, order_index, tags, resources)
VALUES
  (
    phase1_id,
    'What is Product Management?',
    'Role clarity, org context, and the honest version of what PMs actually do day-to-day.',
    E'## What is Product Management?\n\nBefore writing specs or running sprints, you need a clear mental model of what the job actually is — because the popular version is wrong.\n\nProduct management is not about having the "CEO of the product" title or being the decision-maker in the room. It''s about creating the conditions under which a cross-functional team can make good decisions, fast.\n\nA PM''s core leverage is:\n- **Information**: surfacing user and market context the team otherwise can''t see\n- **Clarity**: turning ambiguous problems into scoped, testable hypotheses\n- **Alignment**: building shared understanding so the team builds the same thing\n\n## PM vs APM vs CPO\n\nThe scope changes at each level but the core loop doesn''t. An APM is learning the craft. A PM owns a problem space. A Senior PM makes other PMs better. A CPO sets the system that produces good product decisions at scale.\n\n## What PMs don''t own\n\nPMs don''t own the design, the code, or the go-to-market strategy. They''re accountable for outcomes — not deliverables.',
    'beginner',
    2,
    1,
    ARRAY['role', 'mindset', 'fundamentals'],
    '[
      {"label": "Inspired — Marty Cagan", "url": "https://www.svpg.com/inspired-how-to-create-tech-products-customers-love/", "type": "book"},
      {"label": "Escaping the Build Trap — Melissa Perri", "url": "https://melissaperri.com/book", "type": "book"},
      {"label": "What does a product manager do? — Lenny Rachitsky", "url": "https://www.lennysnewsletter.com/p/what-does-a-product-manager-do", "type": "article"}
    ]'::jsonb
  ),

  (
    phase1_id,
    'Product Thinking',
    'How to reason about value, feasibility, usability, and viability — and why most teams optimise for the wrong one.',
    E'## Product Thinking\n\nProduct thinking is the practice of framing every decision in terms of user value and business value simultaneously. It''s the opposite of feature thinking, which frames decisions in terms of "what do we build next?"\n\n## The Four Risks\n\nMarty Cagan''s four product risks are the most useful checklist in PM:\n\n1. **Value risk** — do users actually want this?\n2. **Usability risk** — can users figure out how to use it?\n3. **Feasibility risk** — can we build it with our current team and stack?\n4. **Viability risk** — does it work for our business model, legal, sales?\n\nMost teams spend 90% of their effort on feasibility and zero time on value. Flip the ratio in discovery.\n\n## Jobs-to-be-Done\n\nClayton Christensen''s JTBD framework reframes what you''re actually selling. People don''t buy a drill — they hire it to make a hole. Understanding the "job" a user is hiring your product for unlocks better positioning, better features, and better onboarding.',
    'beginner',
    3,
    2,
    ARRAY['frameworks', 'mindset', 'jtbd'],
    '[
      {"label": "Competing Against Luck — Clayton Christensen", "url": "https://www.harpercollins.com/products/competing-against-luck-clayton-m-christensontaddy-halltodai-dillonkaren-dillon", "type": "book"},
      {"label": "The Four Big Risks — Marty Cagan (SVPG)", "url": "https://www.svpg.com/four-big-risks/", "type": "article"},
      {"label": "Shape Up — Ryan Singer (Basecamp)", "url": "https://basecamp.com/shapeup", "type": "book"}
    ]'::jsonb
  ),

  (
    phase1_id,
    'User Research Fundamentals',
    'The practical skill set for talking to users, separating signal from noise, and building evidence for decisions.',
    E'## User Research Fundamentals\n\nResearch is not a phase — it''s a continuous practice. The goal is never to "validate" an idea you already love. The goal is to reduce uncertainty about whether a problem is real and a solution will work.\n\n## The Mom Test\n\nRob Fitzpatrick''s rule: never ask someone if they like your idea. They''ll lie to make you feel good. Instead, ask about their life, their past behaviour, and how they currently solve the problem. People can''t lie about the past.\n\n## Interview structure\n\n1. **Opening**: establish context, explain you''re researching (not selling)\n2. **Problem exploration**: tell me about the last time you had to do X…\n3. **Current behaviour**: walk me through what you actually do today\n4. **Pain points**: what''s the most frustrating part of that?\n5. **Closing**: who else should I talk to?\n\n## What to do with the data\n\nAffinty mapping: print or list all quotes, cluster by theme, name the clusters. The clusters that appear in 5+ interviews are real problems. The rest are noise.',
    'beginner',
    4,
    3,
    ARRAY['discovery', 'research', 'users'],
    '[
      {"label": "The Mom Test — Rob Fitzpatrick", "url": "https://www.momtestbook.com/", "type": "book"},
      {"label": "Continuous Discovery Habits — Teresa Torres", "url": "https://www.producttalk.org/2021/05/continuous-discovery-habits/", "type": "book"},
      {"label": "How to talk to users — YC Startup School", "url": "https://www.ycombinator.com/library/6g-how-to-talk-to-users", "type": "video"}
    ]'::jsonb
  ),

  (
    phase1_id,
    'Stakeholder Management',
    'How to build trust with engineering, design, sales, and leadership without becoming a project manager or a yes-machine.',
    E'## Stakeholder Management\n\nStakeholder management is the part of PM that nobody teaches and everyone learns painfully. Done badly, you''re either a yes-machine who ships whatever the loudest person asks for, or an ivory-tower PM who "protects the team" and loses all executive support.\n\n## The core principle\n\nStakeholders have information you don''t. They also have goals that may conflict with the user. Your job is to extract the information, synthesise it with user evidence, and make a transparent call — then explain it.\n\n## Engineering trust\n\nEngineers lose trust in PMs who:\n- Change scope mid-sprint without explanation\n- Spec solutions instead of problems\n- Can''t answer "why are we doing this?"\n\nEngineers gain trust in PMs who involve them in discovery, explain the reasoning behind decisions, and protect the team from context-switching.\n\n## Managing upward\n\nLeadership wants to know: are we working on the right things, are we making progress, and will this deliver the outcome we need? Speak their language — revenue, retention, risk reduction — not feature names.',
    'intermediate',
    3,
    4,
    ARRAY['collaboration', 'leadership', 'communication'],
    '[
      {"label": "Radical Candor — Kim Scott", "url": "https://www.radicalcandor.com/the-book/", "type": "book"},
      {"label": "How to influence without authority — First Round Review", "url": "https://review.firstround.com/how-to-influence-without-authority", "type": "article"},
      {"label": "The Making of a Manager — Julie Zhuo", "url": "https://www.juliezhuo.com/book/manager.html", "type": "book"}
    ]'::jsonb
  );


-- ── Phase 2 Nodes ────────────────────────────────────────────

INSERT INTO roadmap_nodes
  (phase_id, title, summary, description, difficulty, estimated_hours, order_index, tags, resources)
VALUES
  (
    phase2_id,
    'Writing PRDs That Get Built',
    'How to write product specs that align teams, surface disagreements early, and survive contact with reality.',
    E'## Writing PRDs That Get Built\n\nA PRD is not a contract. It''s a communication tool. The purpose is not to document what you''ve decided — it''s to create a shared understanding that lets the team build the right thing without you in every room.\n\n## The sections that matter\n\n1. **Problem statement**: what user problem are we solving, and what evidence do we have that it''s real?\n2. **Success metrics**: how will we know this worked? (Not output metrics — outcome metrics)\n3. **Scope**: what''s in, what''s explicitly out, and why\n4. **User flows / scenarios**: the specific situations we''re designing for\n5. **Open questions**: things we don''t know yet\n\n## The sections that don''t\n\nBackground sections longer than one paragraph. Exhaustive edge-case tables nobody reads. Solution descriptions that are actually wireframes in text.\n\n## The real purpose\n\nThe best PRD is the one that generates the most useful disagreements in review. If engineering, design, and data science all read it and nod, you probably haven''t been specific enough about the hard parts.',
    'intermediate',
    3,
    1,
    ARRAY['writing', 'alignment', 'specs', 'prd'],
    '[
      {"label": "How I write PRDs — Lenny Rachitsky", "url": "https://www.lennysnewsletter.com/p/how-i-write-prds", "type": "article"},
      {"label": "Shape Up — Ryan Singer (Basecamp)", "url": "https://basecamp.com/shapeup", "type": "book"},
      {"label": "Inspired — Marty Cagan (Chapter: Product Spec)", "url": "https://www.svpg.com/inspired-how-to-create-tech-products-customers-love/", "type": "book"}
    ]'::jsonb
  ),

  (
    phase2_id,
    'Prioritisation',
    'Cutting through the noise to work on what actually matters — and defending those decisions.',
    E'## Prioritisation\n\nPrioritisation is not a framework problem. It''s a clarity problem. Most teams use RICE or MoSCoW as a way to feel rigorous without having the hard conversation: "we can''t do everything, so what are we willing not to do?"\n\n## RICE scoring\n\n**R**each × **I**mpact × **C**onfidence ÷ **E**ffort\n\nUseful for comparing items within the same problem space. Breaks down when comparing items across different user groups or business goals.\n\n## Opportunity scoring\n\nKano model alternative: survey users on importance vs. satisfaction. High importance + low satisfaction = opportunity. High importance + high satisfaction = table stakes (don''t differentiate here). Low importance + anything = ignore.\n\n## The real conversation\n\nFrameworks are tools for having the conversation, not replacing it. The best prioritisation sessions end with: "here''s what we''re not doing and why." If nobody is uncomfortable, you haven''t made real trade-offs.',
    'intermediate',
    3,
    2,
    ARRAY['prioritisation', 'strategy', 'frameworks', 'decision-making'],
    '[
      {"label": "RICE scoring model — Intercom", "url": "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/", "type": "article"},
      {"label": "Escaping the Build Trap — Melissa Perri", "url": "https://melissaperri.com/book", "type": "book"},
      {"label": "How to prioritise — Shreyas Doshi (Twitter thread)", "url": "https://twitter.com/shreyas/status/1249039638829793280", "type": "article"}
    ]'::jsonb
  ),

  (
    phase2_id,
    'Metrics & OKRs',
    'Defining success before you start building — and choosing metrics that actually measure what you care about.',
    E'## Metrics & OKRs\n\nThe hardest metric conversation isn''t about data — it''s about honesty. What outcome are you actually trying to drive? Most teams optimise for output metrics (features shipped, active users) because they''re easy to move. Outcome metrics (time-to-value, retention at day 30, revenue per user) are harder to move and much more valuable.\n\n## The metric stack\n\n1. **North Star Metric** — the single number that captures the value your product delivers\n2. **Input metrics** — the 3–5 things the team can directly influence that drive the NSM\n3. **Guard rails** — metrics you must not damage (e.g. support ticket rate, p99 latency)\n\n## OKRs that work\n\nObjectives should be inspiring and directional. Key Results should be measurable outcomes (not tasks). "Launch the new onboarding flow" is a task. "Increase day-7 retention from 28% to 40%" is a Key Result.\n\n## Common traps\n\n- Vanity metrics: total registered users, total pageviews\n- Gaming: optimising for the metric instead of the underlying behaviour\n- Too many KRs: focus collapses when you have more than 3 per objective',
    'intermediate',
    4,
    3,
    ARRAY['metrics', 'okrs', 'data', 'north-star'],
    '[
      {"label": "Measure What Matters — John Doerr", "url": "https://www.whatmatters.com/the-book/", "type": "book"},
      {"label": "Choosing your North Star Metric — Lenny Rachitsky", "url": "https://www.lennysnewsletter.com/p/north-star-metric", "type": "article"},
      {"label": "The Input Metric Framework — First Round Review", "url": "https://review.firstround.com/the-input-metric-framework-for-product-managers", "type": "article"}
    ]'::jsonb
  ),

  (
    phase2_id,
    'Roadmapping',
    'Building a roadmap that communicates strategy, not just a Gantt chart of features.',
    E'## Roadmapping\n\nA roadmap is not a commitment. It''s a communication tool that answers: "given our strategy, this is the sequence of bets we''re making and why."\n\nIf your roadmap is a list of features with dates, it''s a project plan. Useful for coordination — terrible for strategy.\n\n## Now / Next / Later\n\nThe most durable roadmap format. Three columns:\n- **Now**: what we''re building and why\n- **Next**: what we''re planning, but details still being shaped\n- **Later**: directional bets — not committed, not scoped\n\nThis communicates strategy without over-committing to timelines.\n\n## Themes vs features\n\nTheme-based roadmaps ("Improve onboarding quality", "Reduce time-to-first-value") communicate strategy better than feature lists. They also give the team room to solve the problem instead of just shipping the solution you imagined.\n\n## The audience\n\nDifferent roadmap views for different audiences:\n- **Engineering**: detailed, scoped, sequenced\n- **Executives**: outcomes, timelines, resources\n- **Sales/CS**: when things that affect customers are shipping',
    'intermediate',
    3,
    4,
    ARRAY['roadmapping', 'strategy', 'communication', 'planning'],
    '[
      {"label": "Product Roadmaps Relaunched — C. Todd Lombardo et al.", "url": "https://www.oreilly.com/library/view/product-roadmaps-relaunched/9781491971710/", "type": "book"},
      {"label": "Now/Next/Later roadmap — Janna Bastow", "url": "https://www.prodpad.com/blog/invented-now-next-later-roadmap/", "type": "article"},
      {"label": "How to build a roadmap — Lenny Rachitsky", "url": "https://www.lennysnewsletter.com/p/how-to-build-a-product-roadmap", "type": "article"}
    ]'::jsonb
  );


-- ── Phase 3 Nodes ────────────────────────────────────────────

INSERT INTO roadmap_nodes
  (phase_id, title, summary, description, difficulty, estimated_hours, order_index, tags, resources)
VALUES
  (
    phase3_id,
    'Agile & Scrum for PMs',
    'What PM-in-agile actually looks like — not the theory, but the daily practice of sprints, ceremonies, and backlog health.',
    E'## Agile & Scrum for PMs\n\nAgile is a set of values. Scrum is a framework. Most teams practice neither — they practice "scrumfall", where agile vocabulary is layered on top of waterfall thinking.\n\nAs a PM in a scrum team, your job in each ceremony:\n\n- **Sprint planning**: have a prioritised, well-groomed backlog of user stories with clear acceptance criteria. Don''t bring in anything the team hasn''t seen before.\n- **Daily standup**: listen for blockers. Remove them before they compound.\n- **Sprint review / demo**: make this real. Invite stakeholders. Celebrate progress.\n- **Retrospective**: your job is to make it psychologically safe enough for the team to say what''s not working.\n\n## Backlog hygiene\n\nA backlog older than 6 weeks is a graveyard. Regularly prune items that are no longer relevant. Keep the top 2 sprints'' worth of work well-groomed; everything else can be rough.\n\n## User stories that work\n\n"As a [user], I want to [action] so that [outcome]" is a starting point, not a template. The real value is in the acceptance criteria — the specific, testable conditions under which the story is done.',
    'beginner',
    3,
    1,
    ARRAY['agile', 'scrum', 'process', 'execution'],
    '[
      {"label": "The Scrum Guide — Ken Schwaber & Jeff Sutherland", "url": "https://scrumguides.org/scrum-guide.html", "type": "article"},
      {"label": "Shape Up — Ryan Singer (Basecamp)", "url": "https://basecamp.com/shapeup", "type": "book"},
      {"label": "Continuous Discovery Habits — Teresa Torres", "url": "https://www.producttalk.org/2021/05/continuous-discovery-habits/", "type": "book"}
    ]'::jsonb
  ),

  (
    phase3_id,
    'Cross-functional Collaboration',
    'Building effective working relationships with engineering, design, data, marketing, and sales — without becoming a meeting machine.',
    E'## Cross-functional Collaboration\n\nThe most important skill in PM is not writing PRDs — it''s building the kind of working relationship with engineers and designers where the team surfaces problems early, shares context freely, and disagrees without politics.\n\n## With engineering\n\nThe trust gap between PM and engineering is almost always caused by:\n1. PMs changing priorities without explanation\n2. PMs solving problems instead of sharing them\n3. Engineers not understanding why something matters\n\nFix all three by involving engineers in discovery and being transparent about trade-offs.\n\n## With design\n\nGreat PM-design relationships are partnerships, not client-vendor. Bring designers into the problem definition phase, not the solution review phase. They''ll design better solutions when they understand the constraint.\n\n## With data science / analytics\n\nHave data partners review your metrics definitions before you ship. A badly instrumented feature is worse than an uninstrumented one — it gives you false confidence.\n\n## With sales and CS\n\nThese teams have the most unfiltered user feedback in the company. Set up a lightweight feedback loop (a shared Slack channel, a bi-weekly 30-min sync) and it will pay dividends.',
    'intermediate',
    3,
    2,
    ARRAY['collaboration', 'engineering', 'design', 'cross-functional'],
    '[
      {"label": "Radical Candor — Kim Scott", "url": "https://www.radicalcandor.com/the-book/", "type": "book"},
      {"label": "The Making of a Manager — Julie Zhuo", "url": "https://www.juliezhuo.com/book/manager.html", "type": "book"},
      {"label": "Working with engineers — Lenny Rachitsky", "url": "https://www.lennysnewsletter.com/p/how-to-work-with-engineers", "type": "article"}
    ]'::jsonb
  ),

  (
    phase3_id,
    'Launch Planning',
    'How to take a feature from "code complete" to live — and everything that happens between those two states.',
    E'## Launch Planning\n\nShipping is a cross-functional event. Code complete is not launch. Launch is when users can find it, support can handle questions about it, sales knows how to talk about it, and you have monitoring in place to know if it''s working.\n\n## The launch checklist categories\n\n1. **Product**: feature flags, rollout plan (10% → 50% → 100%), rollback plan\n2. **Instrumentation**: are all the events firing? Is the dashboard ready?\n3. **Comms**: internal announcement, help docs, changelog entry, in-app tooltip if needed\n4. **Support**: CS team briefed, FAQ written, known edge cases documented\n5. **Go-to-market**: sales enabled (if customer-facing), marketing copy ready\n\n## Soft launch vs hard launch\n\nFor most features, a soft launch (gradual rollout, no marketing) de-risks everything. Hard launches (press, product hunt, email blast) are for when you''re confident and want distribution.\n\n## The retrospective\n\nRun a launch retrospective 2–3 weeks after launch: did we hit the success metric? What would we change about the build or launch process?',
    'intermediate',
    3,
    3,
    ARRAY['launch', 'gtm', 'execution', 'planning'],
    '[
      {"label": "The Launch Checklist — Lenny Rachitsky", "url": "https://www.lennysnewsletter.com/p/the-launch-checklist", "type": "article"},
      {"label": "How to Launch a Product — First Round Review", "url": "https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit", "type": "article"},
      {"label": "Sprint — Jake Knapp, John Zeratsky, Braden Kowitz", "url": "https://www.thesprintbook.com/", "type": "book"}
    ]'::jsonb
  ),

  (
    phase3_id,
    'Data Analysis for PMs',
    'How to read dashboards critically, design experiments, and interpret A/B test results without a data science degree.',
    E'## Data Analysis for PMs\n\nYou don''t need to be a data scientist. You do need to be able to read a dashboard critically, spot misleading metrics, design a clean experiment, and know when to call a test.\n\n## Reading dashboards\n\nAlways ask:\n- What is the denominator? (Active users? Sessions? All registered users?)\n- What''s the time window, and is there seasonality?\n- Is this a cohort view or a snapshot? (Snapshots hide retention problems)\n\n## A/B testing basics\n\n1. Formulate a clear hypothesis: "If we [change], we expect [metric] to increase by [amount] because [reason]"\n2. Calculate sample size before running (not after)\n3. Set a significance threshold (p < 0.05) and stick to it\n4. Run for at least one full business cycle (usually 2 weeks)\n5. Check for novelty effects: did users engage more just because something changed?\n\n## When data lies\n\n- **Simpson''s paradox**: an aggregate trend can reverse within subgroups\n- **Survivorship bias**: only analysing retained users hides churn-driven improvements\n- **Instrumentation gaps**: if the event wasn''t firing from day 1, your baseline is wrong',
    'intermediate',
    4,
    4,
    ARRAY['data', 'analytics', 'a/b testing', 'experimentation'],
    '[
      {"label": "Trustworthy Online Controlled Experiments — Kohavi et al.", "url": "https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/D97B26382EB0EB2DC2019A7A7B518F59", "type": "book"},
      {"label": "Practical SQL — Anthony DeBarros", "url": "https://www.nostarch.com/practical-sql-2nd-edition", "type": "book"},
      {"label": "A/B Testing — Evan Miller", "url": "https://www.evanmiller.org/how-not-to-run-an-ab-test.html", "type": "article"}
    ]'::jsonb
  );


-- ── Phase 4 Nodes ────────────────────────────────────────────

INSERT INTO roadmap_nodes
  (phase_id, title, summary, description, difficulty, estimated_hours, order_index, tags, resources)
VALUES
  (
    phase4_id,
    'Growth Strategy',
    'Understanding growth loops, acquisition economics, and how to build a product that compounds.',
    E'## Growth Strategy\n\nGrowth is not a team — it''s a system. The best products grow because the product itself creates the conditions for acquisition, retention, and expansion. That''s a growth loop, and it''s fundamentally different from a growth funnel.\n\n## Growth loops vs funnels\n\nA funnel is linear: acquire → activate → retain → monetise. Each step leaks. A loop is circular: users create value (content, invites, network effects) that brings in new users. Loops compound; funnels don''t.\n\n## Identifying your loop\n\nAsk: when a new user gets value from your product, does that action create anything that attracts another new user? If yes — that''s your loop. If not — you''re relying entirely on paid or earned acquisition.\n\n## Acquisition economics\n\nLTV > CAC is not enough. You need LTV/CAC > 3 and payback period < 12 months. Understand your blended CAC vs. channel CAC — most companies discover their cheapest acquisition channel is referral or SEO, and they''re underinvesting in it.',
    'advanced',
    4,
    1,
    ARRAY['growth', 'strategy', 'loops', 'acquisition'],
    '[
      {"label": "Hacking Growth — Sean Ellis & Morgan Brown", "url": "https://www.seanellis.me/hackingrowth/", "type": "book"},
      {"label": "Hooked — Nir Eyal", "url": "https://www.nirandfar.com/hooked/", "type": "book"},
      {"label": "Growth loops vs funnels — Reforge", "url": "https://www.reforge.com/blog/growth-loops", "type": "article"}
    ]'::jsonb
  ),

  (
    phase4_id,
    'Platform Thinking',
    'How to design products that create ecosystems — and the hard trade-offs that come with becoming a platform.',
    E'## Platform Thinking\n\nA platform creates value by enabling interactions between two or more user groups. Marketplaces, developer ecosystems, app stores — these are platforms. A SaaS product that solves one problem for one user type is a product, not a platform.\n\n## When to think platform\n\nNot every product should be a platform. The question is: are there third parties who want to build on top of your core, and does enabling them create more value than building those things yourself?\n\n## The chicken-and-egg problem\n\nEvery two-sided platform has it. You need buyers to attract sellers and sellers to attract buyers. Successful launches usually solve this by:\n1. Seeding one side manually (Airbnb listing scraping, YouTube''s initial videos)\n2. Single-player mode: the product is valuable without the network\n3. Targeting a tight niche where the network can actually tip\n\n## Platform governance\n\nThe hardest platform decisions are about governance: who gets access, what can third parties do, and how do you handle when a third party''s incentives conflict with your users''?',
    'advanced',
    4,
    2,
    ARRAY['platform', 'strategy', 'ecosystems', 'marketplace'],
    '[
      {"label": "Platform Revolution — Parker, Van Alstyne, Choudary", "url": "https://www.platformrevolution.com/", "type": "book"},
      {"label": "Modern Monopolies — Moazed & Johnson", "url": "https://www.applicoinc.com/book/", "type": "book"},
      {"label": "The Cold Start Problem — Andrew Chen", "url": "https://andrewchen.com/the-cold-start-problem/", "type": "book"}
    ]'::jsonb
  ),

  (
    phase4_id,
    '0-to-1 Products',
    'The specific mindset and practices required to build something from nothing — and why execution-PM skills don''t transfer directly.',
    E'## 0-to-1 Products\n\nBuilding something new requires a completely different operating mode than improving something existing. The skills that make you great at 1-to-N (rigorous prioritisation, data-driven decisions, clean PRDs) can actively slow down 0-to-1 work.\n\n## The 0-to-1 stack\n\n1. **A sharp problem hypothesis**: not "users struggle with X" but "users in [specific context] fail to accomplish [specific job] because [specific constraint], and they''re currently working around it by [doing Y]"\n2. **A falsifiable value hypothesis**: what would have to be true for this to be a 10× better solution?\n3. **The minimal experiment**: what''s the smallest thing we can put in front of users to test the hypothesis?\n\n## When to stop iterating\n\nYou''ve found something when users pull you forward. They tell their friends. They''re upset when it''s unavailable. They use it more than you expected. That''s product-market fit — not an NPS score.\n\n## The founder vs. the PM\n\nIn 0-to-1, the PM''s job looks more like a founder: relentless customer contact, high tolerance for ambiguity, willingness to throw away last week''s thesis. Many PMs find this uncomfortable.',
    'advanced',
    5,
    3,
    ARRAY['zero-to-one', 'pmf', 'strategy', 'innovation'],
    '[
      {"label": "Zero to One — Peter Thiel & Blake Masters", "url": "https://zerotoonebook.com/", "type": "book"},
      {"label": "The Lean Startup — Eric Ries", "url": "https://theleanstartup.com/", "type": "book"},
      {"label": "How Superhuman found PMF — Rahul Vohra", "url": "https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit", "type": "article"}
    ]'::jsonb
  ),

  (
    phase4_id,
    'PM Leadership',
    'How to grow from PM to Staff PM to Head of Product — and the shift from doing to multiplying.',
    E'## PM Leadership\n\nThe transition from IC PM to PM leader is one of the hardest in tech. You spend years building personal leverage (good specs, great discovery, sharp prioritisation) and then have to give most of it up in favour of team leverage.\n\n## What changes at each level\n\n- **Senior PM**: you still own a problem space, but your impact comes from shaping how the team thinks, not just what you personally ship\n- **Staff PM**: you work across teams, influencing direction and connecting dots that don''t connect naturally\n- **Head of Product / CPO**: you''re building the system that produces good product decisions — hiring, culture, process, strategy\n\n## The multiplier mindset\n\nA PM leader''s ROI is measured in what the team produces, not what they personally ship. The shift requires genuine comfort with other people getting the credit and genuine discomfort when you''re the bottleneck.\n\n## Growing PMs\n\nThe best PM managers create the conditions for PMs to develop: real ownership (not guided execution), honest feedback (not just positive reinforcement), and visible career paths tied to demonstrable skills — not tenure.',
    'advanced',
    4,
    4,
    ARRAY['leadership', 'management', 'career', 'head-of-product'],
    '[
      {"label": "Inspired — Marty Cagan (Part 6: The Right Culture)", "url": "https://www.svpg.com/inspired-how-to-create-tech-products-customers-love/", "type": "book"},
      {"label": "Empowered — Marty Cagan & Chris Jones", "url": "https://www.svpg.com/empowered/", "type": "book"},
      {"label": "Staff Engineer — Will Larson (analogous for Staff PM)", "url": "https://staffeng.com/book", "type": "book"}
    ]'::jsonb
  );


-- ── Site Settings ─────────────────────────────────────────────

INSERT INTO site_settings (key, value) VALUES
  (
    'hero_tagline',
    '"A structured path for PMs who want to think more clearly about product work."'::jsonb
  ),
  (
    'about_bio',
    '"Think in Products is a curated learning environment built for aspiring and practicing product managers. Everything here is opinionated — you will find a clear point of view, the reasoning behind it, and the honesty to say when something did not work. No hedged content. No SEO filler."'::jsonb
  ),
  (
    'social_links',
    '{"twitter": "", "linkedin": "", "github": ""}'::jsonb
  ),
  (
    'newsletter_settings',
    '{"from_name": "Think in Products", "reply_to": "hello@thinkinproducts.com", "footer_address": ""}'::jsonb
  );


END $$;
