"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { AlertCircle, Check, CheckCircle2, Copy, Eye, EyeOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";
import {
  mapCaretPosition,
  resolveMask,
  type CurrencyMaskOptions,
  type InputMaskFn,
  type InputMaskPreset,
} from "@/lib/input-mask";
import { cn } from "@/lib/utils";

/* ============================================================================
 * KIỂU DỮ LIỆU
 * ========================================================================== */

export type TextFieldType = "text" | "password" | "email" | "number" | "tel" | "url" | "search";

export interface TextFieldProps
  extends Omit<ComponentProps<"input">, "type" | "size" | "prefix" | "value" | "defaultValue"> {
  /* ---------- Nhãn & bố cục ---------- */
  /** Nhãn — không truyền thì không hiển thị (khi đó nên truyền `aria-label`) */
  label?: ReactNode;
  /** `vertical` (mặc định): nhãn nằm trên. `horizontal`: nhãn bên trái (từ sm trở lên, mobile vẫn xếp dọc) */
  layout?: "vertical" | "horizontal";
  /** Độ rộng cột nhãn khi `horizontal` — mặc định "10rem" */
  labelWidth?: string;
  /** `underline` (mặc định, giống màn Liên hệ): chỉ gạch chân. `outline`: viền hộp */
  appearance?: "underline" | "outline";
  /** true (mặc định): giãn 100% khung chứa. false: co giãn theo độ dài nội dung */
  fullWidth?: boolean;
  /** Tông màu theo nền đặt ô: `default` (nền kem/trắng) | `onPrimary` (khối nền đỏ đô như Newsletter) */
  tone?: TextFieldTone;

  /* ---------- Slot đầu / cuối ---------- */
  /** Slot đầu: icon tĩnh, chữ (VD "+84"), hoặc dropdown tương tác */
  prefix?: ReactNode;
  /** Kẻ vạch ngăn giữa slot đầu và ô nhập (hợp với chữ / dropdown) */
  prefixDivider?: boolean;
  /** Slot cuối tự do: đơn vị / chữ (VD "kg", "VND") */
  suffix?: ReactNode;
  /** Hiện nút xóa nhanh khi có giá trị */
  clearable?: boolean;
  /** Hiện nút ẩn/hiện mật khẩu (chỉ với type="password") */
  passwordToggle?: boolean;
  /** Hiện nút sao chép giá trị */
  copyable?: boolean;
  /** Đang xử lý: hiện spinner ở slot cuối + aria-busy */
  loading?: boolean;

  /* ---------- Vùng dưới ---------- */
  /** Chữ gợi ý dưới ô */
  helperText?: ReactNode;
  /** Lỗi xác thực: chuỗi/node = hiện thông báo; `true` = chỉ tô viền lỗi */
  error?: ReactNode | boolean;
  /** Thông báo hợp lệ (hiện khi không có lỗi) */
  success?: ReactNode;
  /** Hiện bộ đếm ký tự (kết hợp `maxLength` sẽ hiện dạng 12/50) */
  showCount?: boolean;
  /** Rung nhẹ thông báo lỗi mỗi khi lỗi xuất hiện / đổi nội dung — mặc định true. Tôn trọng prefers-reduced-motion */
  shakeOnError?: boolean;
  /**
   * Đổi giá trị này để rung lại dù nội dung lỗi không đổi (VD bấm "Gửi" lần nữa vẫn sai).
   * Với React Hook Form: truyền `formState.submitCount`.
   */
  shakeKey?: string | number;

  /* ---------- Dữ liệu ---------- */
  type?: TextFieldType;
  /** Controlled: giá trị HIỂN THỊ (đã định dạng nếu có mask) */
  value?: string;
  /** Uncontrolled: giá trị ban đầu */
  defaultValue?: string;
  /** Gọi mỗi lần đổi: `value` = chuỗi hiển thị, `raw` = giá trị sạch (bỏ dấu ngăn cách của mask) */
  onValueChange?: (value: string, raw: string) => void;
  /** Định dạng tự động: "currency" | "phone" | "card" | "date" hoặc hàm tự viết */
  mask?: InputMaskPreset | InputMaskFn;
  /** Tùy chọn cho mask "currency" */
  currencyOptions?: CurrencyMaskOptions;
  /** Độ trễ (ms) cho `onDebouncedChange` — mặc định tắt (0) */
  debounceMs?: number;
  /** Gọi sau khi ngừng gõ `debounceMs` ms (VD gọi API tìm kiếm). Không đặt debounceMs thì gọi ngay */
  onDebouncedChange?: (value: string, raw: string) => void;

  /* ---------- Tùy biến class ---------- */
  /** Class cho khung ngoài cùng */
  className?: string;
  /** Class cho vùng ô nhập (khung có viền) */
  fieldClassName?: string;
  /** Class cho thẻ <input> */
  inputClassName?: string;
  /** Class cho nhãn */
  labelClassName?: string;
}

