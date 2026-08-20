"use client";

import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoogleAuthButtonProps {
  label: string;
  onCredential: (credential: string) => void;
  onError: () => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleAuthButton({
  label,
  onCredential,
  onError,
  disabled = false,
  className,
}: GoogleAuthButtonProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = React.useState("380");

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      setButtonWidth(String(Math.max(200, Math.round(container.getBoundingClientRect().width))));
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("group/google relative w-full", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-[var(--primary-color)]/25 bg-white px-4 font-[family-name:var(--font-lora)] text-[11px] font-bold uppercase tracking-wider text-[var(--primary-color)] shadow-[0_10px_26px_rgba(128,0,32,0.10)] transition-all group-hover/google:border-[var(--primary-color)]/55 group-hover/google:bg-white group-hover/google:shadow-[0_14px_30px_rgba(128,0,32,0.16)] sm:h-11 sm:text-xs"
      >
        <FcGoogle className="size-5" aria-hidden="true" />
        <span>{label}</span>
      </Button>

      {!disabled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0">
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
  );
}
