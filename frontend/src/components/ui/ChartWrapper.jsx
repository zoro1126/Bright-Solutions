import React from 'react';

export function ChartWrapper({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-[#0A2540] border border-[#E2E8F0] dark:border-[#1B456E] shadow-sm flex flex-col ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F1F5F9] dark:border-[#1B456E]">
          <div>
            {title && (
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 w-full min-h-[160px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Reusable SVG Bar Chart
export function SimpleBarChart({ data = [], height = 160, barColor = '#0A2540' }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <div className="w-full flex items-end justify-between gap-2 pt-4 px-2" style={{ height }}>
      {data.map((item, idx) => {
        const heightPct = Math.round(((item.value || 0) / maxVal) * 100);
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <span className="text-[10px] font-mono font-bold text-[#0A2540] dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {item.value}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all duration-300 group-hover:brightness-125 ${
                item.color ? '' : 'bg-[#0A2540] dark:bg-[#FFE500]'
              }`}
              style={{
                height: `${Math.max(6, heightPct)}%`,
                backgroundColor: item.color || undefined,
              }}
            />
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate max-w-[48px]">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Reusable SVG Donut Chart
export function SimpleDonutChart({ data = [], size = 150, strokeWidth = 24 }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around py-2">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {data.map((slice, i) => {
            const pct = (slice.value || 0) / total;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -(accumulatedPercent * circumference);
            accumulatedPercent += pct;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color || '#0A2540'}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:opacity-85"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold font-mono text-[#0A2540] dark:text-white">
            {total}
          </span>
          <span className="text-[10px] uppercase font-mono text-[#64748B]">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5 flex-1 min-w-[140px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color || '#0A2540' }} />
              <span className="text-[#64748B] dark:text-[#CBD5E1] truncate">{d.label}</span>
            </div>
            <span className="font-mono font-bold text-[#0A2540] dark:text-white ml-2">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
