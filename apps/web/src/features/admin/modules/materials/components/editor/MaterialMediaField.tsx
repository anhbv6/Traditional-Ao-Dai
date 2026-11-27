"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Loader2, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { compressClientImage, uploadImageApi } from "@/features/upload";
import { AdminImageSlot } from "@/features/admin/core/ui";
import { MAX_CLOSEUP_IMAGES } from "../../utils/materialMeta";

const DIRECT_VIDEO = /\.(mp4|webm|mov)(\?.*)?$/i;

/**
 * Quản lý ảnh cận mặt vải và video độ rủ dùng chung component AdminImageSlot:
 * - Từng ô ảnh tận dụng toàn bộ hiệu ứng hover (overlay mờ đen, chữ thay ảnh, nút xóa chuẩn mực).
 * - Thao tác di chuyển thứ tự trái / phải mượt mà.
 * - Ảnh đầu tiên đánh dấu Ảnh bìa (Cover) đại diện cho cây vải.
 * - Nhập video trực quan, hỗ trợ xem trước.
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
        const prepared = await compressClientImage(file);
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
      if (urls.length > 0) onImagesChange([...images, ...urls]);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(index + direction, 0, item);
    onImagesChange(next);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Lưới ảnh cận mặt vải — dùng component chung AdminImageSlot */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs text-[#71717A]">
            {t("media.hint")}
          </span>
          <span className="font-mono text-xs tabular-nums text-[#71717A]">
            {images.length}/{MAX_CLOSEUP_IMAGES}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {images.map((src, index) => (
            <AdminImageSlot
              key={src}
              value={src}
              aspectClass="aspect-square"
              badge={
                index === 0 ? (
                  <span className="rounded bg-[#18181B]/90 px-1.5 py-0.5 text-2xs font-medium text-white shadow-2xs">
                    {t("media.cover")}
                  </span>
                ) : undefined
              }
              onChange={(newUrl) => {
                if (!newUrl) {
                  onImagesChange(images.filter((_, i) => i !== index));
                } else {
                  const next = [...images];
                  next[index] = newUrl;
                  onImagesChange(next);
                }
              }}
              replaceText={t("media.replace")}
              actions={
                images.length > 1 ? (
                  <div className="flex w-full justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        move(index, -1);
                      }}
                      aria-label={t("media.moveLeft")}
                      className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/95 text-[#3F3F46] shadow-2xs hover:bg-white disabled:invisible"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        move(index, 1);
                      }}
                      aria-label={t("media.moveRight")}
                      className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/95 text-[#3F3F46] shadow-2xs hover:bg-white disabled:invisible"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                ) : undefined
              }
            />
          ))}

          {/* Ô bấm tải thêm ảnh mới */}
          {room > 0 && (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D4D4D8] bg-white text-xs text-[#71717A] transition-colors hover:border-[#18181B] hover:bg-[#FAFAFA] hover:text-[#09090B] disabled:cursor-wait"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin text-[#18181B]" /> : <ImagePlus size={18} />}
              <span className="text-2xs font-medium">
                {isUploading ? t("media.uploading") : t("media.add", { count: room })}
              </span>
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

      {/* 2. Đường dẫn Video quay độ rủ của vải */}
      <div className="space-y-1.5 pt-1">
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#71717A]">
          <Video size={13} className="text-[#71717A]" aria-hidden />
          <span>{t("field.videoUrl")}</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value.trim())}
            placeholder={t("placeholders.videoUrl")}
            className={cn(inputClassName, "font-mono text-xs")}
          />
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs font-medium text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#09090B]"
            >
              <ExternalLink size={12} aria-hidden /> {t("media.openVideo")}
            </a>
          )}
        </div>
        {videoUrl && DIRECT_VIDEO.test(videoUrl) && (
          <video
            src={videoUrl}
            muted
            loop
            playsInline
            controls
            className="mt-2 aspect-video max-h-48 rounded-xl bg-black object-cover"
          />
        )}
      </div>
    </div>
  );
}
