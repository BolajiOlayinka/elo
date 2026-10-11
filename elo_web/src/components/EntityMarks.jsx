export function Avatar({ initials, size = 40 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {initials}
    </span>
  );
}

export function Flag({ code }) {
  return (
    <span className="flag" title="Country">
      {code}
    </span>
  );
}

export function LineChart({ series, years }) {
  const width = 720;
  const height = 180;
  const pad = { l: 36, r: 56, t: 16, b: 28 };
  const values = series.flatMap((item) => item.points);
  const max = Math.max(...values);
  const min = Math.min(...values);

  function coords(points) {
    return points.map((value, index) => {
      const x = pad.l + (index / (points.length - 1)) * (width - pad.l - pad.r);
      const y = height - pad.b - ((value - min) / (max - min || 1)) * (height - pad.t - pad.b);
      return `${x},${y}`;
    });
  }

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {[0, 1, 2, 3].map((index) => {
        const y = pad.t + (index / 3) * (height - pad.t - pad.b);
        return <line key={index} x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="#1E2E3D" />;
      })}
      {series.map((item) => (
        <polyline
          key={item.name}
          className="sparkline-draw"
          points={coords(item.points).join(' ')}
          fill="none"
          stroke={item.color}
          strokeWidth="2.2"
          pathLength="1"
        />
      ))}
      {years.map((year, index) => {
        const x = pad.l + (index / (years.length - 1)) * (width - pad.l - pad.r);
        return (
          <text key={year} x={x} y={height - 6} fill="#8b8f98" fontSize="10" textAnchor="middle">
            {year}
          </text>
        );
      })}
    </svg>
  );
}
