// A small, accessible daily bar chart for the dashboard.
export function MiniBars({ values, days, label, color = "var(--graphite)" }: { values: number[]; days: string[]; label: string; color?: string }) {
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const w = 600;
  const h = 120;
  const bw = w / values.length;
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h + 22}`} width="100%" role="img" aria-label={`${label}: ${total} in the last ${values.length} days`}>
        <line x1="0" x2={w} y1={h} y2={h} stroke="#a9bba0" />
        {values.map((v, i) => (
          <rect key={i} x={i * bw + 2} y={h - (v / max) * (h - 8)} width={Math.max(2, bw - 4)} height={(v / max) * (h - 8)} rx="2" fill={v ? color : "transparent"}>
            <title>{`${fmt(days[i])}: ${v}`}</title>
          </rect>
        ))}
        <text x="0" y={h + 17} fontSize="12" fill="#555c63">{fmt(days[0])}</text>
        <text x={w} y={h + 17} fontSize="12" fill="#555c63" textAnchor="end">{fmt(days[days.length - 1])}</text>
        <text x={w} y="12" fontSize="12" fill="#555c63" textAnchor="end">max {max}</text>
      </svg>
    </figure>
  );
}
