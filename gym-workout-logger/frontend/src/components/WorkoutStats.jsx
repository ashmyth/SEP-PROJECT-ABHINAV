export default function WorkoutStats({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="card stat" key={i}>
            <div className="stat-label">&nbsp;</div>
            <div className="stat-value">—</div>
          </div>
        ))}
      </div>
    );
  }

  const tiles = [
    { label: "Total Workouts", value: stats.total_workouts, accent: true },
    { label: "This Week", value: stats.this_week },
    { label: "Total Sets", value: stats.total_sets },
    { label: "Volume (kg)", value: Math.round(stats.total_volume).toLocaleString() },
  ];

  return (
    <div className="stat-grid">
      {tiles.map((t) => (
        <div className="card stat" key={t.label}>
          <div className="stat-label">{t.label}</div>
          <div className={`stat-value ${t.accent ? "accent" : ""}`}>
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}
