import { ArrowUpRight } from 'lucide-react';

interface ContactInfoItemProps {
  label: string;
  value: string;
  note?: string;
  href?: string;
  /** Liên kết ra ngoài (Zalo, bản đồ) mở tab mới */
  external?: boolean;
}

/**
 * Một kênh liên hệ trong dải thông tin đầu trang: nhãn nhỏ — giá trị chữ lớn — ghi chú.
 * Không dùng ô icon: giá trị là thứ khách cần đọc nên được làm nổi bật bằng chữ.
 */
export function ContactInfoItem({ label, value, note, href, external }: ContactInfoItemProps) {
  const valueClass =
    'mt-3 block font-[family-name:var(--font-playfair)] text-[22px] font-semibold leading-snug text-[var(--text-main)] sm:text-[26px]';

  return (
    <div className="py-6 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--text-light)]">{label}</dt>
      <dd>
        {href ? (
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={`group inline-flex items-center gap-2 transition-colors hover:text-[var(--primary-color)] ${valueClass}`}
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
  );
}
