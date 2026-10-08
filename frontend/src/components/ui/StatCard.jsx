import React from 'react';

export function StatCard({
  title,
  value,
  delta,
  deltaType = 'neutral', // 'positive' | 'negative' | 'neutral' | 'alert'
  helper,
  icon: Icon,
  className = '',
  isDark = false,
}) {
  const deltaColors = {
    positive: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]',
    negative: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
    alert: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA] font-bold',
    neutral: 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0]',
  };

  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-150 ${
        isDark
          ? 'bg-[#0A2540] text-white border border-[#1B456E] shadow-sm'
          : 'bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white border border-[#E2E8F0] dark:border-[#1B456E] shadow-[0_1px_3px_0_rgba(10,37,64,0.04)]'
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
        <span>{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-[#F6F7FA] dark:bg-[#0F355A] text-[#0A2540] dark:text-[#FFE500]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold tracking-tight font-mono">
          {value}
        </span>
        {delta && (
          <span
            className={`text-xs px-2 py-0.5 rounded-md border font-mono font-medium ${
              deltaColors[deltaType] || deltaColors.neutral
            }`}
          >
            {delta}
          </span>
        )}
      </div>

      {helper && (
        <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8]">
          {helper}
        </p>
      )}
    </div>
  );
}
