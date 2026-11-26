"use client";

import { useEffect } from "react";
import { markSubscribed } from "@/lib/subscribed-flag";

// Drop on a page to record that this browser is (or no longer is) subscribed.
export function MarkSubscribed({ on }: { on: boolean }) {
  useEffect(() => markSubscribed(on), [on]);
  return null;
}
