import React from 'react';

export function Input({
  label,
  error,
  helper,
  icon: Icon,
  className = '',
  required = false,
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#0A2540] dark:text-[#E2E8F0] tracking-wide">
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white text-sm rounded-xl border border-[#CBD5E1] dark:border-[#1B456E] py-2 px-3 transition-all duration-150 placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#FFC21A] focus:border-[#0A2540] disabled:bg-[#F6F7FA] disabled:opacity-60 ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-[#DC2626] focus:ring-[#DC2626]' : ''} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-[#DC2626] font-medium">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[#64748B]">{helper}</p>
      ) : null}
    </div>
  );
}
