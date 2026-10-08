import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-[#E2E8F0] dark:bg-[#1B456E] rounded-xl ${className}`}
    />
  );
}

export function EmptyState({
  title = 'No records found',
  description = 'No clinical encounters currently match this filter criteria.',
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={`p-10 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#1B456E] bg-white/50 dark:bg-[#0A2540]/50 ${className}`}>
      {Icon && (
        <div className="p-3.5 rounded-2xl bg-[#F6F7FA] dark:bg-[#0F355A] text-[#64748B] dark:text-[#FFE500] mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-bold text-[#0A2540] dark:text-white tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-[#64748B] dark:text-[#94A3B8] max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Avatar({ name = '', role = '', size = 'md' }) {
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  };

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-xl bg-[#0A2540] border border-[#1B456E] text-[#FFE500] font-bold font-mono flex items-center justify-center shrink-0 select-none shadow-sm`}
      title={`${name} (${role})`}
    >
      {initials}
    </div>
  );
}
