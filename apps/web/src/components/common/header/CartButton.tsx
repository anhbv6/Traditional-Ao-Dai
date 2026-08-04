"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
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
  // Initialize with empty array to prevent hydration mismatch, will load from localStorage in useEffect
  const [cartItems, setCartItems] = useState<{
    id: number;
    name: string;
    slug: string;
    image: string;
    quantity: number;
    price: number;
    size: string;
  }[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('cart_items');
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse cart items from localStorage", err);
      }
    } else {
      // Setup mock defaults on first load
      const defaultItems = [
        {
          id: 1,
          name: "Girls Pink Moana Printed Dress",
          slug: "girls-pink-moana-printed-dress",
          image: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=200&auto=format&fit=crop",
          quantity: 1,
          price: 80.00,
          size: "S",
        },
        {
          id: 2,
          name: "Women Textured Handheld Bag",
          slug: "women-textured-handheld-bag",
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=200&auto=format&fit=crop",
          quantity: 1,
          price: 80.00,
          size: "Regular",
        },
        {
          id: 3,
          name: "Tailored Cotton Casual Shirt",
          slug: "tailored-cotton-casual-shirt",
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=200&auto=format&fit=crop",
          quantity: 1,
          price: 40.00,
          size: "M",
        }
      ];
      setCartItems(defaultItems);
      localStorage.setItem('cart_items', JSON.stringify(defaultItems));
    }
    isInitialized.current = true;

    // Listen to updates from other pages (e.g. Cart page updates)
    const handleCartUpdated = () => {
      const updated = localStorage.getItem('cart_items');
      if (updated) {
        try {
          setCartItems(JSON.parse(updated));
        } catch (err) {
          console.error("Failed to parse updated cart items", err);
        }
      }
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  // Save to localStorage when cart items change
  useEffect(() => {
    if (isInitialized.current) {
      localStorage.setItem('cart_items', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // Listen to global custom cart-add-item event
  useEffect(() => {
    const handleAddItem = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newItem = customEvent.detail;

      setCartItems(prev => {
        const existingItem = prev.find(item => item.slug === newItem.slug);
        if (existingItem) {
          return prev.map(item =>
            item.slug === newItem.slug
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...newItem, id: Date.now() }];
      });
    };

    window.addEventListener("cart-add-item", handleAddItem);
    return () => {
      window.removeEventListener("cart-add-item", handleAddItem);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Remove item handler
  const removeItem = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate statistics dynamically
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
                        {item.quantity} x ${item.price.toFixed(2)}
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
                <span className="text-sm font-extrabold text-[#800020]">${subtotal.toFixed(2)}</span>
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
