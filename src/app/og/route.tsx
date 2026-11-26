import { ImageResponse } from "next/og";
import { LOGO } from "@/components/logo-paths";

// Share image for every page: 1200x630, the notebook look with the page title.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "ThinkInProducts").slice(0, 120);
  const kicker = (searchParams.get("kicker") ?? "").slice(0, 40);
  const size = title.length > 70 ? 64 : title.length > 40 ? 78 : 92;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#E8EFE2",
          backgroundImage: "linear-gradient(#CFDDC6 2px, transparent 2px), linear-gradient(90deg, #CFDDC6 2px, transparent 2px)",
          backgroundSize: "40px 40px",
          color: "#22262B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <svg viewBox={LOGO.viewBox} width={Math.round(54 * LOGO.ratio)} height={54}>
            <path fill="#22262B" d={LOGO.think} />
            <g transform={`translate(${LOGO.xin} 0)`}>
              <path fill="#C8102E" d={LOGO.in} />
              <path d={LOGO.loop} fill="none" stroke="#C8102E" strokeWidth={44} strokeLinecap="round" />
            </g>
            <path fill="#22262B" transform={`translate(${LOGO.xprod} 0)`} d={LOGO.product} />
          </svg>
          {kicker ? (
            <div style={{ display: "flex", padding: "8px 22px", border: "3px solid #22262B", borderRadius: 999, background: "#FFE95C", fontSize: 28, fontWeight: 700 }}>{kicker}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1040 }}>{title}</div>
        <div style={{ display: "flex", height: 14, width: 260, background: "#C8102E", borderRadius: 7 }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