/* ============================================================================
 * CẤU HÌNH GIAO DIỆN
 * ========================================================================== */

/* ----------------------------------------------------------------------------
 * BẢNG MÀU THEO TONE — sửa màu ô nhập toàn storefront tại đây.
 * Mọi class bên dưới chỉ đọc biến --tf-*, nên thêm tone mới chỉ cần thêm một bộ màu.
 * -------------------------------------------------------------------------- */

export type TextFieldTone = "default" | "onPrimary";

type ToneColors = Record<
  | "label" | "labelFocus" | "text" | "placeholder" | "muted"
  | "border" | "borderHover" | "borderFocus" | "fieldBg" | "ring"
  | "invalid" | "autofillText",
  string
>;

const TONE_COLORS: Record<TextFieldTone, ToneColors> = {
  /* Nền kem / trắng của storefront — giống màn Liên hệ */
  default: {
    label: "var(--text-light)",
    labelFocus: "var(--primary-ink)",
    text: "var(--text-main)",
    placeholder: "color-mix(in oklab, var(--text-light) 55%, transparent)",
    muted: "var(--text-light)",
    border: "var(--border)",
    borderHover: "color-mix(in oklab, var(--text-light) 60%, transparent)",
    borderFocus: "var(--primary-color)",
    fieldBg: "var(--bg-card)",
    ring: "color-mix(in oklab, var(--ring) 25%, transparent)",
    invalid: "var(--destructive)",
    autofillText: "var(--text-main)",
  },
  /* Khối nền đỏ đô (Newsletter / VIP Club...) — chữ trắng, viền trắng mờ, lỗi dùng hồng phấn cho đọc được */
  onPrimary: {
    label: "rgb(255 255 255 / 0.7)",
    labelFocus: "#FFFFFF",
    text: "#FFFFFF",
    placeholder: "rgb(255 255 255 / 0.6)",
    muted: "rgb(255 255 255 / 0.7)",
    border: "rgb(255 255 255 / 0.4)",
    borderHover: "rgb(255 255 255 / 0.7)",
    borderFocus: "#FFFFFF",
    fieldBg: "rgb(255 255 255 / 0.1)",
    ring: "rgb(255 255 255 / 0.2)",
    invalid: "var(--accent-on-primary)",
    autofillText: "#FFFFFF",
  },
};

/* Nền dùng để che màu autofill — phải là màu ĐẶC trùng với nền thật phía sau ô */
const AUTOFILL_BG: Record<TextFieldTone, Record<NonNullable<TextFieldProps["appearance"]>, string>> = {
  default: { underline: "var(--bg-main)", outline: "var(--bg-card)" },
  onPrimary: {
    underline: "var(--primary-color)",
    outline: "color-mix(in oklab, white 10%, var(--primary-color))",
  },
};

/* ----------------------------------------------------------------------------
 * CLASS — chỉ đọc biến --tf-*
 * -------------------------------------------------------------------------- */

