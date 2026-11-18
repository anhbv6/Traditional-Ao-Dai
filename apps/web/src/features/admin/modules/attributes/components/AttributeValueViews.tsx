"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { type AdminAttributeValue } from "../types/attributes.types";
import { COLOR_FAMILIES, COLOR_FAMILY_HEX, localizedValue, readableOn, type ColorFamily } from "../utils/attributeMeta";

export interface ValueHandlers {
  onView?: (value: AdminAttributeValue) => void;
  onEdit: (value: AdminAttributeValue) => void;
  onToggle: (value: AdminAttributeValue) => void;
  onMove: (value: AdminAttributeValue, direction: -1 | 1) => void;
  onDelete: (value: AdminAttributeValue) => void;
}

interface ViewProps extends ValueHandlers {
  values: AdminAttributeValue[];
  /** Tắt đổi thứ tự khi đang tìm kiếm — thứ tự đang thấy không đầy đủ */
  reorderDisabled: boolean;
}

/** Menu ⋯ của một giá trị: xem chi tiết, sửa, ẩn/hiện, lên/xuống, xóa (màu / size đang có SKU thì khóa xóa) */
function ValueMenu({
  value,
  index,
  total,
  reorderDisabled,
  handlers,
  className,
}: {
  value: AdminAttributeValue;
  index: number;
  total: number;
  reorderDisabled: boolean;
  handlers: ValueHandlers;
  className?: string;
}) {
  const t = useTranslations("AdminPage.attributes");
  const inUse = (value.skuCount ?? 0) > 0;
  const items: AppMenuEntry[] = [
    // ...(handlers.onView
    //   ? [{ key: "view", label: t("menu.view"), icon: Eye, onSelect: () => handlers.onView?.(value) }]
    //   : []),
    { key: "edit", label: t("menu.edit"), icon: Pencil, onSelect: () => handlers.onEdit(value) },
    {
      key: "toggle",
      label: value.isActive ? t("menu.hide") : t("menu.show"),
      icon: value.isActive ? EyeOff : Eye,
      onSelect: () => handlers.onToggle(value),
    },
    { type: "separator", key: "sep-move" },
    {
      key: "up",
      label: t("menu.moveUp"),
      icon: ArrowUp,
      disabled: index === 0 || reorderDisabled,
      onSelect: () => handlers.onMove(value, -1),
    },
    {
      key: "down",
      label: t("menu.moveDown"),
      icon: ArrowDown,
      disabled: index === total - 1 || reorderDisabled,
      onSelect: () => handlers.onMove(value, 1),
    },
    { type: "separator", key: "sep-delete" },
    {
      key: "delete",
      label: t("menu.delete"),
      description: inUse ? t("menu.deleteBlocked", { count: value.skuCount ?? 0 }) : undefined,
      icon: Trash2,
      tone: "danger",
      disabled: inUse,
      onSelect: () => handlers.onDelete(value),
    },
  ];
  return (
    <AppMenu
      tone="admin"
      width={224}
      align="end"
      sideOffset={4}
      items={items}
      trigger={
        <button
          type="button"
          aria-label={t("menu.label", { name: value.name })}
          className={cn(
            "grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] outline-none transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B] focus-visible:ring-2 focus-visible:ring-[#18181B]/15 data-popup-open:bg-[#F4F4F5]",
            className
          )}
        >
          <MoreHorizontal size={15} />
        </button>
      }
    />
  );
}

function HiddenTag() {
  const t = useTranslations("AdminPage.attributes");
  return (
    <span className="shrink-0 rounded bg-rose-50 px-1.5 py-px text-2xs font-medium text-rose-700">
      {t("status.hidden")}
    </span>
  );
}

function SkuCount({ count }: { count: number | null }) {
  const t = useTranslations("AdminPage.attributes");
  if (count === null) return null;
  return (
    <span className={cn("text-2xs tabular-nums", count > 0 ? "text-[#52525B]" : "text-[#A1A1AA]")}>
      {t("skuCount", { count })}
    </span>
  );
}

/**
 * Bảng màu như hộp chỉ thêu: gom theo họ màu, hiển thị theo hệ thống lưới đều đặn tối đa 4–5 màu trên 1 hàng
 */
