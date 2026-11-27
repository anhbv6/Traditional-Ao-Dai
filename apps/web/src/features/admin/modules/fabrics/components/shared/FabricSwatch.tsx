import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-5 rounded-md",
  md: "size-10 rounded-lg",
} as const;

/** Mảnh vải theo màu của cây vải (hiển thị ảnh mẫu vải nếu có, fallback sang màu trơn hex) */
export function FabricSwatch({
  hex,
  image,
  size = "md",
  className,
}: {
  hex: string | null;
  image?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  if (image) {
    return (
      <span
        aria-hidden
        className={cn("relative block shrink-0 overflow-hidden border border-black/10 shadow-xs", SIZE_CLASS[size], className)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Mẫu vải dạng swatch nhỏ từ URL linh hoạt */}
        <img src={image} alt="" className="size-full object-cover" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn("block shrink-0 border border-black/10 shadow-xs", SIZE_CLASS[size], className)}
      style={{ backgroundColor: hex ?? "#F4F4F5" }}
    />
  );
}
