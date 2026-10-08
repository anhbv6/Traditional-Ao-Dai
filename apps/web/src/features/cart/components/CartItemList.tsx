import React from "react";
import { formatVnd } from "@repo/shared";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { Link } from "@/i18n/routing";
import { type CartItem } from "../types/cart.types";

interface CartItemListProps {
  cartItems: CartItem[];
  handleQuantityChange: (id: string, delta: number) => void;
  handleQuantityInput: (id: string, value: string) => void;
  handleRemoveItem: (id: string) => void;
}

export function CartItemList({
  cartItems,
  handleQuantityChange,
  handleQuantityInput,
  handleRemoveItem,
}: CartItemListProps) {
  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-4 sm:p-6 shadow-xs divide-y divide-[#E2D9D2]/40">
      {cartItems.map((item) => (
        <div key={item.id} className="flex gap-4 py-5 first:pt-0 last:pb-0 group">
          {/* Image */}
          <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl bg-[#FAF7F5] border border-[#E2D9D2]/30">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Item Info & Actions */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-base font-bold text-[#800020] hover:text-[#800020]/90">
                  <Link href={`/products/${item.slug}`} className="hover:underline">
                    {item.name}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-[#706565]">
                  Kích cỡ: <span className="font-bold text-[#2A2525]">{item.size}</span>
                </p>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-[#2A2525]">
                {formatVnd(item.price)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              {/* Quantity Selector */}
              <div className="flex items-center rounded-lg border border-[#E2D9D2] bg-[#FAF7F5] p-0.5">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.id, -1)}
                  className="flex size-7 items-center justify-center rounded-md text-[#706565] hover:bg-white hover:text-[#800020] transition-colors cursor-pointer disabled:opacity-50"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={11} />
                </button>
                <input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                  className="w-10 text-center text-xs font-bold text-[#2A2525] bg-transparent outline-none border-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item.id, 1)}
                  className="flex size-7 items-center justify-center rounded-md text-[#706565] hover:bg-white hover:text-[#800020] transition-colors cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>

              {/* Trash Button */}
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="flex size-8 items-center justify-center rounded-lg text-[#706565]/60 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer active:scale-90"
                title="Xóa sản phẩm"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default CartItemList;
