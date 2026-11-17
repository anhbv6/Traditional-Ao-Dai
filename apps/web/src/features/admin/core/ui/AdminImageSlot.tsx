"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { compressClientImage, uploadImageApi } from "@/features/upload";

export interface AdminImageSlotProps {
  /** Đường dẫn ảnh hiện tại */
  value: string;
  /** Callback khi ảnh thay đổi (trả về URL ảnh mới hoặc chuỗi rỗng khi xóa) */
  onChange: (url: string) => void;
  /** Tỉ lệ khung hình (VD: "aspect-square", "aspect-[3/4]", "aspect-[16/7]", "aspect-[4/3]") */
  aspectClass?: string;
  /** Nhãn hiển thị bên dưới ô ảnh (VD: Icon + Text "Bản máy tính", "Bản điện thoại") */
  label?: ReactNode;
  /** Huy hiệu ở góc trên bên trái (VD: "Ảnh bìa") */
  badge?: ReactNode;
  /** Ảnh hiển thị mờ khi ô này trống (VD: fallback sang bản desktop) */
  fallback?: string;
  /** Chữ hiển thị khi chưa có ảnh */
  placeholderText?: string;
  /** Chữ hiển thị khi hover có ảnh để thay */
  replaceText?: string;
  /** Chữ khi đang tải ảnh lên */
  uploadingText?: string;
  /** Thư mục tải lên Cloudinary (mặc định "general") */
  folder?: string;
  /** Cho phép gỡ ảnh (mặc định true) */
  allowRemove?: boolean;
  /** Các nút thao tác bổ sung ở góc dưới khung ảnh (VD: nút chuyển trái / phải) */
  actions?: ReactNode;
  /** Vô hiệu hóa ô ảnh */
  disabled?: boolean;
  className?: string;
}

/**
 * Ô chọn / tải / thay đổi ảnh chuẩn cho toàn bộ khu vực Admin:
 * - Khi trống: Hiển thị placeholder nhã nhặn, click để chọn tệp tải lên.
 * - Khi có ảnh: Hiển thị ảnh đầy đủ; HOVER vào sẽ phủ lớp mờ đen mượt mà kèm chữ "Thay ảnh".
 * - Nút gỡ ảnh (X) ở góc trên bên phải nổi bật và êm ái.
 * - Tự động nén WebP trên trình duyệt trước khi tải lên Cloudinary.
 */
export function AdminImageSlot({
  value,
  onChange,
  aspectClass = "aspect-square",
  label,
  badge,
  fallback,
  placeholderText = "Tải ảnh lên",
  replaceText = "Thay ảnh",
  uploadingText = "Đang tải...",
  folder = "general",
  allowRemove = true,
  actions,
  disabled = false,
  className,
}: AdminImageSlotProps) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const shown = value || fallback;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const prepared = await compressClientImage(file);
      if (!prepared.success) {
        notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
        return;
      }
      const res = await uploadImageApi(prepared.file, folder);
      onChange(res.data.url);
    } catch (error) {
      notify.error(error, "IMAGE_UPLOAD_FAILED");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#F4F4F5] transition-colors",
          aspectClass
        )}
      >
        {/* Ảnh hiển thị */}
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh tải lên từ Cloudinary hoặc URL ngoài
          <img
            src={shown}
            alt=""
            className={cn("size-full object-cover transition-transform duration-300", !value && "opacity-40 grayscale")}
          />
        ) : null}

        {/* Lớp tương tác: Click để Tải ảnh / Thay ảnh (Hover overlay) */}
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all duration-200 disabled:cursor-wait",
            value
              ? "bg-black/0 text-transparent hover:bg-black/45 hover:text-white"
              : "text-[#52525B] hover:border-[#18181B] hover:bg-black/5 hover:text-[#09090B]"
          )}
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin text-[#18181B]" />
          ) : (
            <ImagePlus size={18} className="shrink-0" />
          )}
          <span>{isUploading ? uploadingText : value ? replaceText : placeholderText}</span>
        </button>

        {/* Badge góc trên bên trái (VD: "Ảnh bìa") */}
        {badge && (
          <div className="pointer-events-none absolute left-1.5 top-1.5 z-10">
            {badge}
          </div>
        )}

        {/* Nhãn thông báo đang dùng fallback */}
        {!value && fallback && (
          <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 rounded bg-white/90 px-1.5 py-0.5 text-center text-2xs font-medium text-[#52525B] shadow-2xs">
            Dùng ảnh mặc định
          </span>
        )}

        {/* Nút xóa ảnh góc trên bên phải */}
        {value && allowRemove && !disabled && (
          <button
            type="button"
            aria-label="Xóa ảnh"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-1.5 top-1.5 z-10 grid size-6 cursor-pointer place-items-center rounded-md bg-white/95 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-rose-600"
          >
            <X size={13} />
          </button>
        )}

        {/* Các nút hành động phụ ở dưới đáy (VD: mũi tên sang trái/phải) */}
        {actions && (
          <div className="absolute inset-x-1.5 bottom-1.5 z-10 flex justify-between">
            {actions}
          </div>
        )}
      </div>

      {/* Nhãn thiết bị / chú thích bên dưới */}
      {label && (
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#71717A]">
          {label}
        </div>
      )}

      {/* File input ẩn */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={disabled || isUploading}
        onChange={handleFileChange}
      />
    </div>
  );
}

/**
 * Nhóm hiển thị media (tiêu đề + tỉ lệ gợi ý ở góc phải + nội dung ô ảnh bên dưới)
 */
export function AdminMediaGroup({
  title,
  ratio,
  children,
  className,
}: {
  title: string;
  ratio?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h4 className="truncate text-sm font-semibold text-[#09090B]">{title}</h4>
        {ratio && <span className="shrink-0 font-mono text-2xs text-[#A1A1AA]">{ratio}</span>}
      </div>
      {children}
    </div>
  );
}