/* Nhãn giống màn Liên hệ: chữ in hoa nhỏ, giãn chữ, đổi màu khi ô được focus */
const LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--tf-label)] transition-colors duration-300 group-focus-within/field:text-[var(--tf-label-focus)]";

/* Vùng ô nhập — chứa slot đầu, input, slot cuối. Viền nằm ở đây nên slot nằm "trong" ô */
const FIELD_BASE_CLASS =
  "relative flex items-center gap-2.5 border-[var(--tf-border)] text-[15px] text-[var(--tf-text)] transition-[border-color,box-shadow,background-color] duration-300";

const APPEARANCE_CLASS: Record<NonNullable<TextFieldProps["appearance"]>, string> = {
  underline: "border-0 border-b bg-transparent",
  outline: "border bg-[var(--tf-field-bg)] px-3 focus-within:ring-2 focus-within:ring-[var(--tf-ring)]",
};

/* Trạng thái tương tác — chỉ áp khi có thể nhập. hover chỉ áp khi chưa focus để viền focus không bị đè */
const INTERACTIVE_CLASS = "hover:not-focus-within:border-[var(--tf-border-hover)] focus-within:border-[var(--tf-border-focus)]";
const INVALID_CLASS = "border-[var(--tf-invalid)]";
const READONLY_CLASS = "border-dashed";
const DISABLED_CLASS = "cursor-not-allowed opacity-55";

/*
 * Thẻ <input>: không viền (viền nằm ở vùng ô nhập).
 * Autofill: Chrome/Safari tô nền vàng/xanh cho ô tự điền → phủ bóng đổ inset cùng màu nền ô và giữ màu chữ.
 */
const INPUT_CLASS = cn(
  "min-w-0 flex-1 bg-transparent py-2.5 text-inherit outline-none placeholder:text-[var(--tf-placeholder)]",
  "disabled:cursor-not-allowed read-only:cursor-default",
  "autofill:shadow-[inset_0_0_0_1000px_var(--tf-autofill-bg)] autofill:[-webkit-text-fill-color:var(--tf-autofill-text)] autofill:[caret-color:var(--tf-autofill-text)]",
  /* Ẩn nút tăng/giảm của type=number và nút xóa mặc định của type=search (đã có nút riêng) */
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-search-cancel-button]:appearance-none",
);

const SLOT_CLASS = "flex shrink-0 items-center gap-1.5 text-[var(--tf-muted)] [&_svg:not([class*='size-'])]:size-4";

const ICON_BUTTON_CLASS =
  "grid size-7 shrink-0 cursor-pointer place-items-center text-[var(--tf-muted)] transition-colors duration-300 outline-none hover:text-[var(--tf-text)] focus-visible:text-[var(--tf-label-focus)] focus-visible:ring-2 focus-visible:ring-[var(--tf-ring)]";

/** Gộp bảng màu tone thành biến CSS gắn ở khung ngoài */
function toneVars(tone: TextFieldTone, appearance: NonNullable<TextFieldProps["appearance"]>): Record<`--tf-${string}`, string> {
  const c = TONE_COLORS[tone];
  return {
    "--tf-label": c.label,
    "--tf-label-focus": c.labelFocus,
    "--tf-text": c.text,
    "--tf-placeholder": c.placeholder,
    "--tf-muted": c.muted,
    "--tf-border": c.border,
    "--tf-border-hover": c.borderHover,
    "--tf-border-focus": c.borderFocus,
    "--tf-field-bg": c.fieldBg,
    "--tf-ring": c.ring,
    "--tf-invalid": c.invalid,
    "--tf-autofill-text": c.autofillText,
    "--tf-autofill-bg": AUTOFILL_BG[tone][appearance],
  };
}

