import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function ChartWrapper({
  title,
  subtitle,
  action,
  period = 'This Week',
  children,
  className = ''
}) {
  return (
    <div className={`p-6 rounded-3xl bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] shadow-[0_1px_2px_0_rgba(10,37,64,0.02)] flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && (
            <h3 className="text-base font-bold text-[#0A2540] dark:text-white tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {action ? (
            action
          ) : period ? (
            <div className="px-3 py-1 rounded-full bg-[#FAF6EC] dark:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E] text-xs font-semibold text-[#0A2540] dark:text-[#E2E8F0] flex items-center gap-1 cursor-pointer">
              <span>{period}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Grouped Bar Chart (Replicating reference's Patient by Age / Walk-in Velocity)
export function SimpleBarChart({
  data = [],
  height = 180,
  barColor = '#0A2540',
  secondaryColor = '#FFC21A',
  legend = []
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Math.max(d.value || 0, d.value2 || 0)), 1);

  return (
    <div className="w-full flex flex-col space-y-3">
      {legend && legend.length > 0 && (
        <div className="flex items-center justify-end gap-4 text-xs">
          {legend.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5 font-medium text-[#64748B]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="w-full flex items-end justify-between gap-2 px-1 relative" style={{ height }}>
        {data.map((item, idx) => {
          const heightPct1 = Math.round(((item.value || 0) / maxVal) * 100);
          const heightPct2 = item.value2 !== undefined ? Math.round(((item.value2 || 0) / maxVal) * 100) : null;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group relative"
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-12 z-20 bg-[#0A2540] text-white text-[11px] font-mono px-2.5 py-1.5 rounded-xl shadow-lg border border-[#1B456E] whitespace-nowrap pointer-events-none">
                  <div>{item.label}</div>
                  <div className="font-bold text-[#FFC21A]">{item.value} {item.value2 !== undefined ? `• ${item.value2}` : ''}</div>
                </div>
              )}

              {/* Grouped Bars */}
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <div
                  className="w-full max-w-[14px] rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${Math.max(6, heightPct1)}%`,
                    backgroundColor: item.color || barColor,
                  }}
                />
                {heightPct2 !== null && (
                  <div
                    className="w-full max-w-[14px] rounded-t-lg transition-all duration-300"
                    style={{
                      height: `${Math.max(6, heightPct2)}%`,
                      backgroundColor: item.color2 || secondaryColor,
                    }}
                  />
                )}
              </div>

              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono truncate max-w-[48px]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Donut Chart with Centered Total and 2-Column Legend (Replicating reference)
export function SimpleDonutChart({
  data = [],
  title = '',
  totalLabel = 'Total Patients',
  size = 170,
  strokeWidth = 22
}) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="w-full flex flex-col items-center space-y-5">
      {/* Centered Donut Ring */}
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
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-85"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xs text-[#64748B] font-medium">{totalLabel}</span>
          <span className="text-2xl font-extrabold text-[#0A2540] dark:text-white tabular-nums tracking-tight font-sans">
            {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 2-Column Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 w-full pt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs border-b border-[#FAF6EC] dark:border-[#0F355A] pb-1">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color || '#0A2540' }} />
              <span className="text-[#64748B] dark:text-[#CBD5E1] truncate font-medium">{d.label}</span>
            </div>
            <span className="font-bold text-[#0A2540] dark:text-white font-sans ml-2 tabular-nums">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
