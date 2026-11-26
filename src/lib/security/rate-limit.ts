// A simple in-memory sliding-window limiter. It protects each server process; on a
// serverless host each instance has its own memory, so pair it with checks that are
// stored (as the forms do) for anything that must hold across instances.

type Bucket = { hits: number[] };
declare global {
  var __tipBuckets: Map<string, Bucket> | undefined;
}
const buckets = (globalThis.__tipBuckets ??= new Map<string, Bucket>());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - b.hits[0])) / 1000) };
  }
  b.hits.push(now);
  buckets.set(key, b);
  if (buckets.size > 20_000) {
    for (const [k, v] of buckets) if (!v.hits.some((t) => now - t < 3_600_000)) buckets.delete(k);
  }
  return { ok: true, retryAfter: 0 };
}

export function resetLimit(key: string) {
  buckets.delete(key);
}

export function clientIp(request: Request): string {
  const h = request.headers;
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}
