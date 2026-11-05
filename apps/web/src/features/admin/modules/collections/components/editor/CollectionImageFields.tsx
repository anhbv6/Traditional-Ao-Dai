"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Monitor, Smartphone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { uploadImageApi } from "@/features/upload";
import { compressCollectionImage } from "../../utils/collectionImage";
import { MAX_GALLERY_IMAGES } from "../../utils/collectionLifecycle";

/** Nén rồi tải từng ảnh lên; ảnh lỗi chỉ báo và bỏ qua, ảnh đã xong vẫn giữ */
function useImageUploader() {
  const notify = useNotify();
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) {
        const prepared = await compressCollectionImage(file);
        if (!prepared.success) {
          notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
          continue;
        }
        const res = await uploadImageApi(prepared.file, "general");
        urls.push(res.data.url);
      }
    } catch (error) {
      notify.error(error, "IMAGE_UPLOAD_FAILED");
    } finally {
      setIsUploading(false);
    }
    return urls;
  };

  return { upload, isUploading };
}

/**
 * Nhóm ảnh cùng một chỗ hiển thị (ảnh bìa, banner): tiêu đề + tỉ lệ khung, bên dưới là cặp bản máy tính / điện thoại.
 */
export function MediaGroup({
  title,
  ratio,
  children,
  className,
}: {
  title: string;
  /** Tỉ lệ khung gợi ý, VD "3:4" — dữ liệu kỹ thuật, không dịch */
  ratio: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="truncate text-body font-semibold text-[#09090B]">{title}</h3>
        <span className="shrink-0 font-mono text-2xs text-[#A1A1AA]">{ratio}</span>
      </div>
      {children}
    </div>
  );
}

/** Một ô ảnh: bấm để chọn, có nút gỡ; `aspectClass` quyết định khung hiển thị đúng tỉ lệ nơi dùng */
export function ImageSlot({
  device,
  value,
  onChange,
  aspectClass,
  fallback,
}: {
  device: "desktop" | "mobile";
  value: string;
  onChange: (url: string) => void;
  aspectClass: string;
  /** Ảnh sẽ dùng thay khi ô này trống (bản mobile dùng lại bản desktop) */
  fallback?: string;
}) {
  const t = useTranslations("AdminPage.collections.media");
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUploader();
  const DeviceIcon = device === "desktop" ? Monitor : Smartphone;
  const shown = value || fallback;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const [url] = await upload([file]);
    if (url) onChange(url);
  };

  return (
    <div className="min-w-0">
      <div
        className={cn("group relative overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]", aspectClass)}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image
          <img src={shown} alt="" className={cn("size-full object-cover", !value && "opacity-40 grayscale")} />
        ) : null}

        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 text-xs font-medium transition-colors disabled:cursor-wait",
            value ? "bg-black/0 text-transparent hover:bg-black/40 hover:text-white" : "text-[#52525B] hover:bg-black/5"
          )}
        >
          {isUploading ? <Loader2 size={18} className="animate-spin text-[#52525B]" /> : <ImagePlus size={18} />}
          {isUploading ? t("uploading") : value ? t("replace") : fallback ? t("useOwn") : t("upload")}
        </button>

        {!value && fallback && (
          <span className="pointer-events-none absolute inset-x-1.5 bottom-1.5 rounded bg-white/90 px-1.5 py-0.5 text-center text-2xs font-medium text-[#52525B]">
            {t("usingDesktop")}
          </span>
        )}
        {value && (
          <button
            type="button"
            aria-label={t("remove")}
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1.5 grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs hover:bg-white"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#71717A]">
        <DeviceIcon size={13} className="shrink-0" aria-hidden />
        <span className="truncate">{t(device)}</span>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
    </div>
  );
}

/** Ảnh lookbook: nhiều ảnh, sắp xếp trái/phải, gỡ từng ảnh */
export function GalleryField({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const t = useTranslations("AdminPage.collections.media");
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUploader();

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_GALLERY_IMAGES - value.length);
    event.target.value = "";
    if (files.length === 0) return;
    const urls = await upload(files);
    if (urls.length > 0) onChange([...value, ...urls]);
  };

  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="truncate text-body font-semibold text-[#09090B]">{t("lookbook")}</h3>
        <span className="shrink-0 text-xs tabular-nums text-[#A1A1AA]">
          {t("lookbookCount", { count: value.length, max: MAX_GALLERY_IMAGES })}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5">
        {value.map((url, index) => (
          <div
            key={url}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image */}
            <img src={url} alt="" className="size-full object-cover" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button
                type="button"
                aria-label={t("moveLeft")}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] disabled:opacity-30"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                aria-label={t("moveRight")}
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
                className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] disabled:opacity-30"
              >
                <ArrowRight size={12} />
              </button>
            </div>
            <button
              type="button"
              aria-label={t("remove")}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {value.length < MAX_GALLERY_IMAGES && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D4D4D8] bg-white text-xs text-[#71717A] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] disabled:cursor-wait"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            {isUploading ? t("uploading") : t("addLookbook")}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={handleFiles}
      />
    </div>
  );
}
