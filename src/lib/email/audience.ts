import "server-only";
import { getResend } from "./send";

// Keeps Resend's newsletter list (a "segment") in step with the subscribers table.
// The weekly issue is sent to that list as a broadcast, which Resend prices by
// contacts rather than per email.

export const SEGMENT_ID = process.env.RESEND_NEWSLETTER_SEGMENT_ID ?? "";
export const broadcastsEnabled = () => Boolean(SEGMENT_ID && process.env.RESEND_API_KEY);

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Resend allows about 10 API calls a second per account; stay well under it.
async function calm<T>(fn: () => Promise<T>): Promise<T> {
  const out = await fn();
  await pause(150);
  return out;
}

export async function syncContact(email: string, subscribed: boolean): Promise<void> {
  const resend = getResend();
  if (!resend || !SEGMENT_ID || !email) return;
  const addr = email.toLowerCase();
  try {
    if (subscribed) {
      const created = await calm(() => resend.contacts.create({ email: addr, unsubscribed: false, segments: [{ id: SEGMENT_ID }] }));
      if (created.error) {
        // Already a contact: switch them back on and make sure they're on the list.
        await calm(() => resend.contacts.update({ email: addr, unsubscribed: false }));
        await calm(() => resend.contacts.segments.add({ email: addr, segmentId: SEGMENT_ID }));
      }
    } else {
      const res = await calm(() => resend.contacts.update({ email: addr, unsubscribed: true }));
      if (res.error && !/not.?found/i.test(res.error.message)) console.error("resend unsubscribe", res.error.message);
    }
  } catch (e) {
    console.error("resend contact sync", e instanceof Error ? e.message : e);
  }
}

// Before each send: make the list match the table exactly (adds anyone missing,
// switches off anyone who left). Cheap at newsletter sizes: one call per 100 contacts
// to read, plus a call only for each difference.
export async function reconcileList(active: string[]): Promise<{ added: number; removed: number }> {
  const resend = getResend();
  if (!resend || !SEGMENT_ID) return { added: 0, removed: 0 };
  const want = new Set(active.map((e) => e.toLowerCase()));
  const have = new Map<string, boolean>(); // email -> unsubscribed
  let after: string | undefined;
  for (let page = 0; page < 200; page++) {
    const { data, error } = await calm(() => resend.contacts.list({ segmentId: SEGMENT_ID, limit: 100, ...(after ? { after } : {}) }));
    if (error) throw new Error(`Couldn't read the Resend list: ${error.message}`);
    for (const c of data?.data ?? []) have.set(c.email.toLowerCase(), Boolean(c.unsubscribed));
    if (!data?.has_more || !data.data.length) break;
    after = data.data[data.data.length - 1].id;
  }
  let added = 0;
  let removed = 0;
  for (const email of want) {
    if (have.get(email) === false) continue;
    await syncContact(email, true);
    added++;
  }
  for (const [email, unsubscribed] of have) {
    if (!want.has(email) && !unsubscribed) {
      await syncContact(email, false);
      removed++;
    }
  }
  return { added, removed };
}
