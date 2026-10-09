/**
 * Hiệu ứng "bay vào giỏ": ảnh sản phẩm thu nhỏ bay theo đường cong từ vị trí nguồn tới icon giỏ hàng trên header,
 * rồi icon giỏ "nảy" nhẹ. Dùng Web Animations API (không cần state React, tự dọn phần tử sau khi chạy).
 *
 * Đích là phần tử có `data-cart-target` đang hiển thị (header desktop hoặc mobile).
 * Bỏ qua khi người dùng bật giảm chuyển động hoặc không tìm thấy nguồn / đích.
 */
export function flyToCart(imageSrc: string, source: Element | null) {
  if (typeof window === 'undefined' || !source) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const target = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]')).find(
    (element) => element.offsetParent !== null
  );
  if (!target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  // Ảnh bay là hình vuông nhỏ lấy từ giữa nguồn (ảnh dọc 3:4 không bị méo)
  const size = Math.min(from.width, from.height, 220);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;
  const dx = endX - startX;
  const dy = endY - startY;

  const ghost = document.createElement('img');
  ghost.src = imageSrc;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    zIndex: '90',
    pointerEvents: 'none',
    boxShadow: '0 12px 28px -8px rgba(42, 37, 37, 0.45)',
    border: '2px solid #ffffff',
  });
  document.body.appendChild(ghost);

  // Đường cong: vồng lên trước rồi lao xuống icon giỏ
  const flight = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 80}px) scale(0.55)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0.4 },
    ],
    { duration: 850, easing: 'cubic-bezier(0.55, 0, 0.35, 1)', fill: 'forwards' }
  );

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    ghost.remove();
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }],
      { duration: 450, easing: 'ease-out' }
    );
  };
  flight.onfinish = cleanup;
  flight.oncancel = () => ghost.remove();
  // Dự phòng: tab bị ẩn giữa chừng (hoạt ảnh tạm dừng) -> vẫn dọn ảnh bay, không để sót trên màn hình
  window.setTimeout(() => {
    if (done) return;
    done = true;
    flight.cancel();
    // Gỡ trực tiếp: sự kiện cancel cũng chỉ được gửi khi trình duyệt vẽ khung hình
    ghost.remove();
  }, 1500);
}
