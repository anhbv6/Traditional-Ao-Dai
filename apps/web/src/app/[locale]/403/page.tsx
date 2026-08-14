'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF7F5] px-4 text-center">
      <div className="flex flex-col items-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#800020]/10">
        <div className="grid size-16 place-items-center rounded-full bg-rose-50 text-rose-600 mb-6">
          <ShieldAlert size={36} />
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020] mb-3">
          Truy Cập Bị Từ Chối (403)
        </h1>
        <p className="text-sm text-[#706565] mb-8 leading-relaxed">
          Bạn không có quyền truy cập vào trang này. Vui lòng quay lại trang chủ hoặc đăng nhập bằng tài khoản có quyền quản trị.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[#800020] px-6 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-95 cursor-pointer shadow-sm hover:shadow-md"
        >
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