/** Bàn phím ảo phù hợp theo type / mask (người dùng truyền `inputMode` sẽ được ưu tiên) */
function resolveInputMode(
  type: TextFieldType,
  mask: TextFieldProps["mask"],
  currencyOptions?: CurrencyMaskOptions,
): HTMLAttributes<HTMLInputElement>["inputMode"] {
  if (mask === "currency") return (currencyOptions?.decimalScale ?? 0) > 0 ? "decimal" : "numeric";
  if (mask === "phone") return "tel";
  if (mask === "card" || mask === "date") return "numeric";
  switch (type) {
    case "number":
      return "decimal";
    case "tel":
      return "tel";
    case "email":
      return "email";
    case "url":
      return "url";
    case "search":
      return "search";
    default:
      return undefined;
  }
}

/** autoComplete mặc định cho mask (người dùng truyền sẽ được ưu tiên) */
const MASK_AUTOCOMPLETE: Partial<Record<InputMaskPreset, string>> = {
  phone: "tel",
  card: "cc-number",
};

/** Đặt giá trị cho <input> rồi phát sự kiện `input` thật — React onChange & React Hook Form đều nhận được */
function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Gán một node cho ref ngoài (hàm hoặc object) */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

/**
 * Ô nhập dùng chung của storefront — mặc định giống ô "Họ và tên" ở màn Liên hệ (gạch chân, nhãn in hoa nhỏ).
 *
 * @example
 * // Cơ bản (uncontrolled, dùng được với React Hook Form `register`)
 * <TextField label={t("name")} placeholder={t("namePlaceholder")} autoComplete="name" {...register("name")} />
 *
 * // Controlled + mask tiền tệ, lấy giá trị sạch để gửi API
 * <TextField label="Ngân sách" mask="currency" suffix="VND" value={budget} onValueChange={(display, raw) => ...} />
 *
 * // Tìm kiếm có debounce
 * <TextField type="search" clearable prefix={<Search />} debounceMs={400} onDebouncedChange={search} aria-label="Tìm kiếm" />
 */
