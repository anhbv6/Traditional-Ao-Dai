/** Nền màn đăng nhập admin: lưới mảnh đơn sắc, mờ dần ra mép — tách biệt hẳn phong cách ảnh của storefront */
export function AdminLoginBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#E4E4E7_1px,transparent_1px),linear-gradient(to_bottom,#E4E4E7_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
    />
  );
}
