/**
 * Bảng màu ô nhập theo tone — dùng chung cho TextField và TextAreaField.
 * Component chỉ đọc biến CSS --tf-*, nên thêm tone mới chỉ cần thêm một bộ màu ở đây.
 */

/** `underline`: chỉ gạch chân. `outline`: viền hộp */
export type TextFieldAppearance = "underline" | "outline";

/* ----------------------------------------------------------------------------
 * BẢNG MÀU THEO TONE — sửa màu ô nhập toàn site tại đây.
 * -------------------------------------------------------------------------- */

export type TextFieldTone = "default" | "onPrimary" | "admin";

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
  /* Khu vực admin: đơn sắc, luôn sáng — màu theo AGENTS.md §8 */
  /* Nhãn xám đậm, sẫm lại khi focus — khớp nhãn form admin */
  admin: {
    label: "#3F3F46",
    labelFocus: "#09090B",
    text: "#09090B",
    placeholder: "#A1A1AA",
    muted: "#71717A",
    border: "#E4E4E7",
    borderHover: "#D4D4D8",
    borderFocus: "#18181B",
    fieldBg: "#FFFFFF",
    ring: "rgb(24 24 27 / 0.08)",
    invalid: "#E11D48",
    autofillText: "#09090B",
  },
};

/* Nền dùng để che màu autofill — phải là màu ĐẶC trùng với nền thật phía sau ô */
const AUTOFILL_BG: Record<TextFieldTone, Record<TextFieldAppearance, string>> = {
  default: { underline: "var(--bg-main)", outline: "var(--bg-card)" },
  onPrimary: {
    underline: "var(--primary-color)",
    outline: "color-mix(in oklab, white 10%, var(--primary-color))",
  },
  admin: { underline: "#FAFAFA", outline: "#FFFFFF" },
};

/** Gộp bảng màu tone thành biến CSS gắn ở khung ngoài */
export function textFieldToneVars(tone: TextFieldTone, appearance: TextFieldAppearance): Record<`--tf-${string}`, string> {
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
