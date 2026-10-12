import React from "react";
import { Check } from "lucide-react";

interface CheckoutProgressProps {
  step: number;
}

export function CheckoutProgress({ step }: CheckoutProgressProps) {
  return (
    <div className="max-w-xl mx-auto mb-10">
      <div className="flex items-center justify-between relative select-none">
        {/* Stepper Line Background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--border)]/60 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--primary-color)] -z-10 transition-all duration-500" 
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />

        {/* Step 1 */}
        <div className="flex flex-col items-center bg-[var(--bg-main)] px-2">
          <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
            step > 1 ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white" : step === 1 ? "bg-[var(--bg-card)] border-[var(--primary-color)] text-[var(--primary-ink)] shadow-xs" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-light)]"
          }`}>
            {step > 1 ? <Check size={14} /> : "1"}
          </div>
          <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 1 ? "text-[var(--primary-ink)]" : "text-[var(--text-light)]"}`}>
            Giao hàng
          </span>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center bg-[var(--bg-main)] px-2">
          <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
            step > 2 ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white" : step === 2 ? "bg-[var(--bg-card)] border-[var(--primary-color)] text-[var(--primary-ink)] shadow-xs" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-light)]"
          }`}>
            {step > 2 ? <Check size={14} /> : "2"}
          </div>
          <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 2 ? "text-[var(--primary-ink)]" : "text-[var(--text-light)]"}`}>
            Thanh toán
          </span>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center bg-[var(--bg-main)] px-2">
          <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
            step === 3 ? "bg-[var(--bg-card)] border-[var(--primary-color)] text-[var(--primary-ink)] shadow-xs" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-light)]"
          }`}>
            3
          </div>
          <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 3 ? "text-[var(--primary-ink)]" : "text-[var(--text-light)]"}`}>
            Xác nhận
          </span>
        </div>
      </div>
    </div>
  );
}
export default CheckoutProgress;
