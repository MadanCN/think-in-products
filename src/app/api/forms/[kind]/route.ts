import { NextResponse } from "next/server";
import { z } from "zod";
import { sameOrigin } from "@/lib/admin-auth";
import { getResend, FROM } from "@/lib/email/send";
import { addInboxItem, recentInboxCount } from "@/lib/repo";
import { HONEYPOT, checkFormToken, checkTurnstile, hashIp, looksLikeSpam } from "@/lib/security/antispam";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const email = z.string().trim().toLowerCase().max(200).email("That email address doesn't look right.");
const phone = z.string().trim().max(40).regex(/^[+()\d\s-]{7,40}$/, "That phone number doesn't look right.");

const schemas = {
  contact: z.object({
    name: z.string().trim().min(1, "Add your name.").max(120),
    email,
    subject: z.string().trim().max(200).default(""),
    message: z.string().trim().min(10, "Write a little more, at least a sentence.").max(5000),
  }),
  pitch: z.object({
    name: z.string().trim().min(1, "Add your name.").max(120),
    email,
    phone,
    piece_type: z.enum(["article", "case_study", "breakdown"], { message: "Pick what you'd like to write." }),
    subject: z.string().trim().min(3, "Add a working title.").max(200),
    message: z.string().trim().min(40, "Tell us a bit more: at least two or three sentences.").max(5000),
    link: z.union([z.literal(""), z.string().trim().max(500).url("That link doesn't look right. Start it with https://")]).default(""),
    consent: z.literal(true, { message: "Tick the box to agree before sending." }),
  }),
};

export async function POST(request: Request, ctx: RouteContext<"/api/forms/[kind]">) {
  const { kind } = await ctx.params;
  if (kind !== "contact" && kind !== "pitch") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Blocked." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 20_000) return NextResponse.json({ error: "That's too long." }, { status: 413 });

  const ip = clientIp(request);
  const burst = rateLimit(`form:${ip}`, 3, 10 * 60_000);
  if (!burst.ok) return NextResponse.json({ error: "You've sent a few already. Try again in a little while." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // Bots: pretend it worked, store nothing.
  if (body[HONEYPOT]) return NextResponse.json({ ok: true });
  const tokenError = await checkFormToken(body.token, kind);
  if (tokenError) return NextResponse.json({ error: tokenError }, { status: 400 });
  if (!(await checkTurnstile(body.turnstile, ip))) return NextResponse.json({ error: "Please complete the check that you're human." }, { status: 400 });

  const parsed = schemas[kind].safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  const d = parsed.data as z.infer<(typeof schemas)["pitch"]> & z.infer<(typeof schemas)["contact"]>;
  if (looksLikeSpam(`${d.subject} ${d.message}`)) return NextResponse.json({ ok: true });

  const ipHash = await hashIp(ip);
  if ((await recentInboxCount(ipHash, 24 * 60)) >= 10) return NextResponse.json({ error: "You've sent a lot today. Try again tomorrow." }, { status: 429 });

  await addInboxItem({
    kind,
    name: d.name,
    email: d.email,
    phone: kind === "pitch" ? d.phone : "",
    subject: d.subject ?? "",
    message: d.message,
    piece_type: kind === "pitch" ? d.piece_type : "",
    link: kind === "pitch" ? d.link : "",
    consent: kind === "pitch" ? d.consent : false,
    ip_hash: ipHash,
  });

  // Optional heads-up email to you.
  const to = process.env.INBOX_NOTIFY_EMAIL;
  const resend = getResend();
  if (to && resend) {
    await resend.emails
      .send({ from: FROM, to, subject: `New ${kind === "pitch" ? "pitch" : "message"} from ${d.name}`, text: `${d.name} <${d.email}>\n\n${d.subject ? `${d.subject}\n\n` : ""}${d.message}\n\nOpen the admin inbox to reply.` })
      .catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
