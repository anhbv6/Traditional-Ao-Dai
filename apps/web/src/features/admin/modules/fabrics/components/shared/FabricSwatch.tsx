import { cn } from "@/lib/utils";

/** Vân dệt mờ phủ lên màu — để ô màu đọc ra là "mảnh vải" chứ không phải chấm màu phẳng */
const WEAVE_OVERLAY =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.07) 0 1px, transparent 1px 4px)";

const SIZE_CLASS = {
  sm: "size-5 rounded-md",
  md: "size-10 rounded-lg",
} as const;

/** Mảnh vải theo màu của cây vải (màu lấy từ thuộc tính COLOR) — chưa có màu thì xám nhạt */
export function FabricSwatch({ hex, size = "md", className }: { hex: string | null; size?: keyof typeof SIZE_CLASS; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 border border-black/10", SIZE_CLASS[size], className)}
      style={{ backgroundColor: hex ?? "#F4F4F5", backgroundImage: WEAVE_OVERLAY }}
    />
  );
}
