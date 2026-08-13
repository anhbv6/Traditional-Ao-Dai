'use client';

import * as React from 'react';
import { Eye, EyeOff, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export interface FormInputProps extends Omit<React.ComponentProps<typeof Input>, 'label'> {
  /**
   * The text or node to display as the label above the input
   */
  label?: React.ReactNode;
  /**
   * Action button/node to display on the far right of the label (e.g. Switch Email/Phone button)
   */
  labelAction?: React.ReactNode;
  /**
   * Tooltip tip content. If provided, renders an Info icon next to the label.
   */
  tooltip?: React.ReactNode;
  /**
   * Error message. If present, styles the input with error borders.
   */
  error?: string;
  /**
   * Controls where the error message is displayed.
   * - 'bottom': Displays error text below the input.
   * - 'tooltip': Displays error text inside the tooltip next to the label.
   * - 'auto': Displays inside the tooltip if the tooltip prop is provided, otherwise at the bottom.
   */
  errorPlacement?: 'bottom' | 'tooltip' | 'auto';
  /**
   * Custom message to display below the input when validation succeeds.
   */
  successMessage?: React.ReactNode;
  /**
   * Styles the input with success borders.
   */
  isSuccess?: boolean;
  /**
   * Helper text or node to display below the input (if there's no error or success message)
   */
  helperText?: React.ReactNode;
  /**
   * If true, helper text remains visible even when the field has an error or success state.
   */
  alwaysShowHelperText?: boolean;
  /**
   * Icon or node to render inside the input at the start (left)
   */
  startIcon?: React.ReactNode;
  /**
   * Icon or node to render inside the input at the end (right, before password eye toggle)
   */
  endIcon?: React.ReactNode;
  /**
   * Custom node absolute-positioned on the right (e.g. checkmarks, spinners, verified badges)
   */
  rightElement?: React.ReactNode;
  /**
   * Class name for the outermost container
   */
  containerClassName?: string;
  /**
   * Class name for the label text
   */
  labelClassName?: string;
  /**
   * Class name for the input wrapper (holds input and absolute icons)
   */
  wrapperClassName?: string;
  /**
   * If true (default for type="password"), enables the password eye toggle internally.
   */
  passwordToggle?: boolean;
  /**
   * Accessibility labels for password toggle
   */
  passwordToggleLabels?: {
    show?: string;
    hide?: string;
  };
  /**
   * If true, styles the border and tooltip icon as error/invalid in real-time, but does not force the tooltip open.
   */
  isInvalid?: boolean;
  /**
   * Increment this value from a form submit failure to request opening the tooltip for invalid fields.
   */
  validationTooltipSignal?: number;
  /**
   * When set, only the input whose id matches this target can open from the validation signal.
   */
  validationTooltipTarget?: string;
  /**
   * Higher values render this input's tooltip above lower-priority inputs.
   */
  tooltipPriority?: number;
  /**
   * If true, restricts the input value to digits (0-9) only.
   */
  onlyDigits?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      type = 'text',
      label,
      labelAction,
      tooltip,
      error,
      errorPlacement = 'auto',
      successMessage,
      isSuccess,
      helperText,
      alwaysShowHelperText,
      startIcon,
      endIcon,
      rightElement,
      className,
      containerClassName,
      labelClassName,
      wrapperClassName,
      passwordToggle = true,
      passwordToggleLabels,
      isInvalid,
      validationTooltipSignal,
      validationTooltipTarget,
      tooltipPriority = 0,
      onlyDigits,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isSubmittedErrorOpen, setIsSubmittedErrorOpen] = React.useState(false);
    const [tooltipOpen, setTooltipOpen] = React.useState(false);
    const [mobileTooltipStyle, setMobileTooltipStyle] = React.useState<React.CSSProperties>();
    
    const containerRef = React.useRef<HTMLDivElement>(null);
    const tooltipTriggerRef = React.useRef<HTMLButtonElement>(null);
    const lastHandledValidationSignalRef = React.useRef<number | undefined>(validationTooltipSignal);
    const closeTooltip = React.useCallback(() => {
      setIsSubmittedErrorOpen(false);
      setIsHovered(false);
    }, []);

    const isPasswordField = type === 'password';
    const hasPasswordToggle = isPasswordField && passwordToggle;
    const currentType = isPasswordField && hasPasswordToggle && showPassword ? 'text' : type;

    const displayErrorAtBottom =
      error && (errorPlacement === 'bottom' || (errorPlacement === 'auto' && !tooltip));
    const displayErrorInTooltip =
      error && (errorPlacement === 'tooltip' || (errorPlacement === 'auto' && !!tooltip));

    // Submit failures are the only automatic open trigger. Field errors alone should
    // style the input, but should not pin a tooltip open.
    React.useEffect(() => {
      if (
        validationTooltipSignal === undefined ||
        validationTooltipSignal === lastHandledValidationSignalRef.current
      ) {
        return;
      }

      if (validationTooltipTarget && id !== validationTooltipTarget) {
        lastHandledValidationSignalRef.current = validationTooltipSignal;
        setIsSubmittedErrorOpen(false);
        return;
      }

      if (tooltipOpen) {
        lastHandledValidationSignalRef.current = validationTooltipSignal;
        return;
      }

      if ((error || isInvalid) && (tooltip || displayErrorInTooltip)) {
        lastHandledValidationSignalRef.current = validationTooltipSignal;
        setIsSubmittedErrorOpen(true);
      }
    }, [
      displayErrorInTooltip,
      error,
      id,
      isInvalid,
      tooltip,
      tooltipOpen,
      validationTooltipSignal,
      validationTooltipTarget,
    ]);

    // Compute whether the tooltip should be visible
    const isVisible = isSubmittedErrorOpen || isHovered;

    React.useEffect(() => {
      setTooltipOpen(isVisible);
    }, [isVisible]);

    React.useLayoutEffect(() => {
      if (!tooltipOpen || !tooltipTriggerRef.current) return;

      const updateMobileTooltipPosition = () => {
        const triggerRect = tooltipTriggerRef.current?.getBoundingClientRect();
        if (!triggerRect) return;

        const viewportPadding = 16;
        const tooltipWidth = window.innerWidth - viewportPadding * 2;
        const triggerCenter = triggerRect.left + triggerRect.width / 2;
        const arrowLeft = Math.min(
          Math.max(triggerCenter - viewportPadding, 12),
          tooltipWidth - 12
        );

        setMobileTooltipStyle({
          '--tooltip-mobile-top': `${triggerRect.bottom + 8}px`,
          '--tooltip-mobile-arrow-left': `${arrowLeft}px`,
        } as React.CSSProperties);
      };

      updateMobileTooltipPosition();
      window.addEventListener('resize', updateMobileTooltipPosition);
      window.addEventListener('orientationchange', updateMobileTooltipPosition);

      return () => {
        window.removeEventListener('resize', updateMobileTooltipPosition);
        window.removeEventListener('orientationchange', updateMobileTooltipPosition);
      };
    }, [tooltipOpen]);

    // Handle pointer interactions outside this specific FormInput to close its tooltip.
    // Pointer events cover mouse and touch, so mobile behaves the same as desktop.
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
      return () => {
        document.removeEventListener('pointerdown', handlePointerOutside);
      };
    }, [closeTooltip, tooltipOpen]);

    const handleIconClick = (e: React.MouseEvent | React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsSubmittedErrorOpen((prev) => !prev);
    };

    return (
      <div
        ref={containerRef}
        className={cn('relative space-y-2', containerClassName)}
        style={tooltipOpen ? { zIndex: tooltipPriority } : undefined}
      >
        {/* Label Header */}
        {(label || labelAction || tooltip) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {label && (
                <label
                  htmlFor={id}
                  className={cn(
                    'block font-[family-name:var(--font-lora)] text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]',
                    labelClassName
                  )}
                >
                  {label}
                </label>
              )}

              {/* Custom HTML/CSS Tooltip Integration (Supports concurrent open tooltips) */}
              {(tooltip || displayErrorInTooltip) && (
                <div className="relative inline-block leading-none">
                  <button
                    ref={tooltipTriggerRef}
                    type="button"
                    onClick={handleIconClick}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={cn(
                      'inline-flex items-center text-[var(--text-light)] hover:text-[#800020] transition-colors outline-none cursor-pointer mb-0.5',
                      (error || isInvalid) && 'text-rose-500 hover:text-rose-600'
                    )}
                    aria-label="Info"
                  >
                    <Info size={12} />
                  </button>
                  
                  {tooltipOpen && (
                    <div
                      style={mobileTooltipStyle}
                      className="fixed left-4 right-4 top-[var(--tooltip-mobile-top)] z-50 max-w-[calc(100vw-2rem)] p-3.5 bg-[#1a191b] text-white text-xs rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-zinc-800 sm:absolute sm:top-full sm:right-auto sm:left-1/2 sm:mt-2 sm:w-[min(78vw,320px)] sm:-translate-x-[16px]"
                    >
                      {/* Arrow */}
                      <div className="absolute bottom-full left-[var(--tooltip-mobile-arrow-left)] -translate-x-1/2 border-[6px] border-transparent border-b-[#1a191b] sm:left-4" />
                      {/* Content */}
                      {tooltip ? tooltip : (
                        <div className="font-semibold text-rose-400">{error}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Label Action (e.g. switch button) */}
            {labelAction && <div className="flex items-center">{labelAction}</div>}
          </div>
        )}

        {/* Input Wrapper */}
        <div className={cn('relative w-full', wrapperClassName)}>
          {/* Start Icon */}
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-[var(--text-light)]">
              {startIcon}
            </div>
          )}

          {/* Actual Input */}
          <Input
            id={id}
            type={currentType}
            ref={ref}
            onPointerDown={(e) => {
              closeTooltip();
              props.onPointerDown?.(e);
            }}
            onFocus={(e) => {
              closeTooltip();
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              if (onlyDigits) {
                e.target.value = e.target.value.replace(/\D/g, '');
              } else if (type === 'tel') {
                // Keep only digits and "+"
                e.target.value = e.target.value.replace(/[^\d+]/g, '');
              } else if (type === 'number') {
                e.target.value = e.target.value.replace(/\D/g, '');
              }
              onChange?.(e);
            }}
            className={cn(
              'w-full border-[var(--border)] focus:border-[var(--primary-color)]',
              startIcon ? 'pl-9' : '',
              (endIcon || hasPasswordToggle || rightElement) ? 'pr-9' : '',
              (error || isInvalid) ? 'border-rose-400 focus:border-rose-400' : '',
              isSuccess ? 'border-green-500 focus:border-green-500' : '',
              className
            )}
            {...props}
          />

          {/* Right Side Elements */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {/* Custom Right Element (like loading spinners, checkmarks) */}
            {rightElement}

            {/* End Icon (if not password toggle) */}
            {endIcon && !hasPasswordToggle && (
              <div className="flex items-center text-[var(--text-light)]">{endIcon}</div>
            )}

            {/* Password Toggle Button */}
            {hasPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="cursor-pointer text-[var(--text-light)] hover:text-[var(--text-main)] transition-colors focus:outline-none flex items-center"
                aria-label={
                  showPassword
                    ? passwordToggleLabels?.hide || 'Hide password'
                    : passwordToggleLabels?.show || 'Show password'
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Footer Messages / Helpers */}
        {displayErrorAtBottom && (
          <p className={cn(
            "text-[10px] font-bold text-rose-500 flex items-center gap-1 uppercase tracking-wider",
            containerClassName?.includes("text-center") && "justify-center"
          )}>
            <AlertCircle size={12} className="shrink-0" />
            {error}
          </p>
        )}

        {isSuccess && successMessage && (
          <div className={cn(
            "text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase tracking-wider",
            containerClassName?.includes("text-center") && "justify-center"
          )}>
            {successMessage}
          </div>
        )}

        {helperText && (alwaysShowHelperText || (!error && !isSuccess)) && (
          <div className={cn(
            "text-[10px] text-[var(--text-light)]",
            containerClassName?.includes("text-center") && "text-center"
          )}>{helperText}</div>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
