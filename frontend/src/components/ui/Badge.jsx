import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'yellow' | 'neutral' | 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis' | 'info' | 'critical'
  size = 'md',        // 'sm' | 'md'
  pulsing = false,
  className = '',
  icon: Icon,
}) {
  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 rounded-md gap-1",
    md: "text-xs px-2.5 py-1 rounded-lg gap-1.5",
  };

  const variants = {
    // Brand Canary Yellow Fill with Dark Navy Text
    yellow: "bg-[#FFE500] text-[#051A30] font-bold border border-[#EAB308]/50",
    // Neutral Slate
    neutral: "bg-[#E2E8F0] dark:bg-[#1B456E] text-[#0A2540] dark:text-[#E2E8F0] font-medium border border-[#CBD5E1] dark:border-[#335C85]",
    // Functional Clinical Semantic Chips (Strictly not brand colors)
    normal: "bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-semibold",
    elevated: "bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-semibold",
    stage1: "bg-[#FFF7ED] text-[#9A3412] border border-[#FED7AA] font-semibold",
    stage2: "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] font-semibold",
    crisis: "bg-[#450A0A] text-white border border-[#DC2626] font-bold animate-pulse",
    critical: "bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626] font-bold ring-2 ring-[#DC2626]/20",
    info: "bg-[#F0F9FF] text-[#075985] border border-[#BAE6FD] font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight select-none font-mono ${
        sizeClasses[size] || sizeClasses.md
      } ${variants[variant] || variants.neutral} ${className}`}
    >
      {pulsing && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{children}</span>
    </span>
  );
}
