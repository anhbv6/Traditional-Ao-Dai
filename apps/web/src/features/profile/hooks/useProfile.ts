"use client";

import { useState } from "react";
import { type TabId } from "../types/profile.types";

export function useProfile() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  return {
    activeTab,
    setActiveTab,
  };
}

export * from "./usePersonalInfo";
export * from "./useManageAddress";
export * from "./useManagePayment";
export * from "./useSetting";
export * from "./useOrderHistory";
export * from "./useSecurity";
export * from "./useVietnamAddress";
