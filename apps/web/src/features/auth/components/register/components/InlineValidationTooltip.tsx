import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineValidationTooltipProps {
  id: string;
  content: React.ReactNode;
  isInvalid?: boolean;
  validationTooltipSignal: number;
  validationTooltipTarget?: string;
}

export function InlineValidationTooltip({
  id,
  content,
  isInvalid,
  validationTooltipSignal,
  validationTooltipTarget,
}: InlineValidationTooltipProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isManuallyOpen, setIsManuallyOpen] = React.useState(false);
  const [dismissedValidationSignal, setDismissedValidationSignal] = React.useState<number>();
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>();

  const containerRef = React.useRef<HTMLSpanElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isSubmittedErrorOpen =
    validationTooltipTarget === id &&
    !!isInvalid &&
    validationTooltipSignal > 0 &&
    dismissedValidationSignal !== validationTooltipSignal;

  const tooltipOpen = isSubmittedErrorOpen || isHovered || isManuallyOpen;

  const closeTooltip = React.useCallback(() => {
    setDismissedValidationSignal(validationTooltipSignal);
    setIsManuallyOpen(false);
    setIsHovered(false);
  }, [validationTooltipSignal]);

  React.useLayoutEffect(() => {
    if (!tooltipOpen || !triggerRef.current) return;

    const updateTooltipPosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportPadding = 16;
      const tooltipWidth =
        window.innerWidth < 640
          ? window.innerWidth - viewportPadding * 2
          : Math.min(320, window.innerWidth - viewportPadding * 2);
      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const tooltipLeft = Math.min(
        Math.max(triggerCenter - 24, viewportPadding),
        window.innerWidth - viewportPadding - tooltipWidth
      );
      const arrowLeft = Math.min(
        Math.max(triggerCenter - tooltipLeft, 12),
        tooltipWidth - 12
      );

      setTooltipStyle({
        '--tooltip-left': `${tooltipLeft}px`,
        '--tooltip-mobile-top': `${triggerRect.bottom + 8}px`,
        '--tooltip-mobile-arrow-left': `${arrowLeft}px`,
        '--tooltip-width': `${tooltipWidth}px`,
      } as React.CSSProperties);
    };

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('orientationchange', updateTooltipPosition);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('orientationchange', updateTooltipPosition);
    };
  }, [tooltipOpen]);

  React.useEffect(() => {
    if (!tooltipOpen) return;

    const handlePointerOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-tooltip-submit="true"]')) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeTooltip();
      }
    };

    document.addEventListener('pointerdown', handlePointerOutside);
    return () => document.removeEventListener('pointerdown', handlePointerOutside);
  }, [closeTooltip, tooltipOpen]);

  const handleIconClick = (event: React.MouseEvent | React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (tooltipOpen) {
      closeTooltip();
      return;
    }

    setIsManuallyOpen(true);
  };

  return (
    <span ref={containerRef} className="relative inline-block leading-none">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleIconClick}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "inline-flex items-center text-[var(--text-light)] hover:text-[#800020] transition-colors outline-none cursor-pointer mb-0.5 shrink-0",
          isInvalid && "text-rose-500 hover:text-rose-600"
        )}
        aria-label="Info"
      >
        <Info size={12} />
      </button>

      {tooltipOpen && (
        <div
          style={tooltipStyle}
          className="fixed left-[var(--tooltip-left)] top-[var(--tooltip-mobile-top)] z-50 w-[var(--tooltip-width)] max-w-[calc(100vw-2rem)] break-words p-3.5 bg-[#1a191b] text-white text-xs rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-zinc-800"
        >
          <div className="absolute bottom-full left-[var(--tooltip-mobile-arrow-left)] -translate-x-1/2 border-[6px] border-transparent border-b-[#1a191b]" />
          {content}
        </div>
      )}
    </span>
  );
}
