'use client';

import Image from 'next/image';
import { Lens } from '@/components/ui/lens';

interface ProductGalleryProps {
  galleryImages: string[];
  activeImageIndex: number;
  onActiveImageIndexChange: (index: number) => void;
  productName: string;
  imageAlt: string;
  defaultImageSrc: string;
}

export default function ProductGallery({
  galleryImages,
  activeImageIndex,
  onActiveImageIndexChange,
  productName,
  imageAlt,
  defaultImageSrc,
}: ProductGalleryProps) {
  return (
    <div className="min-w-0">
      <Lens zoomFactor={1.55} lensSize={190} lensColor="var(--primary-color)" ariaLabel={imageAlt}>
        <div className="relative aspect-[1.05/1] overflow-hidden bg-[var(--bg-secondary)]">
          <Image
            src={galleryImages[activeImageIndex] || defaultImageSrc}
            alt={imageAlt}
            fill
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover"
          />
        </div>
      </Lens>

      <div className="mt-5 grid grid-cols-4 gap-3 sm:gap-5">
        {galleryImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => onActiveImageIndexChange(index)}
            aria-label={`${productName} ${index + 1}`}
            className={`relative aspect-square cursor-pointer overflow-hidden border transition-colors bg-[var(--bg-secondary)] ${
              activeImageIndex === index ? 'border-[var(--primary-color)]' : 'border-transparent'
            } hover:border-[var(--primary-color)]`}
          >
            <Image
              src={image}
              alt={`${productName} thumbnail ${index + 1}`}
              fill
              sizes="(max-width: 768px) 22vw, 140px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
