'use client';

import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F5] px-4 text-center">
      <div className="flex flex-col items-center max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#800020]/10">
        <div className="grid size-16 place-items-center rounded-full bg-rose-50 text-rose-600 mb-6 shadow-inner">
          <ShieldAlert size={36} />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020] mb-2">
          Truy Cập Bị Giới Hạn (403)
        </h1>
        <p className="text-xs sm:text-sm text-[#706565] mb-8 leading-relaxed">
          Tài khoản hiện tại của bạn là <strong>Khách hàng</strong> và không có quyền truy cập vào bảng điều khiển Quản trị/Nhân viên.
        </p>

        <div className="w-full flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-50 cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Quay lại mua sắm</span>
          </Link>
          <Link
            href="/admin/login"
            className="w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#800020] px-4 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-95 cursor-pointer shadow-sm"
          >
            <LogIn size={14} />
            <span>Đăng nhập Admin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
