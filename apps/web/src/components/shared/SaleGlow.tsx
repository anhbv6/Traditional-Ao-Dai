import { cn } from "@/lib/utils";

/**
 * Viền vàng nhạt óng ánh lấp lánh đánh dấu sản phẩm đang giảm giá — phủ lên khung ảnh (thẻ sản phẩm, thẻ yêu thích, banner…).
 *
 * - Viền vàng nhạt cố định + quầng vàng mờ bên trong "thở" chậm.
 * - Một luồng sáng óng (vàng → trắng ngà) chạy vòng quanh viền (conic-gradient xoay, chỉ hiện trên vành viền nhờ mask).
 * - 16 ngôi sao to / nhỏ rải quanh mép, nhấp nháy nhanh (2.2s/chu kỳ) nhưng mượt, so le liên tục.
 * CSS thuần (keyframes sale-* trong globals.css), không cần JS; tắt chuyển động khi người dùng bật "giảm chuyển động".
 *
 * Đặt trong khung có `position: relative`.
 *
 * @example
 * {isOnSale ? <SaleGlow /> : null}
 */
/* Rải quanh mép (tránh góc trên-phải — nút yêu thích), độ trễ so le để lúc nào cũng có sao đang sáng */
const SPARKLES = [
  { position: "left-[62%] top-2", size: "size-3" },
  { position: "left-[38%] top-1.5", size: "size-2" },
  { position: "left-[80%] top-[12%]", size: "size-1.5" },
  { position: "right-2 top-[30%]", size: "size-2.5" },
  { position: "right-4 top-[44%]", size: "size-1.5" },
  { position: "right-3 top-[58%]", size: "size-2" },
  { position: "right-2 top-[72%]", size: "size-1.5" },
  { position: "bottom-14 right-2", size: "size-3" },
  { position: "bottom-2 left-[75%]", size: "size-1.5" },
  { position: "bottom-2 left-[55%]", size: "size-2" },
  { position: "bottom-4 left-[30%]", size: "size-1.5" },
  { position: "bottom-3 left-3", size: "size-2.5" },
  { position: "left-2 top-[62%]", size: "size-1.5" },
  { position: "left-2 top-[45%]", size: "size-2" },
  { position: "left-3 top-[28%]", size: "size-1.5" },
  { position: "left-[20%] top-[18%]", size: "size-1.5" },
];

/* Một chu kỳ nhấp nháy (khớp keyframes sale-twinkle). Độ trễ rải đều trên cả chu kỳ theo thứ tự xen kẽ
   → lúc nào cũng có vài ngôi sao đang sáng ở các mép khác nhau, không bị "nháy đồng loạt". */
const TWINKLE_MS = 2200;
const twinkleDelay = (index: number) => `${(((index * 7) % SPARKLES.length) / SPARKLES.length) * TWINKLE_MS}ms`;

/* Mask chỉ giữ phần VÀNH (padding) của phần tử → luồng sáng chỉ chạy trên viền */
const RING_MASK = {
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
} as const;

export function SaleGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-10", className)}>
      {/* Viền vàng nhạt + quầng vàng mờ bên trong "thở" */}
      <span className="absolute inset-0 border-[1.5px] border-[#E6C77A]/90 shadow-[inset_0_0_24px_rgba(230,199,122,0.4)] animate-[sale-breathe_3.6s_ease-in-out_infinite] motion-reduce:animate-none" />

      {/* Luồng sáng chạy vòng quanh viền */}
      <span
        className="absolute inset-0 p-[2px] animate-[sale-beam_3s_linear_infinite] motion-reduce:hidden"
        style={{
          background:
            "conic-gradient(from var(--sale-angle), transparent 0deg 240deg, rgba(230,199,122,0.9) 295deg, #FFF8E1 325deg, rgba(230,199,122,0.9) 345deg, transparent 360deg)",
          ...RING_MASK,
        }}
      />

      {/* Sao lấp lánh */}
      {SPARKLES.map((sparkle, index) => (
        <svg
          key={sparkle.position}
          viewBox="0 0 24 24"
          className={cn(
            "absolute opacity-0 drop-shadow-[0_0_4px_rgba(230,190,90,0.95)] animate-[sale-twinkle_2.2s_cubic-bezier(0.45,0,0.55,1)_infinite] motion-reduce:hidden",
            sparkle.position,
            sparkle.size,
          )}
          style={{ animationDelay: twinkleDelay(index) }}
        >
          <path d="M12 0 C12 8 16 12 24 12 C16 12 12 16 12 24 C12 16 8 12 0 12 C8 12 12 8 12 0 Z" fill="#FFF8E1" />
        </svg>
      ))}
    </div>
  );
}
