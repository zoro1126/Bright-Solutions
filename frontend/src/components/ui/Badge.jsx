import React from 'react';

export function Badge({
  children,
  variant = 'neutral', // 'brand' | 'amber' | 'canary' | 'neutral' | 'completed' | 'scheduled' | 'waiting' | 'canceled' | 'crisis' | 'emerald' | 'ochre' | 'red' | 'navy'
  size = 'sm',        // 'xs' | 'sm' | 'md'
  pulsing = false,
  className = '',
  icon: Icon,
}) {
  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5 rounded-full gap-1 font-semibold",
    sm: "text-[11px] px-2.5 py-0.5 rounded-full gap-1.5 font-semibold",
    md: "text-xs px-3 py-1 rounded-full gap-1.5 font-bold",
  };

  const variants = {
    // Brand Warm Amber Fill
    brand: "bg-[#FFC21A] text-[#0A2540] border border-[#FFC21A]",
    canary: "bg-[#FFC21A] text-[#0A2540] border border-[#FFC21A]",
    amber: "bg-[#FFF7E0] text-[#8A740C] border border-[#FFEDB8]",
    
    // Reference Soft Status Pills
    completed: "bg-[#E6F7ED] text-[#047857] border border-[#A7F3D0]",
    emerald: "bg-[#E6F7ED] text-[#047857] border border-[#A7F3D0]",
    scheduled: "bg-[#FFF7E0] text-[#8A740C] border border-[#FFEDB8]",
    ochre: "bg-[#FFF7E0] text-[#8A740C] border border-[#FFEDB8]",
    waiting: "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]",
    sky: "bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]",
    canceled: "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]",
    red: "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]",
    crisis: "bg-[#7F1D1D] text-white border border-[#991B1B] font-bold animate-pulse",

    // Neutral
    neutral: "bg-[#FAF6EC] dark:bg-[#1B456E] text-[#0A2540] dark:text-[#E2E8F0] border border-[#EAE4D3] dark:border-[#335C85]",
    navy: "bg-[#0A2540] text-white border border-[#0A2540]",
  };

  return (
    <span
      className={`inline-flex items-center tracking-tight select-none ${
        sizeClasses[size] || sizeClasses.sm
      } ${variants[variant] || variants.neutral} ${className}`}
    >
      {pulsing && (
        <span className="relative flex h-1.5 w-1.5 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {Icon && <Icon className="w-3 h-3" />}
      <span>{children}</span>
    </span>
  );
}
