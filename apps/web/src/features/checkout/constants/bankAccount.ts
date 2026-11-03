/**
 * Tài khoản nhận chuyển khoản (mock). Khi có API đơn hàng, Backend trả về kèm đơn (có thể kèm QR VietQR).
 */
export const BANK_ACCOUNT = {
  bankName: "Techcombank",
  accountNumber: "19034567891011",
  accountHolder: "TIEM AO DAI THIEN CANH",
} as const;

/** Nội dung chuyển khoản: mã đơn — đối soát tự động theo mã */
export const buildTransferContent = (orderId: string) => `THIENCANH ${orderId}`;
