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
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#E2D9D2]/60 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#800020] -z-10 transition-all duration-500" 
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />

        {/* Step 1 */}
        <div className="flex flex-col items-center bg-[#FAF7F5] px-2">
          <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
            step > 1 ? "bg-[#800020] border-[#800020] text-white" : step === 1 ? "bg-white border-[#800020] text-[#800020] shadow-xs" : "bg-white border-[#E2D9D2] text-[#706565]"
          }`}>
            {step > 1 ? <Check size={14} /> : "1"}
          </div>
          <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 1 ? "text-[#800020]" : "text-[#706565]"}`}>
            Giao hàng
          </span>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center bg-[#FAF7F5] px-2">
          <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
            step > 2 ? "bg-[#800020] border-[#800020] text-white" : step === 2 ? "bg-white border-[#800020] text-[#800020] shadow-xs" : "bg-white border-[#E2D9D2] text-[#706565]"
          }`}>
            {step > 2 ? <Check size={14} /> : "2"}
          </div>
          <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 2 ? "text-[#800020]" : "text-[#706565]"}`}>
            Thanh toán
          </span>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center bg-[#FAF7F5] px-2">
          <div className={`flex size-9 items-center justify-center rounded-full border-2 font-bold text-xs transition-all duration-300 ${
            step === 3 ? "bg-white border-[#800020] text-[#800020] shadow-xs" : "bg-white border-[#E2D9D2] text-[#706565]"
          }`}>
            3
          </div>
          <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider ${step === 3 ? "text-[#800020]" : "text-[#706565]"}`}>
            Xác nhận
          </span>
        </div>
      </div>
    </div>
  );
}
export default CheckoutProgress;
