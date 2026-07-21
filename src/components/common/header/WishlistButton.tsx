import { Heart } from 'lucide-react';
import { IconLinkButton } from './IconLinkButton';

type WishlistButtonProps = {
  count?: number;
  label?: string;
};

export function WishlistButton({ count = 0, label = 'Wishlist' }: WishlistButtonProps) {
  return <IconLinkButton href="/wishlist" label={label} icon={Heart} count={count} />;
}
