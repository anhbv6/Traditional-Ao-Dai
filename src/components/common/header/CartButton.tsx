import { ShoppingBag } from 'lucide-react';
import { IconLinkButton } from './IconLinkButton';

type CartButtonProps = {
  count?: number;
  label?: string;
};

export function CartButton({ count = 0, label = 'Cart' }: CartButtonProps) {
  return <IconLinkButton href="/cart" label={label} icon={ShoppingBag} count={count} />;
}
