"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminDialogFooter,
} from "./AdminDialog";

export interface AdminUnsavedChangesDialogProps {
  /** Cờ cho biết form đang có dữ liệu chỉnh sửa chưa lưu */
  isDirty: boolean;
  /** Ép mở dialog từ bên ngoài (VD khi bấm nút đóng/hủy của modal) */
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Tiêu đề dialog — mặc định lấy từ translation */
  title?: string;
  /** Mô tả cảnh báo — mặc định lấy từ translation */
  description?: string;
  /** Nhãn nút hủy/ở lại */
  stayLabel?: string;
  /** Nhãn nút đồng ý rời đi */
  leaveLabel?: string;
  /** Callback tùy biến khi xác nhận rời đi (VD đóng dialog tạo mới) */
  onConfirm?: () => void;
}

/**
 * Hộp thoại cảnh báo thay đổi chưa lưu dùng chung cho các màn soạn thảo trong admin.
 * Tự động chặn:
 * 1. F5 / reload / đóng tab trình duyệt (sự kiện `beforeunload`)
 * 2. Click các liên kết nội bộ <a> trên trang (sidebar menu, breadcrumbs, nút back, link chi tiết...)
 * 3. Nút Back / Forward trên trình duyệt (`popstate`)
 */
export function AdminUnsavedChangesDialog({
  isDirty,
  forceOpen,
  onOpenChange,
  title,
  description,
  stayLabel,
  leaveLabel,
  onConfirm,
}: AdminUnsavedChangesDialogProps) {
  const t = useTranslations("AdminPage.unsavedChanges");
  const [isOpen, setIsOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingBack, setPendingBack] = useState(false);
  const bypassRef = useRef(false);

  const activeOpen = forceOpen !== undefined ? forceOpen : isOpen;

  // 1. Chặn F5, reload, đóng tab
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 2. Chặn các liên kết thẻ <a> trên trang trong capture phase
  useEffect(() => {
    if (!isDirty) return;

    const handleAnchorClick = (e: MouseEvent) => {
      if (bypassRef.current) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      // Cho phép mở tab mới (Ctrl/Cmd/Shift click hoặc target="_blank")
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }

      try {
        const dest = new URL(anchor.href, window.location.href);
        const curr = new URL(window.location.href);
        if (dest.pathname === curr.pathname && dest.search === curr.search) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        setPendingHref(anchor.href);
        setPendingBack(false);
        setIsOpen(true);
      } catch {
        // Bỏ qua nếu URL không phân tích được
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => document.removeEventListener("click", handleAnchorClick, { capture: true });
  }, [isDirty]);

  // 3. Chặn nút Back / Forward trên trình duyệt
  useEffect(() => {
    if (!isDirty) return;

    const originalUrl = window.location.href;
    window.history.pushState({ __unsaved_guard__: true }, "", originalUrl);

    const handlePopState = () => {
      if (bypassRef.current) return;

      // Giữ người dùng ở lại trang hiện tại bằng cách push lại state
      window.history.pushState({ __unsaved_guard__: true }, "", originalUrl);

      setPendingBack(true);
      setPendingHref(null);
      setIsOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  const handleConfirmLeave = () => {
    bypassRef.current = true;
    setIsOpen(false);
    onOpenChange?.(false);

    if (onConfirm) {
      onConfirm();
      return;
    }

    if (pendingHref) {
      window.location.assign(pendingHref);
    } else if (pendingBack) {
      window.history.back();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    onOpenChange?.(false);
    setPendingHref(null);
    setPendingBack(false);
  };

  return (
    <AdminDialog
      open={activeOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      icon={AlertTriangle}
      tone="danger"
      title={title ?? t("title")}
      description={description ?? t("description")}
      size="sm"
      bare
    >
      <AdminDialogFooter>
        <button type="button" onClick={handleCancel} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
          {stayLabel ?? t("stay")}
        </button>
        <button type="button" onClick={handleConfirmLeave} className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}>
          {leaveLabel ?? t("leave")}
        </button>
      </AdminDialogFooter>
    </AdminDialog>
  );
}
