import type { CSSProperties } from 'react';

/**
 * Cánh hoa rơi theo gió — lớp trang trí phủ toàn khối chứa (Hero trang chủ, banner màn Đăng ký...).
 * Khối cha cần `relative` (hoặc absolute/fixed) để lớp phủ `absolute inset-0` bám đúng.
 *
 * CSS thuần (keyframes petal-drift / petal-sway / petal-flutter trong globals.css):
 * không cần JS phía client, chạy trên GPU (chỉ animate transform + opacity), không lệch hydrate.
 *
 * Cảm giác tự nhiên đến từ:
 *  - 3 tầng xa / giữa / gần: cánh xa nhỏ, mờ, nhoè nhẹ, rơi chậm; cánh gần to, rõ, rơi nhanh → chiều sâu.
 *  - Gió thổi chéo từ trái sang phải, cộng đung đưa ease-in-out, xoay tròn và nghiêng qua lại trong không gian 3D.
 *  - Mỗi cánh có thông số riêng (sinh từ PRNG cố định → server luôn ra cùng kết quả).
 *  - delay âm: vừa mở trang đã có cánh đang lơ lửng, không phải chờ.
 * Tắt hoàn toàn khi người dùng bật "giảm chuyển động". Trên mobile chỉ giữ khoảng một nửa số cánh.
 *
 * Chỉnh nhanh: số lượng / kích thước / tốc độ ở PETAL_LAYERS, màu ở PETAL_GRADIENTS.
 */

/* ---------- Màu: gradient gốc đậm → mép nhạt cho giống cánh thật ---------- */
const PETAL_GRADIENTS = [
  { id: 'hero-petal-lotus', from: '#DC6F8E', to: '#F7C7D3' }, // hồng sen
  { id: 'hero-petal-blush', from: '#E897AC', to: '#FCE3EA' }, // hồng phấn
  { id: 'hero-petal-gold', from: '#D4A13F', to: '#F5DFA0' }, // điểm vàng kim (ít)
] as const;

/* Tỉ lệ màu: hồng chiếm đa số, vàng kim thỉnh thoảng mới xuất hiện */
const COLOR_WEIGHTS = [0, 0, 0, 1, 1, 1, 2];

/* ---------- Hình cánh (viewBox 24×24) ---------- */
const PETAL_SHAPES = [
  /* Cánh sen thuôn */
  'M12 1.5 C 18.5 7, 18 16.5, 12 22.5 C 6 16.5, 5.5 7, 12 1.5 Z',
  /* Cánh tròn có khía đầu (đào / anh đào) */
  'M12 22 C 4 16, 3.5 7, 9 3 C 10.5 2, 11.5 3.5, 12 5 C 12.5 3.5, 13.5 2, 15 3 C 20.5 7, 20 16, 12 22 Z',
  /* Cánh cong lệch như vừa bị gió cuốn */
  'M5 20 C 3 12, 8 4, 18 2 C 20 9, 15 18, 5 20 Z',
];

/* ---------- Tầng chiều sâu ---------- */
const PETAL_LAYERS = [
  /* Xa   */ { depth: 'back', count: 18, size: [12, 16], fall: [24, 32], sway: [16, 26], opacity: 0.55, blur: 1 },
  /* Giữa */ { depth: 'back', count: 18, size: [18, 24], fall: [16, 22], sway: [24, 38], opacity: 0.85, blur: 0 },
  /* Gần  */ { depth: 'front', count: 10, size: [26, 34], fall: [11, 15], sway: [34, 54], opacity: 0.95, blur: 0.5 },
] as const;

/** PRNG mulberry32 — seed cố định để mọi lần render ra cùng bộ cánh */
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PetalDepth = (typeof PETAL_LAYERS)[number]['depth'];

interface Petal {
  depth: PetalDepth;
  left: number;
  size: number;
  fall: number;
  delay: number;
  drift: number;
  sway: number;
  swayDuration: number;
  flutterDuration: number;
  spin: number;
  tilt: number;
  shape: string;
  gradientId: string;
  opacity: number;
  blur: number;
  hideOnMobile: boolean;
}

