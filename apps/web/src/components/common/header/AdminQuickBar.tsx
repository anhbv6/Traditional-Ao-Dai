'use client';

import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useAuthStore } from '@/features/auth/store/authStore';

export function AdminQuickBar() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return null;
  }

  const isSuperAdmin = user.role === 'ADMIN';

  return (
    <div className="w-full bg-[#18181B] text-white py-1.5 px-4 sm:px-8 flex items-center justify-between text-[11px] sm:text-xs z-50 border-b border-zinc-800 select-none">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center size-5 rounded bg-white/10 text-emerald-400">
          <Shield size={12} />
        </span>
        <span className="text-zinc-300">
          Đang duyệt với tư cách{' '}
          <strong className="text-white font-semibold">
            {isSuperAdmin ? 'Quản trị viên' : 'Nhân viên (Staff)'}
          </strong>{' '}
          ({user.name || user.email})
        </span>
      </div>

      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
      >
        <span>Vào Bảng Quản Trị</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
