"use client";

import { useEffect } from "react";

// Counts one view per piece per browser session.
export function ViewBeacon({ id }: { id: string }) {
  useEffect(() => {
    const key = `tip:viewed:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    const body = JSON.stringify({ id });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else void fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  }, [id]);
  return null;
}
