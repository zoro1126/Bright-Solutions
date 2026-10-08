import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'tint'
  size = 'md',         // 'xs' | 'sm' | 'md' | 'lg'
  pill = false,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const base = "inline-flex items-center justify-center font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const radius = pill ? "rounded-full" : "rounded-2xl";

  const sizeClasses = {
    xs: `text-xs px-2.5 py-1 ${pill ? 'rounded-full' : 'rounded-lg'} gap-1`,
    sm: `text-xs px-3.5 py-1.5 ${pill ? 'rounded-full' : 'rounded-xl'} gap-1.5`,
    md: `text-sm px-4 py-2.5 ${radius} gap-2`,
    lg: `text-base px-6 py-3 ${radius} gap-2.5`,
  };

  const variants = {
    // Primary: Warm Amber Fill with Dark Navy Text
    primary: "bg-[#FFC21A] hover:bg-[#F5A300] active:bg-[#E08A00] text-[#0A2540] shadow-xs focus:ring-[#FFC21A] border border-[#FFC21A]",
    // Secondary: Deep Midnight Navy
    secondary: "bg-[#0A2540] hover:bg-[#0F355A] active:bg-[#051A30] text-white shadow-xs focus:ring-[#0A2540]",
    // Tint: Soft Warm Amber Tint
    tint: "bg-[#FFF7E0] hover:bg-[#FFEDB8] text-[#0A2540] border border-[#FFEDB8] focus:ring-[#FFC21A]",
    // Outline: Hairline Border
    outline: "bg-white dark:bg-[#0A2540] hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] text-[#0A2540] dark:text-white border border-[#EAE4D3] dark:border-[#1B456E] focus:ring-[#FFC21A]",
    // Danger: Vivid Red
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs focus:ring-[#DC2626]",
    // Ghost: Transparent
    ghost: "bg-transparent hover:bg-[#FAF6EC] dark:hover:bg-[#0F355A] text-[#0A2540] dark:text-[#E2E8F0] focus:ring-[#0A2540]",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${sizeClasses[size] || sizeClasses.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={size === 'sm' || size === 'xs' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className={size === 'sm' || size === 'xs' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : null}
    </button>
  );
}
