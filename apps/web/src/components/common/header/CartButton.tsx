"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { formatVnd } from '@repo/shared';
import { calculateCartTotals, useCartStore } from '@/features/cart';
import { Link } from '@/i18n/routing';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';

type CartButtonProps = {
  count?: number;
  label?: string;
};

export function CartButton({ label = 'Cart' }: CartButtonProps) {
  // Giỏ hàng dùng chung store với trang giỏ hàng & checkout (không còn đồng bộ bằng window event)
  const cartItems = useCartStore((state) => state.items);
  const removeCartItem = useCartStore((state) => state.removeItem);

  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeCartItem(id);
  };

  const { subtotal, totalQuantity: totalCount } = calculateCartTotals(cartItems);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleDropdownWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const listElement = listRef.current;

    event.preventDefault();
    event.stopPropagation();

    if (!listElement) {
      return;
    }

    const maxScrollTop = listElement.scrollHeight - listElement.clientHeight;
    if (maxScrollTop <= 0) {
      return;
    }

    const nextScrollTop = Math.min(
      Math.max(listElement.scrollTop + event.deltaY, 0),
      maxScrollTop
    );

    listElement.scrollTop = nextScrollTop;
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        {/* Dropdown Menu Trigger */}
        <DropdownMenuTrigger render={
          <button
            type="button"
            aria-label={label}
            className="relative grid h-11 w-11 place-items-center text-primary transition-opacity hover:opacity-75 outline-none cursor-pointer"
          />
        }>
          <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
          {totalCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#800020] px-1 text-[10px] font-bold leading-none text-white">
              {totalCount}
            </span>
          )}
        </DropdownMenuTrigger>

        {/* Dropdown Menu Content */}
        <DropdownMenuContent 
          align="end" 
          sideOffset={8}
          showArrow={true}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onWheel={handleDropdownWheel}
          className="w-[320px] bg-white border border-[#E2D9D2] rounded-xl p-4 shadow-xl z-50 text-[#2A2525] overflow-hidden overscroll-contain"
        >
          {/* Header */}
          <div className="pb-3 border-b border-[#E2D9D2]/40 text-xs font-semibold text-[#706565]">
            {cartItems.length > 0 ? (
              <span>You have {totalCount} {totalCount === 1 ? 'item' : 'items'} in your cart</span>
            ) : (
              <span className="text-center block py-4 text-xs font-medium text-[#706565]/60">Your cart is empty</span>
            )}
          </div>

          {/* Items List */}
          {cartItems.length > 0 && (
            <>
              <div ref={listRef} className="py-2.5 max-h-[260px] overflow-y-auto overscroll-contain divide-y divide-[#E2D9D2]/30">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 first:pt-1 last:pb-1 group">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5] border border-[#E2D9D2]/30">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#800020] line-clamp-1 group-hover:text-[#800020]/85 transition-colors">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="hover:underline cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      </h4>
                      <p className="mt-1 text-[11px] text-[#2A2525] font-semibold">
                        {item.quantity} x {formatVnd(item.price)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#706565]">
                        Size: {item.size}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeItem(item.id, e)}
                      className="text-[#706565]/50 hover:text-rose-600 transition-colors self-center p-1.5 cursor-pointer active:scale-90"
                      title="Remove item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="pt-3 border-t border-[#E2D9D2]/40 flex items-center justify-between">
                <span className="text-xs font-bold text-[#2A2525]">Subtotal</span>
                <span className="text-sm font-extrabold text-[#800020]">{formatVnd(subtotal)}</span>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-9 flex items-center justify-center rounded-lg border border-[#E2D9D2] bg-white text-xs font-bold text-[#706565] hover:bg-[#FAF7F5] hover:text-[#800020] hover:border-[#800020]/30 transition-all duration-300 text-center cursor-pointer active:scale-95"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-9 flex items-center justify-center rounded-lg bg-[#800020] text-xs font-bold text-white hover:bg-[#800020]/90 border border-[#800020] transition-all duration-300 text-center cursor-pointer active:scale-95"
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
