"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
import { COLORS, type BespokeConfig } from "../data/bespokeOptions";

/**
 * Đổi dáng (tay, tà, ống quần) bằng CSS `transition: d` — trình duyệt hỗ trợ thì hình "biến" mượt, không hỗ trợ thì đổi ngay.
 * (motion không nội suy được thuộc tính `d` dạng chuỗi lệnh path.)
 */
const MORPH_CLASS = "transition-[d] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Toạ độ y của mép dưới tà áo theo độ dài */
const HEM_Y: Record<BespokeConfig["length"], number> = { ankle: 332, midCalf: 282, knee: 236 };
/** Toạ độ y của cổ tay theo kiểu tay */
const CUFF_Y: Record<BespokeConfig["sleeve"], number> = { long: 196, threeQuarter: 156, short: 104 };

/** Màu chỉ thêu / đính kết: vàng kim (token --sale-gold) trên vải tối, đỏ đô trên vải sáng */
const LIGHT_COLORS = new Set<BespokeConfig["color"]>(["ivory", "blush", "ochre"]);

/** Quần / chân váy phối tông nhẹ (nền card) */
const PANTS_FILL = "var(--bg-card)";

interface AoDaiPreviewProps {
  config: BespokeConfig;
  label: string;
}

/**
 * Hình minh hoạ áo dài (nhìn chính diện) đổi theo lựa chọn — vẽ bằng SVG, đổi màu / dáng mượt:
 * - Thân: ôm eo (truyền thống / cách tân / ngũ thân) hoặc suông; tà trước loe nhẹ, dài theo "độ dài tà".
 * - Tay: dài raglan / lửng / ngắn. Cổ: cao / thấp / thuyền / tim.
 * - Màu vải + lớp ánh sáng theo chất liệu (lụa / satin bóng, nhung trầm, gấm có hoa văn chìm).
 * - Trang trí: in (chấm hoa), thêu tay (cụm hoa ở ngực + tà), đính kết (hạt dọc cổ và gấu).
 * - Quần ống suông / ống rộng / chân váy hiện phía sau tà.
 * Chỉ là minh hoạ — không phải bản vẽ kỹ thuật.
 */
