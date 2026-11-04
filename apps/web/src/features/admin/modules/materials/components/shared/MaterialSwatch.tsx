import { cn } from "@/lib/utils";

const TEETH = 28;

/** Mép răng cưa như mẫu vải cắt bằng kéo zíc-zắc — viền dưới của ô vải mẫu */
const PINKED_EDGE = `polygon(0 0, 100% 0, ${Array.from({ length: TEETH * 2 + 1 }, (_, i) => {
  const x = 100 - (i / (TEETH * 2)) * 100;
  return `${x.toFixed(2)}% ${i % 2 === 0 ? "calc(100% - 7px)" : "100%"}`;
}).join(", ")})`;

/** Vân dệt chéo dùng khi chưa có ảnh cận mặt vải */
const WEAVE_PATTERN =
  "repeating-linear-gradient(45deg, #E4E4E7 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, #EDEDEF 0 2px, #F4F4F5 2px 7px)";

/**
 * Ô vải mẫu: ảnh cận mặt vải (hoặc vân dệt khi chưa có ảnh) cắt mép răng cưa ở đáy — nhận ra ngay là "mẫu vải"
 */
export function MaterialSwatch({
  src,
  className,
  children,
}: {
  src: string | null;
  className?: string;
  /** Lớp phủ (mã vải, nhãn trạng thái...) */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-[#F4F4F5]", className)}
      style={{ clipPath: PINKED_EDGE, backgroundImage: src ? undefined : WEAVE_PATTERN }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên (Cloudinary/URL tùy ý), không qua next/image
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      {children}
    </div>
  );
}
