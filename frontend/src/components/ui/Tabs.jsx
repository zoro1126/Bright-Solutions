import React from 'react';
import { motion } from 'framer-motion';

export function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
}) {
  return (
    <div className={`inline-flex p-1 bg-[#E2E8F0] dark:bg-[#0F355A] rounded-xl border border-[#CBD5E1]/60 dark:border-[#1B456E] select-none ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 focus:outline-none ${
              isSelected
                ? 'text-[#051A30]'
                : 'text-[#64748B] hover:text-[#0A2540] dark:text-[#CBD5E1] dark:hover:text-white'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmentedControlActive"
                className="absolute inset-0 bg-[#FFC21A] rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 font-medium">
              {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
              {opt.label}
              {opt.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-[#051A30] text-white' : 'bg-[#CBD5E1] text-[#0A2540]'}`}>
                  {opt.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-1 border-b border-[#E2E8F0] dark:border-[#1B456E] ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 pt-1 px-4 text-sm font-semibold transition-colors focus:outline-none ${
              isActive
                ? 'text-[#0A2540] dark:text-white'
                : 'text-[#64748B] hover:text-[#0A2540] dark:text-[#94A3B8] dark:hover:text-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-[#FFC21A] text-[#0A2540]' : 'bg-[#E2E8F0] dark:bg-[#1B456E] text-[#64748B]'
                }`}>
                  {tab.count}
                </span>
              )}
            </div>
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFC21A]"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
