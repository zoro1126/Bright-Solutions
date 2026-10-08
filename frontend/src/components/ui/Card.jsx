import React from 'react';

export function Card({
  children,
  variant = 'surface', // 'surface' | 'dark' | 'interactive' | 'tinted'
  className = '',
  onClick,
  ...props
}) {
  const base = "rounded-3xl transition-all duration-150 overflow-hidden";

  const variants = {
    // Clean White Surface on Warm Tinted Container (#FAF6EC)
    surface: "bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] shadow-[0_1px_2px_0_rgba(10,37,64,0.02)] text-[#0A2540] dark:text-white",
    // Deep Midnight Navy Panel (Feature Hero)
    dark: "bg-[#0A2540] border border-[#1B456E] text-white shadow-sm",
    // Soft Tinted Container
    tinted: "bg-[#FAF6EC] dark:bg-[#0F355A] border border-[#EAE4D3] dark:border-[#1B456E] text-[#0A2540] dark:text-white",
    // Interactive card
    interactive: "bg-white dark:bg-[#0A2540] border border-[#EAE4D3] dark:border-[#1B456E] hover:border-[#FFC21A] dark:hover:border-[#FFC21A] cursor-pointer text-[#0A2540] dark:text-white active:scale-[0.99] transition-all",
  };

  return (
    <div
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.surface} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
