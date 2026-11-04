"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CARE_ICONS, type CareCode } from "../../utils/materialMeta";

/**
 * Nhãn bảo quản dạng băng vải may vào áo: dải dọc, mép đường may nét đứt, mỗi dòng một icon + chữ.
 * Cũng là bản xem trước nội dung in trên tem / trang sản phẩm.
 */
export function CareLabel({ codes, note, className }: { codes: CareCode[]; note?: string | null; className?: string }) {
  const t = useTranslations("AdminPage.materials");
  return (
    <div
      className={cn(
        "relative rounded-sm bg-[#FCFCFB] px-4 pb-4 pt-5 shadow-[0_1px_0_#E4E4E7,0_8px_20px_-14px_rgba(9,9,11,0.35)]",
        className
      )}
    >
      {/* Đường may ở đầu nhãn */}
      <span aria-hidden className="absolute inset-x-2 top-2 border-t border-dashed border-[#D4D4D8]" />
      {codes.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#A1A1AA]">{t("care.labelEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {codes.map((code) => {
            const Icon = CARE_ICONS[code];
            return (
              <li key={code} className="flex items-center gap-2.5 text-2xs text-[#3F3F46]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[#3F3F46]">
                  <Icon size={13} aria-hidden />
                </span>
                {t(`careCode.${code}`)}
              </li>
            );
          })}
        </ul>
      )}
      {note && <p className="mt-3 border-t border-dashed border-[#E4E4E7] pt-2.5 text-2xs italic text-[#71717A]">{note}</p>}
    </div>
  );
}
