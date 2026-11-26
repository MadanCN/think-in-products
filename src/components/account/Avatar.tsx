/* eslint-disable @next/next/no-img-element */
const COLORS = ["#c8102e", "#1f3fbf", "#22262b", "#2f7d4f", "#8a4fbf", "#b45f06"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// A reader's photo, or their initials on a colour picked from their name.
export function Avatar({ name, src, size = 36, ring = false }: { name: string; src?: string; size?: number; ring?: boolean }) {
  const color = COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flex: `0 0 ${size}px`,
    border: ring ? "2px solid var(--graphite)" : undefined,
    objectFit: "cover",
    background: color,
    color: "#f7faf4",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: Math.round(size * 0.4),
    lineHeight: 1,
  };
  if (src) return <img src={src} alt="" width={size} height={size} style={style} referrerPolicy="no-referrer" />;
  return <span aria-hidden="true" style={style}>{initials(name)}</span>;
}
