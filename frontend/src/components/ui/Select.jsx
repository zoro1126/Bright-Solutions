import React from 'react';

export function Select({
  label,
  error,
  options = [],
  className = '',
  required = false,
  id,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-[#0A2540] dark:text-[#E2E8F0] tracking-wide">
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      )}

      <select
        id={selectId}
        className={`w-full bg-white dark:bg-[#0A2540] text-[#051A30] dark:text-white text-sm rounded-xl border border-[#CBD5E1] dark:border-[#1B456E] py-2 px-3 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#FFE500] focus:border-[#0A2540] disabled:bg-[#F6F7FA] disabled:opacity-60 cursor-pointer ${
          error ? 'border-[#DC2626] focus:ring-[#DC2626]' : ''
        } ${className}`}
        {...props}
      >
        {children || options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
    </div>
  );
}