export function TextField({
  label,
  layout = "vertical",
  labelWidth = "10rem",
  appearance = "underline",
  fullWidth = true,
  tone = "default",
  prefix,
  prefixDivider = false,
  suffix,
  clearable = false,
  passwordToggle = false,
  copyable = false,
  loading = false,
  helperText,
  error,
  success,
  showCount = false,
  shakeOnError = true,
  shakeKey,
  type = "text",
  value,
  defaultValue,
  onValueChange,
  onChange,
  mask,
  currencyOptions,
  debounceMs = 0,
  onDebouncedChange,
  className,
  fieldClassName,
  inputClassName,
  labelClassName,
  id: idProp,
  ref,
  disabled,
  readOnly,
  required,
  maxLength,
  placeholder,
  inputMode,
  autoComplete,
  style,
  "aria-describedby": ariaDescribedByProp,
  ...inputProps
}: TextFieldProps) {
  const t = useTranslations("Common.textField");

  /* ---------- id & liên kết ngữ nghĩa ---------- */
  const autoId = useId();
  const inputId = idProp ?? `tf-${autoId}`;
  const helperId = `${inputId}-helper`;
  const messageId = `${inputId}-message`;
  const counterId = `${inputId}-counter`;

  /* ---------- Giá trị: controlled / uncontrolled ---------- */
  const maskFn = resolveMask(mask, currencyOptions);
  const formatDisplay = (input: string) => (maskFn ? maskFn(input).display : input);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() => formatDisplay(defaultValue ?? ""));
  const currentValue = isControlled ? formatDisplay(value) : uncontrolledValue;

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Dọn timer khi gỡ component */
  useEffect(
    () => () => {
      clearTimeout(debounceTimerRef.current);
      clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  /* ---------- Xử lý nhập ---------- */
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    let display = input.value;
    let raw = input.value;

    if (maskFn) {
      const caret = input.selectionStart ?? display.length;
      const masked = maskFn(display);
      if (masked.display !== display) {
        const nextCaret = mapCaretPosition(display, caret, masked.display);
        input.value = masked.display;
        /* Chỉ đặt lại con trỏ khi ô đang được focus (tránh cướp focus khi đổi giá trị bằng code) */
        if (document.activeElement === input) input.setSelectionRange(nextCaret, nextCaret);
      }
      display = masked.display;
      raw = masked.raw;
    }

    if (!isControlled) setUncontrolledValue(display);
    onChange?.(event);
    onValueChange?.(display, raw);

    if (onDebouncedChange) {
      clearTimeout(debounceTimerRef.current);
      if (debounceMs > 0) {
        debounceTimerRef.current = setTimeout(() => onDebouncedChange(display, raw), debounceMs);
      } else {
        onDebouncedChange(display, raw);
      }
    }
  };

  const handleClear = () => {
    const input = inputRef.current;
    if (!input) return;
    setNativeInputValue(input, "");
    input.focus();
  };

  const handleCopy = async () => {
    const text = inputRef.current?.value ?? currentValue;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Trình duyệt chặn clipboard (http, quyền) — bỏ qua, không làm vỡ giao diện */
    }
  };

  /* ---------- Trạng thái ---------- */
  const isInteractive = !disabled && !readOnly;
  const hasValue = currentValue.length > 0;
  const hasError = Boolean(error);
  const errorMessage = typeof error === "boolean" ? null : error;
  const isPassword = type === "password";
  const htmlType = isPassword && showPassword ? "text" : mask && type === "number" ? "text" : type;

  const showClear = clearable && hasValue && isInteractive;
  const showCopy = copyable && hasValue && !disabled;
  const showPasswordToggle = passwordToggle && isPassword && !disabled;
  const counterText = maxLength ? `${currentValue.length}/${maxLength}` : `${currentValue.length}`;
  const isAtLimit = maxLength !== undefined && currentValue.length >= maxLength;

  const bottomMessage = hasError && errorMessage ? errorMessage : !hasError && success ? success : null;
  const hasBottom = Boolean(helperText || bottomMessage || showCount);
  const describedBy =
    [ariaDescribedByProp, helperText && helperId, bottomMessage && messageId, showCount && counterId]
      .filter(Boolean)
      .join(" ") || undefined;

  const hasLabel = Boolean(label);
  const isHorizontal = layout === "horizontal" && hasLabel;
  const rootStyle = {
    ...toneVars(tone, appearance),
    "--tf-label-width": labelWidth,
    ...style,
  } as CSSProperties;

  return (
    <div
      data-slot="text-field"
      data-invalid={hasError || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "group/field",
        fullWidth ? "w-full" : "inline-block w-auto max-w-full",
        isHorizontal && "sm:grid sm:grid-cols-[var(--tf-label-width)_minmax(0,1fr)] sm:items-center sm:gap-x-6",
        className,
      )}
      style={rootStyle}
    >
      {/* ---------- Nhãn ---------- */}
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            LABEL_CLASS,
            hasError && "text-[var(--tf-invalid)] group-focus-within/field:text-[var(--tf-invalid)]",
            disabled && "opacity-55",
            labelClassName,
          )}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 text-[var(--tf-invalid)]">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {/* ---------- Vùng ô nhập ---------- */}
      <div
        className={cn(
          FIELD_BASE_CLASS,
          APPEARANCE_CLASS[appearance],
          hasLabel && (isHorizontal ? "mt-2 sm:mt-0" : "mt-2"),
          isInteractive && !hasError && INTERACTIVE_CLASS,
          readOnly && !disabled && READONLY_CLASS,
          hasError && INVALID_CLASS,
          disabled && DISABLED_CLASS,
          fieldClassName,
        )}
      >
        {prefix ? (
          <span className={cn(SLOT_CLASS, prefixDivider && "self-stretch border-r border-[var(--tf-border)] pr-2.5")}>
            {prefix}
          </span>
        ) : null}

        <input
          {...inputProps}
          ref={setRefs}
          id={inputId}
          type={htmlType}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          inputMode={inputMode ?? resolveInputMode(type, mask, currencyOptions)}
          autoComplete={autoComplete ?? (typeof mask === "string" ? MASK_AUTOCOMPLETE[mask] : undefined)}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          aria-busy={loading || undefined}
          aria-describedby={describedBy}
          /* Auto-width: `size` theo độ dài nội dung — chạy được trên mọi trình duyệt */
          size={fullWidth ? undefined : Math.max(currentValue.length, placeholder?.length ?? 0, 4) + 1}
          {...(isControlled ? { value: currentValue } : { defaultValue: uncontrolledValue })}
          onChange={handleChange}
          className={cn(INPUT_CLASS, !fullWidth && "flex-none", inputClassName)}
        />

        {/* ---------- Slot cuối: spinner → xóa → sao chép → mật khẩu → đơn vị ---------- */}
        {loading || showClear || showCopy || showPasswordToggle || suffix ? (
          <span className={SLOT_CLASS}>
            {loading ? <Spinner aria-hidden="true" className="size-4 text-[var(--tf-muted)]" /> : null}
            {showClear ? (
              <button type="button" onClick={handleClear} aria-label={t("clear")} title={t("clear")} className={ICON_BUTTON_CLASS}>
                <X strokeWidth={1.6} />
              </button>
            ) : null}
            {showCopy ? (
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? t("copied") : t("copy")}
                title={copied ? t("copied") : t("copy")}
                className={ICON_BUTTON_CLASS}
              >
                {copied ? <Check strokeWidth={1.6} className="text-[var(--primary-ink)]" /> : <Copy strokeWidth={1.6} />}
              </button>
            ) : null}
            {showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                aria-pressed={showPassword}
                aria-controls={inputId}
                title={showPassword ? t("hidePassword") : t("showPassword")}
                className={ICON_BUTTON_CLASS}
              >
                {showPassword ? <EyeOff strokeWidth={1.6} /> : <Eye strokeWidth={1.6} />}
              </button>
            ) : null}
            {suffix ? <span className="text-sm">{suffix}</span> : null}
          </span>
        ) : null}
      </div>

      {/* ---------- Vùng dưới: gợi ý / thông báo xác thực / bộ đếm ---------- */}
      {hasBottom ? (
        <div className={cn("mt-1.5 flex items-start justify-between gap-4 text-xs leading-5", isHorizontal && "sm:col-start-2")}>
          <div className="min-w-0 space-y-0.5">
            {bottomMessage ? (
              <p
                /* Đổi key theo nội dung lỗi + shakeKey → <p> gắn lại → animation rung chạy lại */
                key={hasError ? `error:${typeof errorMessage === "string" ? errorMessage : "node"}:${shakeKey ?? ""}` : "message"}
                id={messageId}
                role={hasError ? "alert" : "status"}
                className={cn(
                  "flex items-start gap-1.5",
                  hasError && shakeOnError && "motion-safe:animate-shake",
                  hasError
                    ? "text-[var(--tf-invalid)]"
                    : tone === "onPrimary"
                      ? "text-white"
                      : "text-emerald-700 dark:text-emerald-400",
                )}
              >
                {hasError ? (
                  <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                )}
                <span>{bottomMessage}</span>
              </p>
            ) : null}
            {helperText ? (
              <p id={helperId} className="text-[var(--tf-muted)]">
                {helperText}
              </p>
            ) : null}
          </div>
          {showCount ? (
            <span
              id={counterId}
              aria-label={
                maxLength
                  ? t("counter", { count: currentValue.length, max: maxLength })
                  : t("counterNoMax", { count: currentValue.length })
              }
              className={cn(
                "shrink-0 tabular-nums text-[var(--tf-muted)]",
                isAtLimit && "text-[var(--tf-invalid)]",
              )}
            >
              {counterText}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
