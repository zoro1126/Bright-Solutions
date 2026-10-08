import React from 'react';

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
