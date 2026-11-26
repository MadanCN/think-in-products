import { DEFAULT_AUTHOR, type Block, type BlockType, type Option, type Piece, type PieceType } from "./types";

export function uid(prefix = "b"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function options(): Option[] {
  return [
    { id: uid("o"), label: "", feedback: "", correct: false },
    { id: uid("o"), label: "", feedback: "", correct: true },
    { id: uid("o"), label: "", feedback: "", correct: false },
  ];
}

// What the "+ Add block" menu in the admin shows, in order, with plain descriptions.
// The same list (with these descriptions) is given to Claude through the MCP writing guide.
export const BLOCK_MENU: { type: BlockType; label: string; hint: string; group: "Write" | "Interact" | "Show" }[] = [
  { type: "text", label: "Text", hint: "Paragraphs, headings, lists, quotes and tables (Markdown)", group: "Write" },
  { type: "tip", label: "TiP", hint: "A Think in Products tip: one practical thing to do at work", group: "Write" },
  { type: "margin_note", label: "Margin note", hint: "A handwritten aside in red or blue pen", group: "Write" },
  { type: "callout", label: "Callout", hint: "A highlighted box for the one idea to keep", group: "Write" },
  { type: "sources", label: "Sources", hint: "The list of sources the piece relies on", group: "Write" },
  { type: "make_the_call", label: "Make the call", hint: "A scenario and three options, answered before reading on", group: "Interact" },
  { type: "check_yourself", label: "Check yourself", hint: "A final question with feedback and what to read next", group: "Interact" },
  { type: "marked_up_image", label: "Marked-up image", hint: "A screenshot with red-pen notes and arrows", group: "Show" },
  { type: "image", label: "Image", hint: "A picture with a caption and credit", group: "Show" },
  { type: "chart", label: "Chart", hint: "Bars that grow in, from a small table", group: "Show" },
  { type: "stats", label: "Big numbers", hint: "Two to four headline numbers with a source", group: "Show" },
  { type: "timeline", label: "Timeline", hint: "Dated events that draw in as you scroll", group: "Show" },
  { type: "cause_arrows", label: "Cause arrows", hint: "One problem with lines reaching out to its reasons", group: "Show" },
  { type: "venn", label: "Venn diagram", hint: "Two or three circles that highlight on hover", group: "Show" },
  { type: "cycle", label: "Cycle / flywheel", hint: "Steps on a loop, with a marker going round", group: "Show" },
];

export function newBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "text":
      return { id, type, markdown: "" };
    case "image":
      return { id, type, src: "", alt: "", caption: "", credit: "", creditUrl: "" };
    case "make_the_call":
      return { id, type, scenario: "", question: "What do you do first?", options: options() };
    case "check_yourself":
      return {
        id,
        type,
        question: "",
        options: options(),
        rightMessage: "You think in problems already.",
        rightLinkLabel: "Read the next one",
        rightLinkHref: "/articles",
        wrongMessage: "Worth another look at the key idea.",
        wrongLinkLabel: "Re-read the key idea",
        wrongLinkHref: "#",
      };
    case "marked_up_image":
      return { id, type, src: "", alt: "", caption: "", notes: [], credit: "", creditUrl: "" };
    case "chart":
      return { id, type, title: "", unit: "", note: "", sourceUrl: "", rows: [{ label: "", value: 0 }] };
    case "cause_arrows":
      return { id, type, problem: "", reasons: ["", "", ""] };
    case "venn":
      return { id, type, title: "", circles: [{ label: "", detail: "" }, { label: "", detail: "" }, { label: "", detail: "" }], overlap: "" };
    case "cycle":
      return { id, type, title: "", steps: ["", "", "", ""] };
    case "margin_note":
      return { id, type, text: "", pen: "red" };
    case "callout":
      return { id, type, text: "", tone: "highlight" };
    case "tip":
      return { id, type, title: "", text: "" };
    case "timeline":
      return { id, type, title: "", events: [{ date: "", title: "", text: "" }, { date: "", title: "", text: "" }] };
    case "stats":
      return { id, type, items: [{ value: "", label: "" }, { value: "", label: "" }], source: "", sourceUrl: "" };
    case "sources":
      return { id, type, items: [{ label: "", url: "" }] };
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// All the words a reader reads in a block.
function blockWords(b: Block): string {
  switch (b.type) {
    case "text":
      return b.markdown;
    case "make_the_call":
      return [b.scenario, b.question, ...b.options.map((o) => `${o.label} ${o.feedback}`)].join(" ");
    case "check_yourself":
      return [b.question, ...b.options.map((o) => `${o.label} ${o.feedback}`), b.rightMessage].join(" ");
    case "marked_up_image":
      return b.notes.map((n) => n.text).join(" ");
    case "timeline":
      return b.events.map((e) => `${e.title} ${e.text}`).join(" ");
    case "stats":
      return b.items.map((i) => `${i.value} ${i.label}`).join(" ");
    case "venn":
      return [b.title, b.overlap, ...b.circles.map((c) => `${c.label} ${c.detail}`)].join(" ");
    case "cycle":
      return [b.title, ...b.steps].join(" ");
    case "cause_arrows":
      return [b.problem, ...b.reasons].join(" ");
    case "chart":
      return [b.title, b.note, ...b.rows.map((r) => r.label)].join(" ");
    case "tip":
      return `${b.title} ${b.text}`;
    case "margin_note":
    case "callout":
      return b.text;
    case "image":
      return b.caption;
    case "sources":
      return "";
  }
}

const VISUAL = new Set<BlockType>(["chart", "marked_up_image", "image", "timeline", "venn", "cycle", "cause_arrows", "stats", "make_the_call", "check_yourself"]);

// Reading time: 230 words a minute, plus about 10 seconds for each visual or question.
export function readingMinutes(blocks: Block[], subtitle = ""): number {
  let words = subtitle.split(/\s+/).filter(Boolean).length;
  let seconds = 0;
  for (const b of blocks) {
    words += blockWords(b).replace(/[#*=_>[\]()`-]/g, " ").split(/\s+/).filter(Boolean).length;
    if (VISUAL.has(b.type)) seconds += 10;
  }
  return Math.max(1, Math.round(((words / 230) * 60 + seconds) / 60));
}

// Plain-text summary used for meta descriptions when the author leaves one blank.
export function autoDescription(p: Pick<Piece, "subtitle" | "blocks">): string {
  if (p.subtitle) return p.subtitle.slice(0, 160);
  const first = p.blocks.find((b) => b.type === "text") as { markdown: string } | undefined;
  return (first?.markdown ?? "").replace(/[#*=_>`]/g, "").replace(/\s+/g, " ").trim().slice(0, 157) + "...";
}

export function blankPiece(type: PieceType): Piece {
  return {
    id: `new-${Date.now()}`,
    type,
    title: "",
    slug: "",
    subtitle: "",
    category: "",
    tags: [],
    featured: false,
    cover: null,
    seo_title: "",
    seo_description: "",
    reading_minutes: 1,
    issue_number: null,
    author: DEFAULT_AUTHOR,
    access: "free",
    status: "draft",
    published_at: null,
    blocks: [{ id: uid(), type: "text", markdown: "" }],
  };
}

// Fill any fields an older saved piece might be missing.
export function normalizePiece(p: Partial<Piece> & { type: string }): Piece {
  const type = ((p.type as string) === "teardown" ? "breakdown" : p.type) as PieceType;
  return {
    ...blankPiece(type),
    ...p,
    type,
    tags: p.tags ?? [],
    featured: Boolean(p.featured),
    cover: p.cover ?? null,
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    category: p.category ?? "",
    issue_number: p.issue_number ?? null,
    author: p.author || DEFAULT_AUTHOR,
    blocks: (p.blocks ?? []) as Block[],
    reading_minutes: readingMinutes((p.blocks ?? []) as Block[], p.subtitle ?? ""),
  } as Piece;
}
