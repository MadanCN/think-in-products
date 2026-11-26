import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { normalizePiece } from "@/lib/blocks";
import { pieceFields, pieceType } from "@/lib/mcp-schema";
import { getPiece, listPieces, savePiece } from "@/lib/repo";
import { SITE_URL } from "@/lib/supabase/env";
import { pieceUrl, type Piece } from "@/lib/types";
import { safeEqual } from "@/lib/security/crypto";
import { writingGuide } from "@/lib/writing-guide";

// MCP server: lets Claude read the writing guide and write drafts of articles,
// case studies, product breakdowns and newsletter issues. Drafts only: publishing
// stays a human decision in the admin.

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const json = (v: unknown) => text(JSON.stringify(v, null, 2));
const summary = (p: Piece) => ({
  id: p.id,
  type: p.type,
  title: p.title,
  slug: p.slug,
  status: p.status,
  category: p.category,
  featured: p.featured,
  reading_minutes: p.reading_minutes,
  published_at: p.published_at,
  url: `${SITE_URL}${pieceUrl(p)}`,
  admin_url: `${SITE_URL}/admin/edit/${p.id}`,
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "get_writing_guide",
      { title: "Get the ThinkInProducts writing guide", description: "Read this first. The house style, structure for each format, TiP rules, fact and image rules, and the list of block types.", inputSchema: z.object({}) },
      async () => text(writingGuide()),
    );

    server.registerTool(
      "list_pieces",
      {
        title: "List pieces",
        description: "List articles, case studies, product breakdowns or newsletter issues, newest first. Use it to avoid duplicates and to find pieces to link to.",
        inputSchema: z.object({ type: pieceType.optional(), status: z.enum(["draft", "published"]).optional(), query: z.string().optional() }),
      },
      async ({ type, status, query }) => json((await listPieces({ type, status, q: query })).map(summary)),
    );

    server.registerTool(
      "get_piece",
      { title: "Get a piece", description: "Get the full content (all blocks) of one piece by id.", inputSchema: z.object({ id: z.string() }) },
      async ({ id }) => {
        const p = await getPiece(id);
        return p ? json(p) : text(`No piece with id ${id}.`);
      },
    );

    server.registerTool(
      "create_draft",
      {
        title: "Create a draft",
        description: "Save a new article, case study, product breakdown or newsletter issue as a draft. Call get_writing_guide first. Returns the admin link where a human reviews and publishes it.",
        inputSchema: z.object({ type: pieceType, ...pieceFields }),
      },
      async (input) => {
        const draft = normalizePiece({ ...input, id: `new-${Date.now()}`, status: "draft", featured: false, published_at: null, slug: input.slug ?? "" } as Piece);
        const saved = await savePiece(draft);
        return json({ saved: summary(saved), next: "Ask the human to review it at admin_url and publish when ready." });
      },
    );

    server.registerTool(
      "update_draft",
      {
        title: "Update a piece",
        description: "Change fields of an existing piece. Only the fields you send change; blocks are replaced as a whole. This never publishes, and a published piece stays published.",
        inputSchema: z.object({ id: z.string(), ...Object.fromEntries(Object.entries(pieceFields).map(([k, v]) => [k, (v as z.ZodType).optional()])) }),
      },
      async (input) => {
        const current = await getPiece(input.id);
        if (!current) return text(`No piece with id ${input.id}.`);
        const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
        const saved = await savePiece({ ...current, ...patch, id: current.id, status: current.status, featured: current.featured } as Piece);
        return json({ saved: summary(saved) });
      },
    );
  },
  { serverInfo: { name: "thinkinproducts", version: "1.0.0" } },
);

// Protected by MCP_API_KEY: send it as "Authorization: Bearer <key>" or ?key=<key>.
async function guarded(request: Request) {
  const key = process.env.MCP_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") return new Response("Set MCP_API_KEY to enable the MCP server.", { status: 503 });
    return handler(request);
  }
  const url = new URL(request.url);
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("key") ?? "";
  if (!given || !safeEqual(given, key)) {
    await new Promise((r) => setTimeout(r, 300));
    return new Response("Unauthorized", { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }
  return handler(request);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
