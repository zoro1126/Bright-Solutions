import React from 'react';

export function Table({
  headers = [],
  children,
  className = '',
}) {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] dark:border-[#1B456E] bg-white dark:bg-[#0A2540] shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E2E8F0] dark:border-[#1B456E] bg-[#F6F7FA]/75 dark:bg-[#0F355A]/50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] font-mono select-none"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1B456E] text-xs text-[#051A30] dark:text-[#E2E8F0]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '', onClick, isSelected = false }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-150 ${
        isSelected
          ? 'bg-[#FFE500]/10 border-l-4 border-l-[#FFE500]'
          : 'hover:bg-[#F6F7FA] dark:hover:bg-[#0F355A]/40'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`py-3.5 px-4 leading-normal align-middle ${className}`}>
      {children}
    </td>
  );
}
