"use client";

import { useEffect, useState } from "react";
import { markSubscribed } from "@/lib/subscribed-flag";

export type Me = { signedIn: false } | { signedIn: true; id: string; name: string; avatar: string; email: string; subscribed: boolean };

// One request per page load, shared by the header, the reading tracker and comments.
let pending: Promise<Me> | null = null;

export function loadMe(force = false): Promise<Me> {
  if (!pending || force) {
    pending = fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { signedIn: false }))
      .then((m: Me) => {
        // Signed in: the account knows the truth, so keep this browser in step.
        if (m.signedIn) markSubscribed(m.subscribed);
        return m;
      })
      .catch(() => ({ signedIn: false }) as Me);
  }
  return pending;
}

export function useMe(): Me | null {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let live = true;
    loadMe().then((m) => live && setMe(m));
    return () => {
      live = false;
    };
  }, []);
  return me;
}