function buildPetals(): Petal[] {
  const random = createRandom(20261014);
  const between = ([min, max]: readonly [number, number]) => min + random() * (max - min);
  const petals: Petal[] = [];

  for (const layer of PETAL_LAYERS) {
    for (let i = 0; i < layer.count; i++) {
      const fall = between(layer.fall);
      petals.push({
        depth: layer.depth,
        /* Rải ĐỀU theo chiều ngang (mỗi cánh một ô, lệch ngẫu nhiên trong ô) để cánh to / nhỏ không dồn về một phía.
           Xuất phát lệch trái một chút vì gió đẩy sang phải. */
        left: -15 + ((i + random()) / layer.count) * 110,
        size: between(layer.size),
        fall,
        delay: -random() * fall,
        drift: 12 + random() * 22,
        sway: between(layer.sway),
        swayDuration: 2.6 + random() * 2.4,
        flutterDuration: 4 + random() * 4,
        /* Chiều xoay ngẫu nhiên (âm = ngược kim đồng hồ) */
        spin: (random() < 0.5 ? -1 : 1) * (140 + random() * 160),
        tilt: 35 + random() * 25,
        shape: PETAL_SHAPES[Math.floor(random() * PETAL_SHAPES.length)],
        gradientId: PETAL_GRADIENTS[COLOR_WEIGHTS[Math.floor(random() * COLOR_WEIGHTS.length)]].id,
        opacity: layer.opacity,
        blur: layer.blur,
        hideOnMobile: i % 2 === 1,
      });
    }
  }
  return petals;
}

/* Tính một lần khi nạp module */
const PETALS = buildPetals();

const round = (n: number) => Math.round(n * 100) / 100;

interface FallingPetalsProps {
  /**
   * `back` (mặc định): tầng xa + giữa, nằm SAU nội dung.
   * `front`: tầng gần (cánh to), nằm TRƯỚC nội dung — bay qua cả ảnh slider để cột phải không bị trống hoa.
   */
  depth?: PetalDepth;
  className?: string;
}

export function FallingPetals({ depth = 'back', className }: FallingPetalsProps) {
  const petals = PETALS.filter((petal) => petal.depth === depth);
  /* Gradient chỉ khai báo một lần (ở tầng sau) — id dùng chung toàn trang */
  const withGradients = depth === 'back';

  return (
    <div
      aria-hidden="true"
      style={{ containerType: 'size' }}
      className={`pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden ${className ?? ''}`}
    >
      {/* Khai báo gradient dùng chung cho mọi cánh */}
      {withGradients ? (
        <svg width="0" height="0" className="absolute">
          <defs>
            {PETAL_GRADIENTS.map((gradient) => (
              <linearGradient key={gradient.id} id={gradient.id} x1="0.5" y1="1" x2="0.5" y2="0">
                <stop offset="0%" stopColor={gradient.from} />
                <stop offset="100%" stopColor={gradient.to} />
              </linearGradient>
            ))}
          </defs>
        </svg>
      ) : null}

      {petals.map((petal, i) => (
        /* Lớp 1 — rơi + gió đẩy chéo */
        <span
          key={i}
          className={petal.hideOnMobile ? 'absolute top-0 max-sm:hidden' : 'absolute top-0'}
          style={
            {
              left: `${round(petal.left)}%`,
              width: round(petal.size),
              height: round(petal.size),
              '--petal-drift': `${round(petal.drift)}cqw`,
              '--petal-opacity': petal.opacity,
              animation: `petal-drift ${round(petal.fall)}s linear ${round(petal.delay)}s infinite`,
              willChange: 'transform, opacity',
            } as CSSProperties
          }
        >
          {/* Lớp 2 — đung đưa trái ↔ phải */}
          <span
            className="block size-full"
            style={
              {
                '--petal-sway': `${round(petal.sway)}px`,
                animation: `petal-sway ${round(petal.swayDuration)}s ease-in-out ${round(petal.delay)}s infinite alternate`,
                perspective: '600px',
              } as CSSProperties
            }
          >
            {/* Lớp 3 — lật 3D */}
            <svg
              viewBox="0 0 24 24"
              className="block size-full"
              style={
                {
                  '--petal-spin': `${round(petal.spin)}deg`,
                  '--petal-tilt': `${round(petal.tilt)}deg`,
                  animation: `petal-flutter ${round(petal.flutterDuration)}s ease-in-out ${round(petal.delay)}s infinite`,
                  filter: petal.blur ? `blur(${petal.blur}px)` : undefined,
                } as CSSProperties
              }
            >
              <path d={petal.shape} fill={`url(#${petal.gradientId})`} />
              {/* Gân cánh mảnh cho có chất liệu */}
              <path d="M12 5 C 12.6 10, 12.4 15, 11.6 20" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.7" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