export function AoDaiPreview({ config, label }: AoDaiPreviewProps) {
  const uid = useId().replace(/:/g, "");
  const fill = COLORS.find((color) => color.id === config.color)?.hex ?? COLORS[0].hex;
  const accent = LIGHT_COLORS.has(config.color) ? "var(--primary-color)" : "var(--sale-gold)";
  const isLoose = config.style === "loose" || config.style === "fivePanel";
  const hemY = HEM_Y[config.length];
  const cuffY = CUFF_Y[config.sleeve];

  // Eo: ôm (x 80–120) hoặc suông (x 70–130); gấu tà loe theo độ dài
  const waistL = isLoose ? 70 : 80;
  const waistR = isLoose ? 130 : 120;
  const hemSpread = isLoose ? 38 : 30;
  const body = `M68 62 Q100 54 132 62 L${waistR} 150 L${100 + hemSpread} ${hemY} L${100 - hemSpread} ${hemY} L${waistL} 150 Z`;

  // Tay áo: từ vai xuống cổ tay, hơi xoè ra ngoài
  const cuffSpread = config.sleeve === "short" ? 22 : config.sleeve === "threeQuarter" ? 34 : 42;
  const leftSleeve = `M68 62 L${68 - cuffSpread} ${cuffY} L${68 - cuffSpread + 16} ${cuffY + 4} L78 92 Z`;
  const rightSleeve = `M132 62 L${132 + cuffSpread} ${cuffY} L${132 + cuffSpread - 16} ${cuffY + 4} L122 92 Z`;

  // Ống quần: suông (hẹp, thẳng) hoặc ống rộng (loe ra ngoài)
  const isWideLeg = config.pants === "wide";
  const leftLeg = isWideLeg ? "M78 150 L100 150 L100 344 L66 344 Z" : "M80 150 L99 150 L96 344 L76 344 Z";
  const rightLeg = isWideLeg ? "M100 150 L122 150 L134 344 L100 344 Z" : "M101 150 L120 150 L124 344 L104 344 Z";

  const collar = {
    high: <rect x="90" y="40" width="20" height="18" rx="2" />,
    low: <rect x="90" y="48" width="20" height="10" rx="2" />,
    boat: <path d="M80 60 Q100 70 120 60 L120 62 Q100 74 80 62 Z" />,
    sweetheart: <path d="M88 58 Q94 72 100 66 Q106 72 112 58 L112 62 Q106 78 100 72 Q94 78 88 62 Z" />,
  }[config.collar];

  return (
    <svg viewBox="0 0 200 360" role="img" aria-label={label} className="h-full w-full">
      <defs>
        {/* Ánh sáng theo chất liệu */}
        <linearGradient id={`sheen-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity={config.fabric === "velvet" ? 0.28 : 0.12} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={config.fabric === "silk" || config.fabric === "satin" ? 0.28 : 0.08} />
          <stop offset="1" stopColor="#000" stopOpacity={config.fabric === "velvet" ? 0.3 : 0.14} />
        </linearGradient>
        {/* Gấm: hoa văn chìm */}
        <pattern id={`brocade-${uid}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M7 2 L12 7 L7 12 L2 7 Z" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="0.8" />
        </pattern>
        {/* In hoạ tiết: chấm hoa nhỏ */}
        <pattern id={`print-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.6" fill={accent} fillOpacity="0.55" />
          <circle cx="14" cy="13" r="1.2" fill={accent} fillOpacity="0.45" />
        </pattern>
        {/* Voan: trong suốt nhẹ */}
        <clipPath id={`body-${uid}`}>
          <path d={body} />
        </clipPath>
      </defs>

      {/* Bóng đổ dưới chân */}
      <ellipse cx="100" cy="350" rx="56" ry="5" fill="var(--bg-wine)" opacity="0.1" />

      {/* Quần / chân váy phía sau tà */}
      {config.pants === "skirt" ? (
        <path d="M76 150 L124 150 L142 344 L58 344 Z" fill={PANTS_FILL} stroke="#000" strokeOpacity="0.06" />
      ) : config.pants !== "none" ? (
        <g fill={PANTS_FILL} stroke="#000" strokeOpacity="0.06">
          <path d={leftLeg} className={MORPH_CLASS} />
          <path d={rightLeg} className={MORPH_CLASS} />
        </g>
      ) : null}

      {/* Tay áo */}
      <motion.g animate={{ fill }} transition={{ duration: 0.5 }}>
        <path d={leftSleeve} className={MORPH_CLASS} />
        <path d={rightSleeve} className={MORPH_CLASS} />
      </motion.g>

      {/* Thân + tà */}
      <motion.path d={body} animate={{ fill }} transition={{ duration: 0.5 }} className={MORPH_CLASS} fillOpacity={config.fabric === "chiffon" ? 0.88 : 1} />
      <g clipPath={`url(#body-${uid})`}>
        <rect width="200" height="360" fill={`url(#sheen-${uid})`} />
        {config.fabric === "brocade" ? <rect width="200" height="360" fill={`url(#brocade-${uid})`} /> : null}
        {config.decoration === "print" ? <rect width="200" height="360" fill={`url(#print-${uid})`} /> : null}
        {/* Đường xẻ tà ở eo */}
        <line x1={waistL + 2} y1="150" x2={waistR - 2} y2="150" stroke="#000" strokeOpacity="0.12" />
        {/* Nẹp chéo ngực (áo dài cài khuy bên phải) */}
        <path d="M100 62 Q118 74 128 96" fill="none" stroke="#000" strokeOpacity="0.15" />
      </g>

      {/* Thêu tay: cụm hoa ở ngực trái + tà trước */}
      {config.decoration === "embroidery" ? (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round">
          <EmbroideryMotif x={84} y={92} scale={0.8} motif={config.motif} />
          <EmbroideryMotif x={100} y={hemY - 46} scale={1.3} motif={config.motif} />
        </motion.g>
      ) : null}

      {/* Đính kết: hạt dọc cổ và gấu */}
      {config.decoration === "beading" ? (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} fill={accent}>
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={`n${i}`} cx={82 + i * 4.5} cy={66 + Math.sin((i / 8) * Math.PI) * 6} r="1.2" />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <circle key={`h${i}`} cx={100 - hemSpread + 4 + i * ((hemSpread * 2 - 8) / 10)} cy={hemY - 5} r="1.3" />
          ))}
        </motion.g>
      ) : null}

      {/* Cổ áo */}
      <motion.g animate={{ fill }} transition={{ duration: 0.5 }} stroke="#000" strokeOpacity="0.15">
        {collar}
      </motion.g>
    </svg>
  );
}

/** Hoạ tiết thêu tối giản theo loại hoa / phượng */
function EmbroideryMotif({ x, y, scale, motif }: { x: number; y: number; scale: number; motif: BespokeConfig["motif"] }) {
  const petals = motif === "lotus" ? 6 : 5;
  if (motif === "phoenix") {
    return (
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <path d="M-12 6 Q-4 -10 8 -6 Q2 -2 4 4 Q10 0 14 6 Q4 8 -12 6 Z" />
        <path d="M-12 6 Q-20 14 -26 10 M-12 6 Q-18 18 -24 20" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {Array.from({ length: petals }, (_, i) => {
        const angle = (i / petals) * Math.PI * 2;
        const px = Math.cos(angle) * 6;
        const py = Math.sin(angle) * 6;
        return <ellipse key={i} cx={px} cy={py} rx={motif === "lotus" ? 3.2 : 2.6} ry={motif === "lotus" ? 5.5 : 3} transform={`rotate(${(angle * 180) / Math.PI + 90} ${px} ${py})`} />;
      })}
      <circle r="1.8" />
    </g>
  );
}
