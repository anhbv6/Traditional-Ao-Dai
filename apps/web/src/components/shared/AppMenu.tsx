"use client";

import { Fragment, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { Check, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  FLOATING_ARROW_CLASS,
  FLOATING_COLLISION_PADDING,
  FLOATING_SURFACE_CLASS,
  FLOATING_TOP_BAR_CLASS,
  isNativeButton,
  keepLinkSemantics,
} from "./floatingSurface";

/* ============================================================================
 * KIỂU DỮ LIỆU
 * ========================================================================== */

export interface AppMenuItem {
  type?: "item";
  /** Khoá duy nhất — cũng là giá trị khi menu ở chế độ chọn (`selection`) */
  key: string;
  label: ReactNode;
  icon?: LucideIcon;
  /** Dòng phụ nhỏ dưới nhãn */
  description?: ReactNode;
  /** Có href → mục là link điều hướng (Next Link, giữ locale) */
  href?: string;
  /** Không có href → gọi khi chọn (click / Enter / Space) */
  onSelect?: () => void;
  /** `danger`: chữ đỏ cảnh báo (đăng xuất, xoá…) */
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Đánh dấu mục đang ở (VD trang hiện tại) */
  active?: boolean;
  /** Phần tử cuối dòng: phím tắt, số lượng, badge… */
  trailing?: ReactNode;
}

export type AppMenuEntry = AppMenuItem | { type: "separator"; key: string } | { type: "label"; key: string; label: ReactNode };

export interface AppMenuProps {
  /** Phần tử mở menu (1 element, VD <button>) — Base UI gắn aria-haspopup / aria-expanded / phím mũi tên */
  trigger: ReactElement;
  /** Phần tử mở có phải <button> gốc không — mặc định tự đoán theo thẻ (Link / <a> → false) */
  nativeButton?: boolean;
  items: AppMenuEntry[];
  /** Khối trên đầu danh sách (VD thẻ người dùng: avatar + tên + email) */
  header?: ReactNode;
  /** Khối cuối danh sách */
  footer?: ReactNode;
  /**
   * Chế độ chọn một (VD sắp xếp, ngôn ngữ): các mục thành radio, mục được chọn có dấu ✓.
   * `value` là `key` của mục đang chọn.
   */
  selection?: { value: string; onValueChange: (value: string) => void };

  /* ---------- Vị trí ---------- */
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Bề rộng: `auto` (tối thiểu 14rem) | `trigger` (bằng phần tử mở) | số px */
  width?: "auto" | "trigger" | number;

  /* ---------- Hành vi ---------- */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Mở khi rê chuột (desktop) — vẫn mở được bằng click / phím */
  openOnHover?: boolean;
  /** Mũi tên thoi đỏ đô chỉ về phần tử mở */
  showArrow?: boolean;
  /** Không khoá cuộn / không chặn tương tác ngoài khi mở (menu nhỏ ở header) */
  modal?: boolean;
  /** `default`: phong cách storefront (nền kem, đỏ đô). `admin`: đơn sắc khu quản trị (bo góc, không vạch / mũi tên) */
  tone?: AppMenuTone;

  className?: string;
}

/* ============================================================================
 * CẤU HÌNH GIAO DIỆN
 * ========================================================================== */

export type AppMenuTone = "default" | "admin";

/*
 * Tông admin: đổi lại token màu ngay trên Popup (mọi class bên dưới chỉ đọc biến) → đơn sắc theo docs/guides/admin-ui.md.
 * Popup render qua portal nên tự gắn `admin-shell` để dùng font Inter và luôn sáng.
 */
const ADMIN_SURFACE_CLASS = cn(
  "admin-shell rounded-xl p-1.5 font-(family-name:--font-admin) shadow-[0_12px_32px_-12px_rgba(9,9,11,0.2)]",
  "[--bg-card:#FFFFFF] [--bg-secondary:#F4F4F5] [--border:#E4E4E7] [--text-main:#09090B] [--text-light:#71717A]",
  "[--primary-ink:#09090B] [--primary-color:#18181B] [--accent-color:#71717A]",
);
const ADMIN_ITEM_CLASS = "min-h-9 rounded-lg px-3";

const ITEM_CLASS = cn(
  "group/item relative flex min-h-10 w-full cursor-pointer select-none items-center gap-3 px-4 py-2 text-left text-[13px] leading-snug outline-none",
  "transition-colors duration-200",
  "data-highlighted:bg-[var(--bg-secondary)]",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
);

const TONE_CLASS = {
  default: "text-[var(--text-main)] data-highlighted:text-[var(--primary-ink)]",
  danger: "text-(--danger) data-highlighted:bg-(--danger)/[0.07]",
} as const;

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

/**
 * Menu thả xuống dùng chung toàn storefront (menu tài khoản, sắp xếp, hành động "…" trên thẻ, chọn ngôn ngữ…).
 * Dựng trên Base UI Menu → có sẵn: role menu/menuitem, điều hướng bằng phím mũi tên / Home / End,
 * gõ chữ để nhảy tới mục (typeahead), Esc để đóng, trả focus về phần tử mở, định vị tự lật khi sát mép màn hình,
 * render qua portal nên không bị cắt bởi khung `overflow: hidden`.
 *
 * Giao diện: góc vuông, nền kem, vạch đỏ đô ở đỉnh + mũi tên thoi đỏ đô; mục được trỏ có nền nhạt + vạch đỏ đô bên trái
 * trượt vào; icon đổi màu theo; mục `danger` đỏ cảnh báo. Mở / đóng: mờ + phóng nhẹ từ phía phần tử mở.
 *
 * @example Menu tài khoản
 * <AppMenu
 *   trigger={<button aria-label={t("account")}><Avatar /></button>}
 *   header={<UserCard />}
 *   items={[
 *     { key: "profile", label: t("profile"), icon: UserRound, href: "/profile" },
 *     { key: "orders", label: t("orders"), icon: Package, href: "/profile/orders" },
 *     { type: "separator", key: "sep" },
 *     { key: "logout", label: t("logout"), icon: LogOut, tone: "danger", onSelect: () => setConfirmOpen(true) },
 *   ]}
 * />
 *
 * @example Chọn một (sắp xếp)
 * <AppMenu trigger={<button>{t("sort")}</button>} width="trigger"
 *   selection={{ value: sort, onValueChange: setSort }}
 *   items={[{ key: "newest", label: t("newest") }, { key: "priceAsc", label: t("priceAsc") }]} />
 */
export function AppMenu({
  trigger,
  nativeButton,
  items,
  header,
  footer,
  selection,
  side = "bottom",
  align = "end",
  sideOffset = 10,
  width = "auto",
  open,
  onOpenChange,
  openOnHover = false,
  showArrow = true,
  modal = false,
  tone = "default",
  className,
}: AppMenuProps) {
  const isAdmin = tone === "admin";
  const widthStyle: CSSProperties | undefined = typeof width === "number" ? { width } : undefined;

  const renderItemContent = (item: AppMenuItem, selectable: boolean) => {
    const Icon = item.icon;
    return (
      <>
        {/* Vạch đỏ đô bên trái trượt vào khi mục được trỏ / chọn bằng phím */}
        {isAdmin ? null : <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1.5 left-0 w-[2px] origin-center scale-y-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-highlighted/item:scale-y-100",
            item.tone === "danger" ? "bg-(--danger)" : "bg-[var(--primary-color)]",
          )}
        />}
        {Icon ? (
          <Icon
            size={16}
            strokeWidth={1.6}
            aria-hidden="true"
            className={cn(
              "shrink-0 transition-colors duration-200",
              item.tone === "danger"
                ? "text-current"
                : "text-[var(--text-light)] group-data-highlighted/item:text-[var(--primary-ink)]",
              item.active && "text-[var(--primary-ink)]",
            )}
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate", item.active && "font-semibold text-[var(--primary-ink)]")}>{item.label}</span>
          {item.description ? (
            <span className="mt-0.5 block truncate text-[11px] text-[var(--text-light)]">{item.description}</span>
          ) : null}
        </span>
        {item.trailing ? <span className="shrink-0 text-[11px] text-[var(--text-light)]">{item.trailing}</span> : null}
        {selectable ? (
          <Menu.RadioItemIndicator className="shrink-0 text-[var(--primary-ink)]">
            <Check size={15} strokeWidth={2} />
          </Menu.RadioItemIndicator>
        ) : null}
        {item.active && !selectable ? (
          <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-[var(--primary-color)]" />
        ) : null}
      </>
    );
  };

  const renderEntry = (entry: AppMenuEntry) => {
    if (entry.type === "separator") {
      return <Menu.Separator key={entry.key} className={cn("my-1.5 h-px bg-[var(--border)]", isAdmin ? "-mx-1.5" : "mx-4")} />;
    }
    if (entry.type === "label") {
      return (
        <div
          key={entry.key}
          className={cn(
            "pb-1 pt-2.5 text-[10px] font-semibold uppercase text-[var(--accent-color)]",
            isAdmin ? "px-3 tracking-[0.5px]" : "px-4 tracking-[2px]",
          )}
        >
          {entry.label}
        </div>
      );
    }

    const itemClass = cn(ITEM_CLASS, TONE_CLASS[entry.tone ?? "default"], isAdmin && ADMIN_ITEM_CLASS);

    if (selection) {
      return (
        <Menu.RadioItem key={entry.key} value={entry.key} disabled={entry.disabled} closeOnClick className={itemClass}>
          {renderItemContent(entry, true)}
        </Menu.RadioItem>
      );
    }
    if (entry.href) {
      return (
        <Menu.LinkItem
          key={entry.key}
          render={<Link href={entry.href} />}
          closeOnClick
          aria-current={entry.active ? "page" : undefined}
          className={itemClass}
        >
          {renderItemContent(entry, false)}
        </Menu.LinkItem>
      );
    }
    return (
      <Menu.Item key={entry.key} onClick={entry.onSelect} disabled={entry.disabled} className={itemClass}>
        {renderItemContent(entry, false)}
      </Menu.Item>
    );
  };

  const list = items.map(renderEntry);

  return (
    <Menu.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      <Menu.Trigger
        render={keepLinkSemantics(trigger)}
        nativeButton={nativeButton ?? isNativeButton(trigger)}
        openOnHover={openOnHover}
        delay={80}
        closeDelay={160}
      />
      <Menu.Portal>
        <Menu.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={FLOATING_COLLISION_PADDING} className="z-50 outline-none">
          <Menu.Popup
            style={widthStyle}
            className={cn(
              FLOATING_SURFACE_CLASS,
              "py-1.5",
              width === "auto" && "min-w-56",
              width === "trigger" && "min-w-[var(--anchor-width)]",
              isAdmin && ADMIN_SURFACE_CLASS,
              className,
            )}
          >
            {/* Vạch đỏ đô ở đỉnh + mũi tên thoi — khung chung floatingSurface (đồng bộ AppPopover / AppDialog) */}
            {isAdmin ? null : <span aria-hidden="true" className={FLOATING_TOP_BAR_CLASS} />}
            {showArrow && !isAdmin ? <Menu.Arrow className={FLOATING_ARROW_CLASS} /> : null}

            {header ? (
              <div className={cn("border-b border-[var(--border)]", isAdmin ? "-mx-1.5 mb-1.5 px-4 pb-3 pt-2" : "px-4 pb-3 pt-2.5")}>
                {header}
              </div>
            ) : null}

            {selection ? (
              <Menu.RadioGroup value={selection.value} onValueChange={(value) => selection.onValueChange(String(value))}>
                {list}
              </Menu.RadioGroup>
            ) : (
              <Fragment>{list}</Fragment>
            )}

            {footer ? <div className="mt-1.5 border-t border-[var(--border)] px-4 pb-1 pt-2.5">{footer}</div> : null}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
