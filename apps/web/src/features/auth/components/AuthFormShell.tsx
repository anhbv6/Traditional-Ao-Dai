'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import { AppLoading } from '@/components/shared/AppLoading';
import { Logo } from '@/components/layout/header/Logo';
import { cn } from '@/lib/utils';

/** Hiệu ứng xuất hiện lần lượt cho từng khối trong form auth */
export const authContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

export const authItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
};

interface AuthFormShellProps {
  children: React.ReactNode;
  /** Hiện lớp phủ loading toàn màn hình (khóa thao tác khi đang gửi yêu cầu chính) */
  loading?: boolean;
  className?: string;
}

/**
 * Khung cột phải của các màn đăng nhập / đăng ký / quên mật khẩu:
 * căn giữa nội dung, giới hạn bề rộng và chạy hiệu ứng xuất hiện cho các khối con.
 */
export function AuthFormShell({ children, loading = false, className }: AuthFormShellProps) {
  return (
    /* Khoảng cách dọc được giữ gọn để cả form (kể cả khi hiện lỗi) vừa một màn hình laptop, không phải cuộn */
    <div className="relative flex min-h-dvh w-full flex-col items-center bg-[var(--bg-main)] px-4 py-6 sm:px-8 lg:px-16">
      <AppLoading visible={loading} />
      {/* Logo + tên trang ở góc trên cột form (desktop); mobile đã có AuthMobileLogo trong AuthHeader.
          Nằm trong luồng (không absolute) để form dài / màn thấp không bị logo đè lên tiêu đề */}
      <div className="hidden self-stretch pb-6 lg:block">
        <Logo textLogo />
      </div>
      <motion.div
        variants={authContainerVariants}
        initial="hidden"
        animate="visible"
        className={cn('my-auto w-full max-w-[520px] space-y-5 sm:space-y-6', className)}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default AuthFormShell;
