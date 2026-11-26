import { z } from "zod";

// The block schema Claude writes against through the MCP tools.
// Keep in step with src/lib/types.ts.
const id = z.string().min(1).max(64).describe("Unique id within the piece, e.g. 'intro' or 'tip-2'. Used as the anchor link #id.");
const pen = z.enum(["red", "blue"]);
const option = z.object({ id: z.string(), label: z.string(), feedback: z.string().describe("What the reader sees after picking this option."), correct: z.boolean() });
const credit = { credit: z.string().default("").describe("Who made the image, e.g. 'Jane Doe, via Wikimedia Commons'. Required for any image you didn't make."), creditUrl: z.string().default("").describe("Link to the image's source or licence page.") };

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("text"), markdown: z.string().describe("Markdown. Use ## for section headings, ==text== for a yellow highlight, tables allowed. Links to other pieces use site paths like /articles/slug.") }),
  z.object({ id, type: z.literal("tip"), title: z.string(), text: z.string().describe("One practical Think in Products tip the reader can use at work this week. 1–3 sentences.") }),
  z.object({ id, type: z.literal("margin_note"), text: z.string().describe("Short handwritten aside, under 20 words. Appears in the margin next to the block before it."), pen }),
  z.object({ id, type: z.literal("callout"), text: z.string(), tone: z.enum(["highlight", "dark"]) }),
  z.object({ id, type: z.literal("make_the_call"), scenario: z.string(), question: z.string(), options: z.array(option).min(2).max(4) }),
  z.object({
    id,
    type: z.literal("check_yourself"),
    question: z.string(),
    options: z.array(option).min(2).max(4),
    rightMessage: z.string(),
    rightLinkLabel: z.string(),
    rightLinkHref: z.string(),
    wrongMessage: z.string(),
    wrongLinkLabel: z.string(),
    wrongLinkHref: z.string(),
  }),
  z.object({ id, type: z.literal("image"), src: z.string().describe("Full https URL, or a site path like /images/x.png."), alt: z.string(), caption: z.string(), ...credit }),
  z.object({
    id,
    type: z.literal("marked_up_image"),
    src: z.string(),
    alt: z.string(),
    caption: z.string(),
    ...credit,
    notes: z.array(z.object({ id: z.string(), x: z.number().min(0).max(100).describe("% from the left of the image"), y: z.number().min(0).max(100).describe("% from the top"), text: z.string(), pen, side: z.enum(["left", "right"]) })),
  }),
  z.object({ id, type: z.literal("chart"), title: z.string(), unit: z.string(), note: z.string().describe("Where the numbers come from."), sourceUrl: z.string().default(""), rows: z.array(z.object({ label: z.string(), value: z.number() })).min(1) }),
  z.object({ id, type: z.literal("stats"), items: z.array(z.object({ value: z.string(), label: z.string() })).min(1).max(4), source: z.string(), sourceUrl: z.string().default("") }),
  z.object({ id, type: z.literal("timeline"), title: z.string(), events: z.array(z.object({ date: z.string(), title: z.string(), text: z.string(), highlight: z.boolean().optional() })).min(2) }),
  z.object({ id, type: z.literal("cause_arrows"), problem: z.string(), reasons: z.array(z.string()).min(2).max(5) }),
  z.object({ id, type: z.literal("venn"), title: z.string(), circles: z.array(z.object({ label: z.string(), detail: z.string() })).min(2).max(3), overlap: z.string() }),
  z.object({ id, type: z.literal("cycle"), title: z.string(), steps: z.array(z.string().max(22)).min(3).max(6) }),
  z.object({ id, type: z.literal("sources"), items: z.array(z.object({ label: z.string(), url: z.string() })).min(1) }),
]);

export const pieceType = z.enum(["article", "case_study", "breakdown", "newsletter"]);

export const pieceFields = {
  title: z.string().min(3).max(140),
  subtitle: z.string().max(300).describe("One or two sentences under the title: what the reader will get."),
  category: z.string().default("").describe("Articles: Fundamentals, Discovery, Strategy, Metrics, Execution, Career. Case studies: Pivots, Growth, Pricing, Platforms, Failures. Breakdowns: Business models, Growth loops, Marketplaces, UX, Pricing. Newsletters: leave empty."),
  tags: z.array(z.string()).default([]).describe("3–8 lowercase search keywords."),
  slug: z.string().optional().describe("Web address. Leave out to generate from the title."),
  seo_title: z.string().max(70).default("").describe("Title for Google, under 60 characters if possible."),
  seo_description: z.string().max(170).default("").describe("Description for Google, 140–160 characters."),
  cover: z.object({ src: z.string(), alt: z.string(), ...credit }).nullable().default(null),
  issue_number: z.number().int().positive().nullable().default(null).describe("Newsletters only."),
  access: z.enum(["free", "plus", "pro"]).default("free"),
  author: z.string().optional().describe('Author slug, e.g. "madan". Leave out for the main author. Guest authors must exist in Admin → Authors first.'),
  blocks: z.array(blockSchema).min(1),
};
