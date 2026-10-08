import React from 'react';
import { Check } from 'lucide-react';

export function Stepper({ steps = [], currentStep = 0, onStepClick }) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <React.Fragment key={step.id || idx}>
            <div
              onClick={() => isDone && onStepClick && onStepClick(idx)}
              className={`flex items-center gap-3 ${isDone && onStepClick ? 'cursor-pointer' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-[#FFE500] text-[#051A30] shadow-sm'
                    : isCurrent
                    ? 'bg-[#0A2540] text-white ring-2 ring-[#FFE500]'
                    : 'bg-[#E2E8F0] dark:bg-[#1B456E] text-[#64748B]'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <div className="hidden sm:block">
                <div className={`text-xs font-bold leading-tight ${isCurrent ? 'text-[#0A2540] dark:text-white' : 'text-[#64748B]'}`}>
                  {step.title}
                </div>
                {step.desc && (
                  <div className="text-[10px] text-[#94A3B8]">
                    {step.desc}
                  </div>
                )}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors ${
                  idx < currentStep ? 'bg-[#FFE500]' : 'bg-[#E2E8F0] dark:bg-[#1B456E]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
