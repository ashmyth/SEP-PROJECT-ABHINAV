// Lightweight SVG bar chart — no external dependencies.
export default function VolumeChart({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ color: "var(--muted)", padding: "1rem 0" }}>No data yet.</p>;
  }

  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 36, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (innerW / data.length) * 0.6;
  const step = innerW / data.length;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Weekly training volume chart"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        className="chart-axis"
        x1={padding.left}
        y1={padding.top + innerH}
        x2={width - padding.right}
        y2={padding.top + innerH}
      />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = padding.left + step * i + (step - barWidth) / 2;
        const y = padding.top + innerH - h;
        return (
          <g key={i}>
            <rect className="chart-bar" x={x} y={y} width={barWidth} height={h} rx="4" />
            <text
              className="chart-label"
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
            >
              {d.value > 0 ? Math.round(d.value) : ""}
            </text>
            <text
              className="chart-label"
              x={x + barWidth / 2}
              y={height - 12}
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
