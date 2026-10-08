import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-[#E2E8F0] dark:bg-[#1B456E] rounded-xl ${className}`}
    />
  );
}
