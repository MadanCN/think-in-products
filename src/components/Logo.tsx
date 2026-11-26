import Link from "next/link";
import { LOGO } from "./logo-paths";

// The ThinkInProducts wordmark: "think" and "product" in graphite, "in" circled in red pen.
export function LogoMark({ height = 30, tone = "dark" }: { height?: number; tone?: "dark" | "light" }) {
  const ink = tone === "dark" ? "var(--graphite)" : "var(--sheet)";
  const red = tone === "dark" ? "var(--red)" : "#FF4F62";
  return (
    <svg viewBox={LOGO.viewBox} height={height} width={Math.round(height * LOGO.ratio)} role="img" aria-label="ThinkInProducts" style={{ display: "block" }}>
      <path fill={ink} d={LOGO.think} />
      <g transform={`translate(${LOGO.xin} 0)`}>
        <path fill={red} d={LOGO.in} />
        <path d={LOGO.loop} fill="none" stroke={red} strokeWidth={44} strokeLinecap="round" />
      </g>
      <path fill={ink} transform={`translate(${LOGO.xprod} 0)`} d={LOGO.product} />
    </svg>
  );
}

export function Logo({ height = 30, tone = "dark" }: { height?: number; tone?: "dark" | "light" }) {
  return (
    <Link href="/" className="logo" aria-label="ThinkInProducts home">
      <LogoMark height={height} tone={tone} />
    </Link>
  );
}
