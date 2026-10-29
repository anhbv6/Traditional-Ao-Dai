/** Nền màn đăng nhập admin: lưới chấm đơn sắc, mờ dần ra mép — khác hẳn bố cục ảnh 2 cột của đăng nhập storefront */
export function AdminLoginBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(#D4D4D8_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
    />
  );
}
