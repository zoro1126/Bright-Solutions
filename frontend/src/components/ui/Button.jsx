import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',         // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const base = "inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2 rounded-xl gap-2",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5",
  };

  const variants = {
    // Primary: Canary Yellow Fill with Dark Navy Text (Strict Color Contract)
    primary: "bg-[#FFE500] hover:bg-[#FACC15] active:bg-[#EAB308] text-[#051A30] shadow-sm hover:shadow focus:ring-[#FFE500] border border-[#EAB308]/40",
    // Secondary: Deep Midnight Navy
    secondary: "bg-[#0A2540] hover:bg-[#0F355A] active:bg-[#051A30] text-white shadow-sm focus:ring-[#0A2540]",
    // Outline: Clean Border
    outline: "bg-white hover:bg-[#F6F7FA] text-[#0A2540] border border-[#CBD5E1] hover:border-[#94A3B8] focus:ring-[#0A2540]",
    // Danger: Vivid Red
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm focus:ring-[#DC2626]",
    // Ghost: Transparent Hover
    ghost: "bg-transparent hover:bg-[#0A2540]/5 text-[#0A2540] dark:text-[#E2E8F0] focus:ring-[#0A2540]",
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
        <Icon className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : null}
    </button>
  );
}
