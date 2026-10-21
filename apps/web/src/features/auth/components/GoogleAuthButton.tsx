"use client";

import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { ActionButton } from "@/components/shared/ActionButton";
import { cn } from "@/lib/utils";
import { patchGsiInitialize } from "../utils/googleIdentity";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "placeholder-id";

interface GoogleAuthButtonProps {
  label: string;
  onCredential: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
  /** Đang xử lý đăng nhập Google: hiện spinner, khóa nút */
  loading?: boolean;
  className?: string;
}

/**
 * Nút "Tiếp tục với Google": giao diện là ActionButton `dialog` (đồng bộ storefront),
 * nút thật của Google Identity Services phủ trong suốt lên trên để nhận click.
 * Provider (nạp script accounts.google.com/gsi/client) đặt ngay tại nút — chỉ trang có nút Google mới tải script,
 * không bọc toàn ứng dụng ở AppProviders.
 */
export function GoogleAuthButton({
  label,
  onCredential,
  onError,
  disabled = false,
  loading = false,
  className,
}: GoogleAuthButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = React.useState("400");
  const isLocked = disabled || loading;

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const currentWidth = container.getBoundingClientRect().width;
      if (!currentWidth) return;
      // Google Identity Services giới hạn width trong khoảng 200px - 400px
      const clampedWidth = String(Math.min(400, Math.max(200, Math.round(currentWidth))));
      setButtonWidth((prev) => (prev !== clampedWidth ? clampedWidth : prev));
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} onScriptLoadSuccess={patchGsiInitialize}>
      {/* `group/action` ở khung ngoài: lớp phủ Google nhận hover thay nút, vẫn kích hoạt hiệu ứng quét của ActionButton */}
      <div ref={containerRef} className={cn("relative w-full", !isLocked && "group/action", className)}>
        <ActionButton
          variant="dialog"
          size="md"
          fullWidth
          disabled={disabled}
          loading={loading}
          icon={<FcGoogle aria-hidden="true" />}
          tabIndex={-1}
        >
          {label}
        </ActionButton>

        {!isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-0">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  onCredential(credentialResponse.credential);
                } else {
                  onError();
                }
              }}
              onError={onError}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              logo_alignment="left"
              width={buttonWidth}
            />
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
