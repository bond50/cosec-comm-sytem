type BreakdownItem = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type BreakdownDonutProps = {
  items: BreakdownItem[];
  centerLabel?: string;
};

export function BreakdownDonut({ items, centerLabel }: BreakdownDonutProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = items.map((item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const dash = fraction * circumference;
    const segment = {
      ...item,
      dasharray: `${dash} ${circumference - dash}`,
      dashoffset: -offset,
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {total > 0
            ? segments.map((segment) => (
                <circle
                  key={segment.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={segment.dasharray}
                  strokeDashoffset={segment.dashoffset}
                />
              ))
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            {total}
          </span>
          {centerLabel ? (
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
              {centerLabel}
            </span>
          ) : null}
        </div>
      </div>

      <ul className="w-full space-y-2 sm:max-w-[220px]">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="font-semibold text-slate-950">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
