import type { ComponentType } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactInfoItemProps {
  label: string;
  value: string;
  note?: string;
  href?: string;
  /** Liên kết ra ngoài (Zalo, bản đồ) mở tab mới */
  external?: boolean;
  /** Icon nhận diện kênh — icon lucide hoặc logo thương hiệu (ZaloIcon ở footer) cùng nhận `size` / `className` */
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  /** Cỡ icon (px) — logo chữ như Zalo cần to hơn icon nét */
  iconSize?: number;
  /** Lệch nhịp vòng sóng giữa các kênh (giây) để 3 icon không "thở" cùng lúc */
  pulseDelay?: number;
}

/**
 * Một kênh liên hệ trong dải thông tin đầu trang: icon tròn có vòng sóng lan ra (lắc nhẹ khi rê chuột)
 * — nhãn nhỏ — giá trị chữ lớn — ghi chú. Giá trị vẫn là thứ khách cần đọc nên giữ chữ lớn.
 */
export function ContactInfoItem({ label, value, note, href, external, icon: Icon, iconSize = 20, pulseDelay = 0 }: ContactInfoItemProps) {
  const valueClass =
    'mt-2 block font-[family-name:var(--font-playfair)] text-[1.25rem] font-semibold leading-snug text-[var(--text-main)] md:text-[1.375rem] xl:text-[1.5rem] 2xl:text-[1.625rem]';

  return (
    /* Icon canh giữa theo chiều dọc cả khối chữ (nhãn — giá trị — ghi chú) cho cân, không treo lệch ở góc trên */
    <div className="group flex items-center gap-4 py-5 sm:px-5 sm:py-6 sm:first:pl-0 sm:last:pr-0 lg:gap-5 lg:px-8">
      <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center">
        <span
          className="absolute inset-0 rounded-full border border-[var(--primary-color)]/50 motion-safe:animate-ring-pulse"
          style={{ animationDelay: `${pulseDelay}s` }}
        />
        <span
          className={cn(
            'relative grid size-12 place-items-center rounded-full border border-[var(--primary-color)]/30 bg-[var(--bg-card)] text-[var(--primary-ink)]',
            'transition-colors duration-300 group-hover:border-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-white',
          )}
        >
          <Icon size={iconSize} strokeWidth={1.6} className="motion-safe:group-hover:animate-wiggle" />
        </span>
      </span>

      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-light)]">{label}</dt>
        <dd>
          {href ? (
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`inline-flex items-center gap-2 transition-colors hover:text-[var(--primary-ink)] ${valueClass}`}
            >
              {value}
              <ArrowUpRight
                size={18}
                strokeWidth={1.4}
                className="text-[var(--accent-color)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          ) : (
            <span className={valueClass}>{value}</span>
          )}
          {note ? <span className="mt-2 block text-sm leading-6 text-[var(--text-light)]">{note}</span> : null}
        </dd>
      </div>
    </div>
  );
}
