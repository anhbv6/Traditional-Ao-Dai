import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type AppLoadingVariant = 'ring' | 'dots' | 'bars';

const STEPS = Array.from({ length: 8 }, (_, index) => index);

/** Xoay theo 8 nấc (nhảy từng vị trí như spinner hệ thống) — dùng keyframe `spin` có sẵn của Tailwind */
const STEP_SPIN_CLASS = 'animate-[spin_0.9s_steps(8)_infinite] motion-reduce:animate-[spin_2s_steps(8)_infinite]';

/**
 * Vòng xoay không chữ, 3 kiểu:
 * - `ring`: vòng xám + cung 3/4 màu thương hiệu xoay mượt.
 * - `dots`: 8 chấm xám xếp vòng, 1 chấm màu thương hiệu nhảy vòng quanh.
 * - `bars`: 8 vạch tia đậm nhạt dần, xoay từng nấc (kiểu iOS).
 * Chỉ dùng token màu → dark mode tự đổi. Dùng riêng được khi cần loading cục bộ (trong khối, trong nút…).
 */
export function AppLoadingSpinner({
  variant = 'ring',
  size = 44,
  className,
}: {
  variant?: AppLoadingVariant;
  /** Kích thước px */
  size?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cn('relative inline-block shrink-0', className)} style={{ width: size, height: size }}>
      {variant === 'ring' ? (
        <>
          <span className="absolute inset-0 rounded-full border-[3px] border-[var(--border)]" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-r-[var(--primary-color)] border-t-[var(--primary-color)] border-b-[var(--primary-color)] [animation-duration:900ms] motion-reduce:[animation-duration:2s]" />
        </>
      ) : null}

      {variant === 'dots' ? (
        <>
          {STEPS.map((step) => (
            <span key={step} className="absolute inset-0" style={{ rotate: `${step * 45}deg` }}>
              <span className="absolute left-1/2 top-0 size-[22%] -translate-x-1/2 rounded-full bg-[var(--border)]" />
            </span>
          ))}
          <span className={cn('absolute inset-0', STEP_SPIN_CLASS)}>
            <span className="absolute left-1/2 top-0 size-[22%] -translate-x-1/2 rounded-full bg-[var(--primary-color)]" />
          </span>
        </>
      ) : null}

      {variant === 'bars' ? (
        <span className={cn('absolute inset-0', STEP_SPIN_CLASS)}>
          {STEPS.map((step) => (
            <span key={step} className="absolute inset-0" style={{ rotate: `${step * 45}deg` }}>
              {/* Vạch cuối (đậm nhất) dẫn đầu chiều xoay, các vạch trước nhạt dần thành vệt đuôi */}
              <span
                className="absolute left-1/2 top-0 h-[30%] w-[11%] -translate-x-1/2 rounded-full bg-[var(--primary-color)]"
                style={{ opacity: (step + 1) / STEPS.length }}
              />
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

export interface AppLoadingProps {
  visible: boolean;
  variant?: AppLoadingVariant;
  /** Kích thước vòng xoay (px) */
  size?: number;
  /**
   * `blur`: phủ mờ lên trang hiện tại (đang gửi form, đăng xuất…) — mặc định.
   * `solid`: nền kín màu trang (chuyển trang / khởi tạo, không cần thấy nội dung phía sau).
   */
  backdrop?: 'blur' | 'solid';
  className?: string;
}

/**
 * Loading toàn màn hình, không chữ — chỉ vòng xoay ở giữa.
 * Trình đọc màn hình vẫn đọc nhãn "Đang tải" (sr-only). Dùng được cả ở Server Component (`loading.tsx`) lẫn Client Component.
 *
 * @example <AppLoading visible={isLoading} />
 * @example <AppLoading visible variant="dots" backdrop="solid" />
 */
export function AppLoading({ visible, variant = 'ring', size, backdrop = 'blur', className }: AppLoadingProps) {
  const t = useTranslations('Common');

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'fixed inset-0 z-[100] grid place-items-center select-none',
        backdrop === 'solid' ? 'bg-[var(--bg-main)]' : 'bg-[var(--bg-main)]/60 backdrop-blur-[2px]',
        className,
      )}
    >
      <AppLoadingSpinner variant={variant} size={size} />
      <span className="sr-only">{t('loading')}</span>
    </div>
  );
}
