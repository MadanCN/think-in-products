// Content model. Every piece (article, case study, product breakdown, newsletter issue)
// is a list of blocks. Blocks are plain data: the website, the email, the admin preview
// and the MCP tools all work from the same data.

export type PieceType = "article" | "case_study" | "breakdown" | "newsletter";
export type Access = "free" | "plus" | "pro";
export type PieceStatus = "draft" | "published";
export type Pen = "red" | "blue";

export type Option = { id: string; label: string; feedback: string; correct: boolean };
export type Credit = { credit: string; creditUrl: string };

export type TextBlock = { id: string; type: "text"; markdown: string };
export type ImageBlock = { id: string; type: "image"; src: string; alt: string; caption: string } & Credit;
export type MakeTheCallBlock = { id: string; type: "make_the_call"; scenario: string; question: string; options: Option[] };
export type CheckYourselfBlock = {
  id: string;
  type: "check_yourself";
  question: string;
  options: Option[];
  rightMessage: string;
  rightLinkLabel: string;
  rightLinkHref: string;
  wrongMessage: string;
  wrongLinkLabel: string;
  wrongLinkHref: string;
};
export type Annotation = { id: string; x: number; y: number; text: string; pen: Pen; side: "left" | "right" };
export type MarkedUpImageBlock = { id: string; type: "marked_up_image"; src: string; alt: string; caption: string; notes: Annotation[] } & Credit;
export type ChartRow = { label: string; value: number };
export type ChartBlock = { id: string; type: "chart"; title: string; unit: string; note: string; sourceUrl: string; rows: ChartRow[] };
export type CauseArrowsBlock = { id: string; type: "cause_arrows"; problem: string; reasons: string[] };
export type VennCircle = { label: string; detail: string };
export type VennBlock = { id: string; type: "venn"; title: string; circles: VennCircle[]; overlap: string };
export type CycleBlock = { id: string; type: "cycle"; title: string; steps: string[] };
export type MarginNoteBlock = { id: string; type: "margin_note"; text: string; pen: Pen };
export type CalloutBlock = { id: string; type: "callout"; text: string; tone: "highlight" | "dark" };
export type TipBlock = { id: string; type: "tip"; title: string; text: string };
export type TimelineEvent = { date: string; title: string; text: string; highlight?: boolean };
export type TimelineBlock = { id: string; type: "timeline"; title: string; events: TimelineEvent[] };
export type Stat = { value: string; label: string };
export type StatsBlock = { id: string; type: "stats"; items: Stat[]; source: string; sourceUrl: string };
export type SourceItem = { label: string; url: string };
export type SourcesBlock = { id: string; type: "sources"; items: SourceItem[] };

export type Block =
  | TextBlock
  | ImageBlock
  | MakeTheCallBlock
  | CheckYourselfBlock
  | MarkedUpImageBlock
  | ChartBlock
  | CauseArrowsBlock
  | VennBlock
  | CycleBlock
  | MarginNoteBlock
  | CalloutBlock
  | TipBlock
  | TimelineBlock
  | StatsBlock
  | SourcesBlock;

export type BlockType = Block["type"];

export type Cover = { src: string; alt: string } & Credit;

export type Piece = {
  id: string;
  type: PieceType;
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  tags: string[];
  featured: boolean;
  cover: Cover | null;
  seo_title: string;
  seo_description: string;
  reading_minutes: number;
  issue_number: number | null;
  /** Slug of the author, e.g. "madan". */
  author: string;
  blocks: Block[];
  access: Access;
  status: PieceStatus;
  published_at: string | null;
  updated_at?: string;
};

export type Section = {
  type: PieceType;
  label: string;
  plural: string;
  path: string;
  adminPath: string;
  color: string;
  blurb: string;
  categories: string[];
};

export const SECTIONS: Record<PieceType, Section> = {
  article: {
    type: "article",
    label: "Article",
    plural: "Articles",
    path: "/articles",
    adminPath: "/admin/articles",
    color: "var(--highlighter)",
    blurb: "One product management idea a week, explained by making you decide first.",
    categories: ["Fundamentals", "Discovery", "Strategy", "Metrics", "Execution", "Career"],
  },
  case_study: {
    type: "case_study",
    label: "Case study",
    plural: "Case studies",
    path: "/case-studies",
    adminPath: "/admin/case-studies",
    color: "var(--tab-blue)",
    blurb: "A deep dive into the product decisions that shaped great products, explained in enough detail to really learn from.",
    categories: ["Pivots", "Growth", "Pricing", "Platforms", "Failures"],
  },
  breakdown: {
    type: "breakdown",
    label: "Product breakdown",
    plural: "Product breakdowns",
    path: "/breakdowns",
    adminPath: "/admin/breakdowns",
    color: "var(--tab-pink)",
    blurb: "A product, an app, a business model or a single screen taken apart, with every decision answering one question: why?",
    categories: ["Business models", "Growth loops", "Marketplaces", "UX", "Pricing"],
  },
  newsletter: {
    type: "newsletter",
    label: "Newsletter",
    plural: "Newsletter",
    path: "/newsletter",
    adminPath: "/admin/newsletters",
    color: "var(--sheet)",
    blurb: "Weekly. What's happening in product, and what I'm building and learning.",
    categories: [],
  },
};

export const SECTION_LIST: Section[] = [SECTIONS.article, SECTIONS.case_study, SECTIONS.breakdown, SECTIONS.newsletter];
export const PIECE_TYPE_LABEL: Record<PieceType, string> = {
  article: "Article",
  case_study: "Case study",
  breakdown: "Breakdown",
  newsletter: "Newsletter",
};
export const PIECE_TYPE_COLOR: Record<PieceType, string> = {
  article: SECTIONS.article.color,
  case_study: SECTIONS.case_study.color,
  breakdown: SECTIONS.breakdown.color,
  newsletter: SECTIONS.newsletter.color,
};

export function pieceUrl(p: Pick<Piece, "type" | "slug">): string {
  return `${SECTIONS[p.type].path}/${p.slug}`;
}

export function sectionFromAdminSlug(slug: string): Section | undefined {
  return SECTION_LIST.find((s) => s.adminPath === `/admin/${slug}`);
}

// How many pieces of one type can be featured at once.
export const MAX_FEATURED = 3;

/* Authors ---------------------------------------------------------------- */

export type Author = {
  slug: string;
  name: string;
  /** Short line under the name, e.g. "Product Manager, healthcare SaaS". */
  role: string;
  /** One or two sentences, shown on bylines and cards. */
  short_bio: string;
  /** Markdown, shown on the author page. */
  bio: string;
  photo: string;
  avatar: string;
  links: { label: string; url: string }[];
};

export const DEFAULT_AUTHOR = "madan";
export const authorUrl = (slug: string) => `/authors/${slug}`;

/* Inbox: contact messages and "write for us" pitches ---------------------- */

export type InboxKind = "contact" | "pitch";
export type InboxStatus = "new" | "read" | "archived";

export type InboxItem = {
  id: string;
  kind: InboxKind;
  status: InboxStatus;
  name: string;
  email: string;
  phone: string;
  /** Contact: the topic. Pitch: the working title. */
  subject: string;
  message: string;
  /** Pitch only: article, case_study, breakdown. */
  piece_type: string;
  /** Pitch only: a link to earlier writing. */
  link: string;
  consent: boolean;
  created_at: string;
};
