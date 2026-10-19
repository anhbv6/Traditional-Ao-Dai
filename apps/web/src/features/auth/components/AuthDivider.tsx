import React from 'react';

/** Đường kẻ ngăn cách có chữ ở giữa (vd. "Hoặc tiếp tục bằng") */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-1" role="separator">
      <span className="h-px flex-1 bg-[var(--border)]" />
      <span className="font-[family-name:var(--font-lora)] text-[10px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]">
        {label}
      </span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

export default AuthDivider;
