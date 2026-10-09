'use client';

import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/features/wishlist';
import { IconLinkButton } from './IconLinkButton';

type WishlistButtonProps = {
  label?: string;
};

export function WishlistButton({ label = 'Wishlist' }: WishlistButtonProps) {
  // Số lượng đọc trực tiếp từ store (dùng chung với nút tim ở thẻ sản phẩm & trang wishlist)
  const count = useWishlistStore((state) => state.items.length);
  return <IconLinkButton href="/wishlist" label={label} icon={Heart} count={count} />;
}
