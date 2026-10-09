import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function StatCard({
  title,
  value,
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral' | 'alert'
  helper,
  icon: Icon,
  className = '',
}) {
  const isNegative = deltaType === 'negative' || deltaType === 'alert';

  return (
    <div
      className={`rounded-2xl p-3.5 sm:p-4 bg-white dark:bg-[#0A2540] text-[#0A2540] dark:text-white border border-[#EAE4D3] dark:border-[#1B456E] shadow-[0_1px_2px_0_rgba(10,37,64,0.02)] flex flex-col justify-between transition-all duration-150 ${className}`}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] block">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A2540] dark:text-white mt-0.5 tabular-nums font-sans">
            {value}
          </div>
        </div>

        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#0A2540] text-white dark:bg-[#1B456E] flex items-center justify-center shrink-0 shadow-xs">
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Tinted Footer Strip */}
      {(delta || helper) && (
        <div className="mt-2.5 pt-0">
          <div className="bg-[#FFF7E0] dark:bg-[#0F355A] rounded-xl px-2.5 py-1 flex items-center gap-1.5 border border-[#FFEDB8]/60 dark:border-[#1B456E]">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                isNegative
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#FFC21A] text-[#0A2540]'
              }`}
            >
              {isNegative ? (
                <ArrowDownRight className="w-2.5 h-2.5 stroke-[2.5]" />
              ) : delta ? (
                <ArrowUpRight className="w-2.5 h-2.5 stroke-[2.5]" />
              ) : (
                <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
              )}
            </div>
            <span className="text-[11px] font-semibold text-[#0A2540] dark:text-[#E2E8F0] truncate font-sans">
              {delta || helper}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
