import React from 'react';

export function Card({
  children,
  variant = 'surface', // 'surface' | 'dark' | 'interactive'
  className = '',
  onClick,
  ...props
}) {
  const base = "rounded-2xl transition-all duration-150 overflow-hidden";

  const variants = {
    // Clean White Surface on F6F7FA Canvas
    surface: "bg-white dark:bg-[#0A2540] border border-[#E2E8F0] dark:border-[#1B456E] shadow-[0_1px_3px_0_rgba(10,37,64,0.04)] text-[#051A30] dark:text-white",
    // Deep Midnight Navy Panel (Feature / Bento Hero)
    dark: "bg-[#0A2540] border border-[#1B456E] shadow-[0_10px_25px_-5px_rgba(10,37,64,0.2)] text-white",
    // Interactive card with click hover
    interactive: "bg-white dark:bg-[#0A2540] border border-[#E2E8F0] dark:border-[#1B456E] shadow-[0_1px_3px_0_rgba(10,37,64,0.04)] hover:shadow-md hover:border-[#CBD5E1] dark:hover:border-[#335C85] cursor-pointer text-[#051A30] dark:text-white active:scale-[0.99]",
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
