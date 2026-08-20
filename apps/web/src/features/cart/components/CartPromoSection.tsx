import React from "react";
import { Tag } from "lucide-react";

interface CartPromoSectionProps {
  promoCode: string;
  setPromoCode: (code: string) => void;
  handleApplyPromo: (e: React.FormEvent) => void;
  promoError: string | null;
  promoSuccess: string | null;
}

export function CartPromoSection({
  promoCode,
  setPromoCode,
  handleApplyPromo,
  promoError,
  promoSuccess,
}: CartPromoSectionProps) {
  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 shadow-xs">
      <h3 className="font-[family-name:var(--font-playfair)] text-base font-bold text-[#800020] flex items-center gap-2">
        <Tag size={16} />
        Mã Khuyến Mãi
      </h3>
      <form onSubmit={handleApplyPromo} className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="Ví dụ: GIAM10, FREESHIP"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-[#E2D9D2] px-3 text-xs bg-[#FAF7F5] outline-none text-[#2A2525] focus:border-[#800020]/50 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          className="h-9 rounded-lg bg-[#800020] px-4 text-xs font-bold text-white transition-colors hover:bg-[#800020]/90 cursor-pointer active:scale-95"
        >
          Áp dụng
        </button>
      </form>
      {promoError && (
        <p className="mt-2 text-[11px] font-semibold text-rose-600 animate-fade-in">
          ✕ {promoError}
        </p>
      )}
      {promoSuccess && (
        <p className="mt-2 text-[11px] font-semibold text-emerald-600 animate-fade-in">
          ✓ {promoSuccess}
        </p>
      )}
    </div>
  );
}
export default CartPromoSection;
