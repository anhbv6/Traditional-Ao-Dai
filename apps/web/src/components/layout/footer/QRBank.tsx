'use client';

import { useState } from 'react';
import { Check, Copy, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppDialog } from '@/components/shared/AppDialog';
import { useNotify } from '@/hooks/useNotify';
import { cn } from '@/lib/utils';

type QRBankProps = {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  /** Ảnh QR (api.qrserver.com) — tham số `size` được đổi tự động để lấy bản nét cho hộp thoại phóng to */
  qrUrl?: string;
};

/** Lấy ảnh QR kích thước lớn từ cùng nguồn (đổi tham số size=WxH) để phóng to không bị vỡ */
const toLargeQr = (url: string, size = 480) => url.replace(/size=\d+x\d+/, `size=${size}x${size}`);

/**
 * Khối QR chuyển khoản ở footer. Bấm vào → mở AppDialog: mã QR cỡ lớn (khung quét có 4 góc định vị)
 * + thông tin tài khoản + nút sao chép số tài khoản.
 */
export function QRBank({
  bankName = 'MB BANK',
  accountNumber = '123456789999',
  accountHolder = 'NGUYEN VAN A',
  qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://qr.sepay.vn/img/qr.png',
}: QRBankProps) {
  const t = useTranslations('Footer.qr');
  const notify = useNotify();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      notify.success(t('copied'));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error('DEFAULT_ERROR');
    }
  };

  return (
    <AppDialog
      trigger={
        <button
          type="button"
          aria-label={t('open')}
          className="group flex w-full max-w-[180px] cursor-zoom-in flex-col items-center rounded-xl transition-transform duration-300 hover:scale-[1.02]"
        >
          {/* Thẻ QR nhỏ ở footer — gợi ý "phóng to" khi rê chuột */}
          <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt=""
              width={150}
              height={150}
              className="h-full w-full object-contain mix-blend-multiply"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-2 right-2 grid size-7 place-items-center bg-[var(--bg-card)]/90 text-[var(--primary-ink)] opacity-0 shadow-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <Maximize2 size={13} strokeWidth={1.8} />
            </span>
          </span>
          <span className="w-full text-center text-[10px] leading-relaxed text-muted-foreground">
            <span className="block font-bold tracking-wide text-primary-ink">{bankName}</span>
            <span className="mt-0.5 block font-mono font-semibold tracking-wider text-foreground">{accountNumber}</span>
            <span className="mt-0.5 block font-[family-name:var(--font-lora)] text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {accountHolder}
            </span>
          </span>
        </button>
      }
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      size="sm"
      icon={null}
      cancel={{ label: t('close') }}
      bodyClassName="pb-6"
    >
      <div className="flex flex-col items-center">
        {/* Khung quét: viền mảnh + 4 góc định vị đỏ đô */}
        <div className="relative w-full max-w-[240px] p-3">
          {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map(
            (corner) => (
              <span key={corner} aria-hidden="true" className={cn('absolute size-6 border-[var(--primary-color)]', corner)} />
            ),
          )}
          <div className="border border-[var(--border)] bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toLargeQr(qrUrl)}
              alt={`${bankName} QR`}
              width={480}
              height={480}
              className="aspect-square h-auto w-full object-contain"
            />
          </div>
        </div>

        {/* Thông tin tài khoản */}
        <dl className="mt-5 w-full divide-y divide-[var(--border)] border-y border-[var(--border)] text-sm">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[var(--text-light)]">{t('bank')}</dt>
            <dd className="font-semibold text-[var(--primary-ink)]">{bankName}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[var(--text-light)]">{t('account')}</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono font-semibold tracking-wider text-[var(--text-main)]">{accountNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={t('copy')}
                title={t('copy')}
                className="grid size-8 cursor-pointer place-items-center text-[var(--text-light)] transition-colors duration-300 hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-ink)]"
              >
                {copied ? <Check size={15} className="text-(--success)" /> : <Copy size={15} />}
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-[var(--text-light)]">{t('holder')}</dt>
            <dd className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">{accountHolder}</dd>
          </div>
        </dl>
      </div>
    </AppDialog>
  );
}
