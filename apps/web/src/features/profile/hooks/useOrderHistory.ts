"use client";

import { useState } from "react";
import { type Order } from "../types/profile.types";

export function useOrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return {
    selectedOrder,
    setSelectedOrder,
  };
}
