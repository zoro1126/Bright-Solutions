import React from 'react';

export function Table({
  headers = [],
  children,
  className = '',
}) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#FAF6EC] dark:bg-[#0F355A] text-[#64748B] dark:text-[#94A3B8]">
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-3 px-4 text-xs font-semibold select-none first:rounded-l-2xl last:rounded-r-2xl"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAE4D3] dark:divide-[#1B456E] text-xs text-[#0A2540] dark:text-white">
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
          ? 'bg-[#FFF7E0] dark:bg-[#0F355A]'
          : 'hover:bg-[#FAF6EC]/60 dark:hover:bg-[#0F355A]/30'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`py-4 px-4 leading-normal align-middle ${className}`}>
      {children}
    </td>
  );
}
