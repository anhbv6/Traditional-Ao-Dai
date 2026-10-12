/**
 * Định dạng (mask) giá trị ô nhập — hàm thuần, không phụ thuộc React.
 * Mỗi mask nhận chuỗi người dùng gõ và trả về:
 *   - `display`: chuỗi hiển thị trong ô (đã thêm dấu ngăn cách)
 *   - `raw`    : giá trị "sạch" để gửi API (chỉ còn chữ số, hoặc số thập phân với currency)
 */

export type InputMaskPreset = "currency" | "phone" | "card" | "date";

export interface MaskResult {
  display: string;
  raw: string;
}

/** Mask tự viết: nhận chuỗi đang gõ, trả về chuỗi hiển thị + giá trị sạch */
export type InputMaskFn = (input: string) => MaskResult;

export interface CurrencyMaskOptions {
  /** Dấu ngăn cách hàng nghìn — mặc định "," (1,250,000) */
  thousandSeparator?: string;
  /** Số chữ số thập phân cho phép — mặc định 0 (VND không có phần lẻ) */
  decimalScale?: number;
  /** Dấu thập phân — mặc định "." */
  decimalSeparator?: string;
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Chia chuỗi số thành các nhóm theo độ dài cho trước, nối bằng `separator` */
function groupDigits(digits: string, groups: number[], separator: string): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const size of groups) {
    if (cursor >= digits.length) break;
    parts.push(digits.slice(cursor, cursor + size));
    cursor += size;
  }
  return parts.join(separator);
}

/** Tiền tệ: 1250000 → "1,250,000" (raw "1250000") */
export function maskCurrency(input: string, options: CurrencyMaskOptions = {}): MaskResult {
  const { thousandSeparator = ",", decimalScale = 0, decimalSeparator = "." } = options;

  const [integerInput = "", ...decimalParts] = input.split(decimalSeparator);
  const integer = onlyDigits(integerInput).replace(/^0+(?=\d)/, "");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  if (decimalScale <= 0 || decimalParts.length === 0) {
    return { display: grouped, raw: integer };
  }

  const decimal = onlyDigits(decimalParts.join("")).slice(0, decimalScale);
  return {
    display: `${grouped || "0"}${decimalSeparator}${decimal}`,
    raw: `${integer || "0"}.${decimal}`,
  };
}

/** Điện thoại VN: 0912345678 → "0912 345 678" (tối đa 11 số: "0912 345 6789") */
export function maskPhone(input: string): MaskResult {
  const digits = onlyDigits(input).slice(0, 11);
  return { display: groupDigits(digits, [4, 3, 4], " "), raw: digits };
}

/** Thẻ: 4111111111111111 → "4111-1111-1111-1111" */
export function maskCard(input: string): MaskResult {
  const digits = onlyDigits(input).slice(0, 16);
  return { display: groupDigits(digits, [4, 4, 4, 4], "-"), raw: digits };
}

/** Ngày: 25122026 → "25/12/2026" */
export function maskDate(input: string): MaskResult {
  const digits = onlyDigits(input).slice(0, 8);
  return { display: groupDigits(digits, [2, 2, 4], "/"), raw: digits };
}

/** Lấy hàm mask từ preset hoặc hàm tự viết */
export function resolveMask(
  mask: InputMaskPreset | InputMaskFn | undefined,
  currencyOptions?: CurrencyMaskOptions,
): InputMaskFn | undefined {
  if (!mask) return undefined;
  if (typeof mask === "function") return mask;
  switch (mask) {
    case "currency":
      return (input) => maskCurrency(input, currencyOptions);
    case "phone":
      return maskPhone;
    case "card":
      return maskCard;
    case "date":
      return maskDate;
  }
}

/**
 * Tính lại vị trí con trỏ sau khi định dạng, để gõ / xóa ở giữa chuỗi không bị nhảy về cuối.
 * Nguyên tắc: giữ nguyên số ký tự "có nghĩa" (chữ số / chữ cái) đứng trước con trỏ.
 */
export function mapCaretPosition(previousInput: string, caret: number, nextDisplay: string): number {
  const isMeaningful = (char: string) => /[\p{L}\p{N}]/u.test(char);
  const meaningfulBefore = [...previousInput.slice(0, caret)].filter(isMeaningful).length;

  if (meaningfulBefore === 0) return 0;

  let seen = 0;
  for (let index = 0; index < nextDisplay.length; index += 1) {
    if (isMeaningful(nextDisplay[index])) seen += 1;
    if (seen === meaningfulBefore) return index + 1;
  }
  return nextDisplay.length;
}
