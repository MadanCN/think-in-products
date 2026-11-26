"use client";

import { useEffect } from "react";
import { loadMe } from "./useMe";

// For signed-in readers: remembers how far you got, so "continue reading" and
// recommendations work. Sends at most every few seconds, and once when you leave.
export function ReadTracker({ pieceId }: { pieceId: string }) {
  useEffect(() => {
    let best = 0;
    let sent = -1;
    let on = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      const article = document.querySelector("main article") ?? document.querySelector("main");
      if (!article) return 0;
      const rect = article.getBoundingClientRect();
      const seen = window.innerHeight - rect.top;
      return Math.max(0, Math.min(100, Math.round((seen / Math.max(rect.height, 1)) * 100)));
    };
    const send = (beacon = false) => {
      if (!on || best <= sent) return;
      sent = best;
      const body = JSON.stringify({ pieceId, progress: best });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/me/progress", new Blob([body], { type: "application/json" }));
      else void fetch("/api/me/progress", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => null);
    };
    const onScroll = () => {
      best = Math.max(best, measure());
      if (!timer) timer = setTimeout(() => ((timer = null), send()), 4000);
    };
    const onHide = () => document.visibilityState === "hidden" && send(true);

    loadMe().then((me) => {
      if (!me.signedIn) return;
      on = true;
      best = Math.max(1, measure());
      send();
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onHide);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      if (timer) clearTimeout(timer);
      send(true);
    };
  }, [pieceId]);
  return null;
}
