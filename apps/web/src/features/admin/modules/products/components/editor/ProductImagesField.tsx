"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { uploadImageApi } from "@/features/upload";
import { AdminImageSlot, AdminMediaGroup } from "@/features/admin/core/ui";
import { prepareProductImage } from "../../utils/productImage";

const MAX_IMAGES = 8;
const MAX_DETAIL_IMAGES = MAX_IMAGES - 1;

interface ProductImagesFieldProps {
  value: string[];
  onChange: (images: string[]) => void;
}

/**
 * Quản lý ảnh sản phẩm:
 * - Ảnh đại diện (Cover): Ảnh chính tỉ lệ 3:4 dùng cho danh mục, giỏ hàng, thẻ sản phẩm.
 * - Bộ ảnh chi tiết (Gallery): Các góc chụp cận tà, cổ áo, chi tiết thêu... Tỉ lệ 3:4, hỗ trợ di chuyển thứ tự,
 *   đặt làm ảnh đại diện hoặc xóa.
 */
export function ProductImagesField({ value, onChange }: ProductImagesFieldProps) {
  const t = useTranslations("AdminPage.products.image");
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const coverImage = value[0] || "";
  const detailImages = value.slice(1);

  // Đổi hoặc xóa ảnh đại diện chính
  const handleCoverChange = (url: string) => {
    if (url) {
      if (value.length === 0) {
        onChange([url]);
      } else {
        onChange([url, ...value.slice(1)]);
      }
    } else {
      // Khi gỡ ảnh đại diện, nếu có ảnh chi tiết thì đôn ảnh chi tiết đầu tiên lên thay thế
      onChange(value.slice(1));
    }
  };

  // Tải nhiều ảnh chi tiết
  const handleDetailFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const remainingSlots = MAX_IMAGES - value.length;
    const files = Array.from(event.target.files ?? []).slice(0, remainingSlots);
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
      if (uploaded.length > 0) {
        // Nếu chưa có cả ảnh đại diện thì ảnh đầu tiên tải lên tự động làm ảnh bìa
        onChange([...value, ...uploaded]);
      }
      setIsUploading(false);
    }
  };

  // Di chuyển ảnh chi tiết sang trái hoặc phải
  const moveDetail = (index: number, delta: number) => {
    // Nếu bấm mũi tên trái ở ảnh chi tiết đầu tiên, đổi chỗ với ảnh đại diện
    if (index === 0 && delta === -1 && coverImage) {
      makeCover(0);
      return;
    }

    const next = [...detailImages];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(index + delta, 0, item);
    onChange([coverImage, ...next]);
  };

  // Đưa một ảnh trong album chi tiết lên làm ảnh đại diện
  const makeCover = (index: number) => {
    const target = detailImages[index];
    if (!target) return;
    const remaining = detailImages.filter((_, i) => i !== index);
    if (coverImage) {
      // Đổi chỗ: ảnh chi tiết thành ảnh bìa, ảnh bìa cũ xuống album chi tiết
      onChange([target, coverImage, ...remaining]);
    } else {
      onChange([target, ...remaining]);
    }
  };

  // Gỡ một ảnh chi tiết
  const removeDetail = (index: number) => {
    onChange(value.filter((_, i) => i !== index + 1));
  };

  return (
    <div className="space-y-6">
      <div className="@container">
        <div className="grid gap-6 @lg:grid-cols-[180px_minmax(0,1fr)]">
          {/* Nhóm 1: Ảnh đại diện */}
          <AdminMediaGroup title={t("cover")} ratio="3:4">
            <div className="max-w-44 @lg:max-w-none">
              <AdminImageSlot
                value={coverImage}
                onChange={handleCoverChange}
                aspectClass="aspect-[3/4]"
                folder="products"
                prepareFile={prepareProductImage}
                badge={
                  <span className="rounded-md bg-[#18181B] px-1.5 py-0.5 text-2xs font-medium text-white shadow-2xs">
                    {t("cover")}
                  </span>
                }
                placeholderText={t("uploadCover")}
                replaceText={t("replaceCover")}
                uploadingText={t("uploading")}
              />
            </div>
          </AdminMediaGroup>

          {/* Nhóm 2: Ảnh chi tiết & các góc chụp */}
          <AdminMediaGroup
            title={t("gallery")}
            ratio={`3:4 · ${t("galleryCount", { count: detailImages.length, max: MAX_DETAIL_IMAGES })}`}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5">
              {detailImages.map((url, index) => (
                <div
                  key={url}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#F4F4F5]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tải lên từ Cloudinary hoặc URL ngoài */}
                  <img src={url} alt="" className="size-full object-cover" />

                  {/* Thanh công cụ di chuyển & đặt làm đại diện */}
                  <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={index === 0 ? t("makeCover") : t("moveLeft")}
                      title={index === 0 ? t("makeCover") : t("moveLeft")}
                      onClick={() => moveDetail(index, -1)}
                      className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-[#09090B]"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={t("makeCover")}
                      title={t("makeCover")}
                      onClick={() => makeCover(index)}
                      className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-[#09090B]"
                    >
                      <Star size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label={t("moveRight")}
                      title={t("moveRight")}
                      disabled={index === detailImages.length - 1}
                      onClick={() => moveDetail(index, 1)}
                      className="grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-[#09090B] disabled:opacity-30"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Nút xóa ảnh chi tiết */}
                  <button
                    type="button"
                    aria-label={t("remove")}
                    onClick={() => removeDetail(index)}
                    className="absolute right-1 top-1 grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-[#3F3F46] shadow-2xs transition-colors hover:bg-white hover:text-rose-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Nút thêm ảnh chi tiết */}
              {detailImages.length < MAX_DETAIL_IMAGES && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#D4D4D8] bg-white text-xs text-[#71717A] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B] disabled:cursor-wait"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  {isUploading ? t("uploading") : t("add")}
                </button>
              )}
            </div>
          </AdminMediaGroup>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={isUploading}
        onChange={handleDetailFiles}
      />
    </div>
  );
}
