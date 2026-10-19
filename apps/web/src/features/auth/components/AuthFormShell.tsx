'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import { AppLoading } from '@/components/shared/AppLoading';
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
    <div className="relative flex min-h-dvh w-full items-center justify-center bg-[var(--bg-main)] px-4 py-6 sm:px-8 lg:px-16">
      <AppLoading visible={loading} />
      <motion.div
        variants={authContainerVariants}
        initial="hidden"
        animate="visible"
        className={cn('w-full max-w-[520px] space-y-5 sm:space-y-6', className)}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default AuthFormShell;
