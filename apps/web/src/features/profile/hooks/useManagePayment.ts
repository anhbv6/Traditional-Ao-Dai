"use client";

import { useState } from "react";
import { type PaymentCard } from "../types/profile.types";
import { initialCards } from "../data/mockProfile";

export function useManagePayment() {
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleStartAdd = () => {
    setHolder("");
    setNumber("");
    setExpiry("");
    setCvv("");
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    setCards((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length > 0 && !filtered.some((c) => c.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleSetDefault = (id: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.id === id,
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cardType = number.startsWith("5") ? "mastercard" : "visa";
    const formattedNumber = `•••• •••• •••• ${number.slice(-4) || "0000"}`;

    const newCard: PaymentCard = {
      id: `card-${Date.now()}`,
      holder: holder.toUpperCase(),
      number: formattedNumber,
      expiry: expiry,
      type: cardType,
      isDefault: cards.length === 0,
    };

    setCards((prev) => [...prev, newCard]);
    setIsAdding(false);
  };

  return {
    cards,
    isAdding,
    setIsAdding,
    holder,
    setHolder,
    number,
    setNumber,
    expiry,
    setExpiry,
    cvv,
    setCvv,
    handleStartAdd,
    handleDelete,
    handleSetDefault,
    handleSubmit,
  };
}
