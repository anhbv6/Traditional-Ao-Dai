"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Loader2, Video, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { uploadImageApi } from "@/features/upload";
import { compressCollectionImage } from "@/features/admin/modules/collections";
import { MAX_CLOSEUP_IMAGES } from "../../utils/materialMeta";

const DIRECT_VIDEO = /\.(mp4|webm|mov)(\?.*)?$/i;

/**
 * Ảnh cận mặt vải (ảnh đầu là ảnh đại diện trên thẻ) + video thể hiện độ rủ / độ bóng khi vải chuyển động
 */
export function MaterialMediaField({
  images,
  onImagesChange,
  videoUrl,
  onVideoUrlChange,
  inputClassName,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  inputClassName: string;
}) {
  const t = useTranslations("AdminPage.materials");
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const room = MAX_CLOSEUP_IMAGES - images.length;

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, room);
    event.target.value = "";
    if (files.length === 0) return;
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
      if (urls.length) onImagesChange([...images, ...urls]);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + direction, 0, item);
    onImagesChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {images.map((src, index) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-[#E4E4E7]">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên (URL Cloudinary), không qua next/image */}
            <img src={src} alt="" className="size-full object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-[#18181B] px-1 py-px text-2xs font-medium text-white">
                {t("media.cover")}
              </span>
            )}
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={t("media.moveLeft")}
                className="grid size-6 cursor-pointer place-items-center rounded bg-white/90 text-[#3F3F46] disabled:invisible"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => onImagesChange(images.filter((_, i) => i !== index))}
                aria-label={t("media.remove")}
                className="grid size-6 cursor-pointer place-items-center rounded bg-white/90 text-rose-600"
              >
                <X size={12} />
              </button>
              <button
                type="button"
                disabled={index === images.length - 1}
                onClick={() => move(index, 1)}
                aria-label={t("media.moveRight")}
                className="grid size-6 cursor-pointer place-items-center rounded bg-white/90 text-[#3F3F46] disabled:invisible"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#D4D4D8] text-2xs font-medium text-[#71717A] hover:border-[#A1A1AA] hover:text-[#09090B] disabled:cursor-wait"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {isUploading ? t("media.uploading") : t("media.add", { count: room })}
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

      <div className="space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
          <Video size={14} className="text-[#71717A]" aria-hidden /> {t("field.videoUrl")}
        </span>
        <input
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value.trim())}
          placeholder={t("placeholders.videoUrl")}
          className={cn(inputClassName, "font-mono text-xs")}
        />
        {videoUrl &&
          (DIRECT_VIDEO.test(videoUrl) ? (
            <video src={videoUrl} muted loop playsInline controls className="mt-2 aspect-video w-full rounded-lg bg-black" />
          ) : (
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#52525B] hover:text-[#09090B] hover:underline"
            >
              <ExternalLink size={12} aria-hidden /> {t("media.openVideo")}
            </a>
          ))}
      </div>
    </div>
  );
}
