import Image from "next/image";
import { cn } from "@/lib/utils";
import { weaveStyle } from "../constants/fabricMeta";
import type { FabricMaterial } from "../types/fabrics.types";
import { mainFiber } from "../utils/fabricFilters";

interface FabricCoverProps {
  material: FabricMaterial;
  /** Ảnh cụ thể trong gallery — bỏ trống thì lấy ảnh cận đầu tiên */
  src?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Ảnh mặt vải: ảnh cận do admin tải (Cloudinary) hoặc "mặt vải" vẽ bằng CSS theo sợi / thanh đo
 * khi chất liệu chưa có ảnh — để album không bao giờ có ô trống.
 */
export function FabricCover({ material, src, sizes, priority = false, className }: FabricCoverProps) {
  const image = src ?? material.closeupImages[0];

  return (
    <div className={cn("relative overflow-hidden bg-(--bg-secondary)", className)}>
      {image ? (
        <Image
          src={image}
          alt={material.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          style={weaveStyle(mainFiber(material), material.metrics)}
        />
      )}
    </div>
  );
}