export function ColorPalette({ values, reorderDisabled, ...handlers }: ViewProps) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();
  const families: (ColorFamily | null)[] = [...COLOR_FAMILIES, null];
  const sections = families
    .map((family) => ({ family, items: values.filter((value) => value.family === family) }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-6">
      {sections.map(({ family, items }) => (
        <section key={family ?? "none"} className="space-y-3">
          {/* Tiêu đề họ màu */}
          <div className="flex items-center gap-2 border-b border-dashed border-[#E4E4E7] pb-2">
            <span
              aria-hidden
              className="size-3.5 rounded-full border border-black/10 shadow-2xs"
              style={{ background: family ? COLOR_FAMILY_HEX[family] : "#F4F4F5" }}
            />
            <h3 className="text-sm font-semibold text-[#09090B]">
              {family ? t(`family.${family}`) : t("family.none")}
            </h3>
            <span className="font-mono text-xs text-[#71717A]">({items.length})</span>
          </div>

          {/* Lưới màu: tối đa 4–5 màu trên một hàng, các ô co giãn đều và thẳng cột nhau */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {items.map((value) => {
              const index = values.indexOf(value);
              const tone = readableOn(value.hex);
              const { name } = localizedValue(value, locale);
              return (
                <div
                  key={value.id}
                  className={cn(
                    ADMIN_CARD_CLASS,
                    "group flex flex-col overflow-hidden transition-shadow hover:shadow-xs",
                    !value.isActive && "opacity-60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handlers.onEdit(value)}
                    className={cn(
                      "flex h-20 w-full cursor-pointer items-end justify-between px-2.5 pb-2 font-mono text-2xs font-medium transition-transform group-hover:brightness-95",
                      tone === "dark" ? "text-[#09090B]/75" : "text-white/90"
                    )}
                    style={{ background: value.hex ?? "#F4F4F5" }}
                  >
                    <span>{value.hex}</span>
                    {!value.isActive && <HiddenTag />}
                  </button>
                  <div className="flex items-center justify-between gap-1 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#09090B]">{name}</p>
                      <SkuCount count={value.skuCount} />
                    </div>
                    <ValueMenu
                      value={value}
                      index={index}
                      total={values.length}
                      reorderDisabled={reorderDisabled}
                      handlers={handlers}
                      className="-mr-1 shrink-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Size đặt trên một dải thước dây theo đúng thứ tự từ nhỏ đến lớn (thứ tự này cũng là thứ tự hiện ở trang sản phẩm),
 * bên dưới là danh sách chi tiết
 */
export function SizeTape({ values, reorderDisabled, ...handlers }: ViewProps) {
  const t = useTranslations("AdminPage.attributes");
  const locale = useLocale();
  return (
    <div className="space-y-4">
      <div className={cn(ADMIN_CARD_CLASS, "overflow-x-auto p-4")}>
        <div
          className="relative flex min-w-max items-center gap-2 rounded-md border border-[#E4E4E7] px-3 pb-3 pt-6"
          style={{
            // Vạch chia thước: vạch nhỏ mỗi 8px, vạch lớn mỗi 40px
            backgroundImage:
              "repeating-linear-gradient(90deg, #D4D4D8 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, #A1A1AA 0 1px, transparent 1px 40px)",
            backgroundSize: "100% 6px, 100% 12px",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#FCFCFB",
          }}
        >
          {values.map((value) => (
            <button
              key={value.id}
              type="button"
              onClick={() => handlers.onEdit(value)}
              className={cn(
                "min-w-12 cursor-pointer rounded-md border px-3 py-1.5 text-center font-mono text-sm font-semibold transition-colors",
                value.isActive
                  ? "border-[#18181B] bg-white text-[#09090B] hover:bg-[#18181B] hover:text-white"
                  : "border-dashed border-[#D4D4D8] bg-white text-[#A1A1AA]"
              )}
            >
              {value.code}
            </button>
          ))}
        </div>
        <p className="mt-2 text-2xs text-[#A1A1AA]">{t("size.tapeHint")}</p>
      </div>

      <div className={cn(ADMIN_CARD_CLASS, "divide-y divide-[#F4F4F5]")}>
        {values.map((value, index) => {
          const { name, description } = localizedValue(value, locale);
          return (
            <div key={value.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-24 shrink-0 truncate font-mono text-sm font-semibold text-[#09090B]">{value.code}</span>
              <div className="min-w-0 flex-1">
                {/* Tên chỉ hiện khi khác ký hiệu (VD "FREE_SIZE" → "Free size") — tránh lặp "S / S" */}
                {(name !== value.code || !value.isActive) && (
                  <p className="flex items-center gap-2 truncate text-sm text-[#09090B]">
                    {name !== value.code && name}
                    {!value.isActive && <HiddenTag />}
                  </p>
                )}
                {description && <p className="truncate text-xs text-[#71717A]">{description}</p>}
              </div>
              <SkuCount count={value.skuCount} />
              <ValueMenu
                value={value}
                index={index}
                total={values.length}
                reorderDisabled={reorderDisabled}
                handlers={handlers}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Đặc tính thiết kế: thẻ đồng đều độ cao, mô tả tối đa 2 dòng kèm "...", bấm vào xem chi tiết */
export function TraitGrid({ values, reorderDisabled, ...handlers }: ViewProps) {
  const locale = useLocale();

  return (
    <div className="grid items-stretch gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {values.map((value, index) => {
        const { name, description } = localizedValue(value, locale);

        return (
          <div
            key={value.id}
            className={cn(
              ADMIN_CARD_CLASS,
              "group flex h-full gap-3 p-3.5 transition-all hover:border-[#18181B]/40 hover:shadow-xs",
              !value.isActive && "opacity-60"
            )}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#F4F4F5] font-mono text-xs font-semibold text-[#52525B]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => (handlers.onView ? handlers.onView(value) : handlers.onEdit(value))}
              className="flex min-w-0 flex-1 cursor-pointer flex-col justify-between text-left outline-none"
            >
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-[#09090B] transition-colors group-hover:text-black">
                  <span className="truncate">{name}</span>
                  {!value.isActive && <HiddenTag />}
                </p>
              </div>
              {/* Mô tả thuần 1 ngôn ngữ theo trang web, tối đa 2 dòng quá thì "...", cố định min-height 2 dòng (2.5rem) để các thẻ luôn đồng đều độ cao */}
              <p
                className={cn(
                  "mt-2 min-h-[2.5rem] text-xs leading-relaxed line-clamp-2",
                  description ? "text-[#52525B]" : "italic text-[#A1A1AA]"
                )}
                title={description || undefined}
              >
                {description || "—"}
              </p>
            </button>
            <ValueMenu
              value={value}
              index={index}
              total={values.length}
              reorderDisabled={reorderDisabled}
              handlers={handlers}
              className="-mr-1 shrink-0"
            />
          </div>
        );
      })}
    </div>
  );
}
