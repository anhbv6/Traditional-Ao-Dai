"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { uploadImageApi } from "@/features/upload";
import { prepareProductImage } from "../../utils/productImage";

const MAX_IMAGES = 8;

interface ProductImagesFieldProps {
  value: string[];
  onChange: (images: string[]) => void;
}

/** Quản lý ảnh sản phẩm: ảnh đầu tiên là ảnh đại diện, còn lại là ảnh mô tả; `object-contain` để ảnh 9:16 không bị cắt tà */
export function ProductImagesField({ value, onChange }: ProductImagesFieldProps) {
  const t = useTranslations("AdminPage.products.image");
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_IMAGES - value.length);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const prepared = await prepareProductImage(file);
        if (!prepared.success) {
          notify.error(prepared.error, "IMAGE_UPLOAD_FAILED");
          continue;
        }
        const res = await uploadImageApi(prepared.file, "products");
        uploaded.push(res.data.url);
      }
    } catch (error) {
      notify.error(error, "IMAGE_UPLOAD_FAILED");
    } finally {
      // Giữ các ảnh đã tải xong dù ảnh sau bị lỗi
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
      setIsUploading(false);
    }
  };

  const makeCover = (index: number) => {
    onChange([value[index], ...value.filter((_, i) => i !== index)]);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {value.map((url, index) => (
          <div key={url} className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-[#E4E4E7] bg-[#F4F4F5]">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ URL tùy ý (blob xem trước / avatar / ảnh do admin nhập), không tối ưu được bằng next/image */}
            <img src={url} alt="" className="size-full object-contain" />
            <button
              type="button"
              aria-label={t("remove")}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="absolute right-1 top-1 grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-[#09090B]"
            >
              <X size={13} />
            </button>
            {index === 0 ? (
              <span className="absolute inset-x-1 bottom-1 rounded-md bg-[#18181B] py-0.5 text-center text-2xs font-medium text-white">
                {t("cover")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(index)}
                className="absolute inset-x-1 bottom-1 cursor-pointer rounded-md bg-white/90 py-0.5 text-center text-2xs font-medium text-[#3F3F46] transition-colors hover:bg-white hover:text-[#09090B]"
              >
                {t("makeCover")}
              </button>
            )}
          </div>
        ))}

        {value.length < MAX_IMAGES && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white text-xs text-[#71717A] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} strokeWidth={1.8} />}
            {isUploading ? t("uploading") : t("add")}
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleFiles} />
    </div>
  );
}
