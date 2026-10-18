"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ImagePlus, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Một tệp đã chọn kèm URL xem trước (blob) — URL được thu hồi khi gỡ tệp / gỡ component */
export interface MediaItem {
  id: string;
  file: File;
  kind: "image" | "video";
  previewUrl: string;
}

export interface MediaUploaderProps {
  items: MediaItem[];
  onItemsChange: (items: MediaItem[]) => void;
  /** Nhãn — kiểu chữ giống TextField */
  label?: ReactNode;
  /** Số tệp tối đa — mặc định 5 */
  maxFiles?: number;
  /** Dung lượng tối đa mỗi ảnh (MB) — mặc định 5 */
  maxImageMB?: number;
  /** Dung lượng tối đa mỗi video (MB) — mặc định 30. Đặt 0 để chỉ nhận ảnh */
  maxVideoMB?: number;
  className?: string;
}

const LABEL_CLASS = "block text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]";
const MB = 1024 * 1024;

/**
 * Chọn ảnh / video dùng chung (đánh giá sản phẩm, hồ sơ…):
 * - Bấm hoặc kéo thả tệp vào khung; xem trước dạng lưới, video có biểu tượng play; nút ✕ gỡ từng tệp.
 * - Kiểm tra định dạng, dung lượng và số lượng ngay khi chọn — tệp không hợp lệ bị bỏ qua kèm thông báo.
 * - Chỉ quản lý tệp phía trình duyệt; việc tải lên server do nơi dùng tự xử lý khi gửi form.
 *
 * @example
 * const [media, setMedia] = useState<MediaItem[]>([]);
 * <MediaUploader label="Ảnh / video" items={media} onItemsChange={setMedia} />
 */
export function MediaUploader({
  items,
  onItemsChange,
  label,
  maxFiles = 5,
  maxImageMB = 5,
  maxVideoMB = 30,
  className,
}: MediaUploaderProps) {
  const t = useTranslations("Common.mediaUploader");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptsVideo = maxVideoMB > 0;

  // Thu hồi URL xem trước khi component bị gỡ (tránh rò bộ nhớ)
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next = [...items];
    let message: string | null = null;

    for (const file of Array.from(fileList)) {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") && acceptsVideo ? "video" : null;
      if (!kind) {
        message = t("invalidType");
        continue;
      }
      const limitMB = kind === "image" ? maxImageMB : maxVideoMB;
      if (file.size > limitMB * MB) {
        message = t("tooLarge", { name: file.name, max: limitMB });
        continue;
      }
      if (next.length >= maxFiles) {
        message = t("tooMany", { max: maxFiles });
        break;
      }
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}-${next.length}`, file, kind, previewUrl: URL.createObjectURL(file) });
    }

    setError(message);
    onItemsChange(next);
  };

  const removeItem = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onItemsChange(items.filter((item) => item.id !== id));
    setError(null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const isFull = items.length >= maxFiles;

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className={LABEL_CLASS}>{label}</span>
          <span className="text-xs tabular-nums text-[var(--text-light)]">
            {items.length}/{maxFiles}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group/media relative aspect-square overflow-hidden bg-[var(--bg-secondary)]"
            >
              {item.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước từ blob: next/image không tối ưu được URL blob
                <img src={item.previewUrl} alt={item.file.name} className="size-full object-cover" />
              ) : (
                <>
                  <video src={item.previewUrl} muted playsInline preload="metadata" className="size-full object-cover" aria-label={item.file.name} />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25 text-white">
                    <Play size={18} strokeWidth={1.6} className="fill-white" />
                  </span>
                </>
              )}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={t("remove", { name: item.file.name })}
                className="absolute right-1 top-1 grid size-6 cursor-pointer place-items-center bg-[var(--bg-card)]/90 text-[var(--text-main)] transition-colors hover:bg-[var(--primary-color)] hover:text-white"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Ô thêm tệp — chiếm cả hàng khi chưa có tệp nào để vùng kéo thả đủ lớn */}
        {!isFull ? (
          <label
            htmlFor={inputId}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-[var(--border)] bg-[var(--bg-main)] text-center text-[var(--text-light)] transition-colors duration-300 hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]",
              items.length === 0 ? "col-span-4 px-4 py-6" : "aspect-square",
              isDragging && "border-[var(--primary-color)] bg-[var(--primary-color)]/5 text-[var(--primary-ink)]",
            )}
          >
            <ImagePlus size={items.length === 0 ? 22 : 18} strokeWidth={1.5} />
            {items.length === 0 ? (
              <>
                <span className="text-sm text-[var(--text-main)]">{acceptsVideo ? t("dropTitle") : t("dropTitleImage")}</span>
                <span className="text-xs">
                  {acceptsVideo ? t("dropHint", { image: maxImageMB, video: maxVideoMB, max: maxFiles }) : t("dropHintImage", { image: maxImageMB, max: maxFiles })}
                </span>
              </>
            ) : (
              <span className="text-[11px]">{t("add")}</span>
            )}
          </label>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={acceptsVideo ? "image/*,video/*" : "image/*"}
        className="sr-only"
        onChange={(event) => {
          addFiles(event.target.files);
          // Cho phép chọn lại đúng tệp vừa gỡ
          event.target.value = "";
        }}
      />

      {error ? (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-[var(--destructive)] motion-safe:animate-shake">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
