// ─────────────────────────────────────────────
// Roadmap — DB shapes (from get_roadmap_with_nodes RPC)
// ─────────────────────────────────────────────

export type NodeDifficulty = "beginner" | "intermediate" | "advanced";

export interface NodeResource {
  label: string;
  url: string;
  type: "article" | "book" | "video" | "tool";
}

/** Shape returned by get_roadmap_with_nodes() — node without heavy description field */
export interface RoadmapNodeDB {
  id: string;
  title: string;
  summary: string;
  difficulty: NodeDifficulty;
  estimated_hours: number;
  order_index: number;
  tags: string[];
  resources: NodeResource[];
  is_published: boolean;
}

/** Shape returned by get_roadmap_with_nodes() — phase with nested nodes */
export interface RoadmapPhaseDB {
  id: string;
  title: string;
  description: string;
  order_index: number;
  color: string;
  created_at: string;
  nodes: RoadmapNodeDB[];
}

// ─────────────────────────────────────────────
// Roadmap — legacy UI types (kept for compat)
// ─────────────────────────────────────────────

export type NodeType = "concept" | "skill" | "framework" | "soft-skill" | "project";
export type NodeStatus = "published" | "draft" | "coming_soon" | "archived";

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: NodeType;
  status: NodeStatus;
  phase_id: string;
  order: number;
  estimated_hours: number;
  /** Optional link to an article or external resource */
  resource_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  order: number;
  nodes: RoadmapNode[];
}

// ─────────────────────────────────────────────
// Articles
// ─────────────────────────────────────────────

export type ArticleDifficulty = "beginner" | "intermediate" | "advanced";
export type ArticleStatus = "published" | "draft" | "archived";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  author: string;
  tags: string[];
  difficulty: ArticleDifficulty;
  read_time_minutes: number;
  published_at: string;
  status: ArticleStatus;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// Portfolio — DB shape (matches portfolio_cases table)
// ─────────────────────────────────────────────

export interface MetricItem {
  label: string;
  value: string;
}

/** Full DB row — used in case study detail page */
export interface PortfolioCaseDB {
  id: string;
  title: string;
  slug: string;
  company: string | null;
  role: string | null;
  timeline: string | null;
  problem: string | null;       // plain text — shown as callout
  approach: string | null;      // markdown
  outcome: string | null;       // markdown
  learnings: string | null;     // markdown — styled as numbered insights
  tags: string[];
  figma_url: string | null;
  cover_image_url: string | null;
  metrics: MetricItem[];
  is_featured: boolean;
  status: "draft" | "published";
  order_index: number;
  created_at: string;
  updated_at: string;
}

/** Lighter shape used in the index grid (no heavy markdown fields) */
export type PortfolioCaseSummary = Pick<
  PortfolioCaseDB,
  | "id" | "title" | "slug" | "company" | "role" | "tags"
  | "problem" | "cover_image_url" | "metrics" | "is_featured" | "order_index"
>;

// ─────────────────────────────────────────────
// Portfolio / Case Studies — legacy UI types
// ─────────────────────────────────────────────

export type CaseStatus = "published" | "draft" | "archived";

export interface PortfolioCase {
  id: string;
  title: string;
  slug: string;
  company: string;
  industry: string;
  problem_statement: string;
  /** Short outcome summary shown in listings */
  outcome: string;
  /** Full structured content for the detail page */
  content?: string;
  cover_image?: string | null;
  tags: string[];
  difficulty: ArticleDifficulty;
  published_at: string;
  status: CaseStatus;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// Newsletter
// ─────────────────────────────────────────────

export type SubscriberStatus = "active" | "unsubscribed" | "bounced";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  subscribed_at: string;
  unsubscribed_at?: string | null;
  source?: string;
}

// ─────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────

export interface ApiSuccessResponse {
  success: true;
}

export interface ApiErrorResponse {
  error: string;
}

export type ApiResponse<T = ApiSuccessResponse> = T | ApiErrorResponse;
