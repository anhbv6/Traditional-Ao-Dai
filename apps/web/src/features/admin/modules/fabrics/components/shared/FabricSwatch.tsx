import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-5 rounded-md",
  md: "size-10 rounded-lg",
} as const;

/** Mảnh vải theo màu của cây vải (màu lấy từ thuộc tính COLOR) — màu trơn, chưa có màu thì xám nhạt */
export function FabricSwatch({ hex, size = "md", className }: { hex: string | null; size?: keyof typeof SIZE_CLASS; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block shrink-0 border border-black/10 shadow-xs", SIZE_CLASS[size], className)}
      style={{ backgroundColor: hex ?? "#F4F4F5" }}
    />
  );
}
