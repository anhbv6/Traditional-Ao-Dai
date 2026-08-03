"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { User, ShoppingBag, MapPin, CreditCard, Settings, LogOut } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { cn } from "@/lib/utils";

import { PersonalInfoTab } from "./PersonalInfoTab";
import { OrderHistoryTab } from "./OrderHistoryTab";
import { ManageAddressTab } from "./ManageAddressTab";
import { ManagePaymentTab } from "./ManagePaymentTab";
import { SettingTab } from "./SettingTab";
import { useProfile } from "../hooks/useProfile";
import { type TabId } from "../types/profile.types";

export function ProfileExperience() {
  const t = useTranslations("ProfilePage");
  const { activeTab, setActiveTab } = useProfile();

  const tabList = [
    { id: "personal" as const, label: t("tabs.personal"), icon: User },
    { id: "orders" as const, label: t("tabs.orders"), icon: ShoppingBag },
    { id: "address" as const, label: t("tabs.address"), icon: MapPin },
    { id: "payment" as const, label: t("tabs.payment"), icon: CreditCard },
    { id: "setting" as const, label: t("tabs.setting"), icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoTab />;
      case "orders":
        return <OrderHistoryTab />;
      case "address":
        return <ManageAddressTab />;
      case "payment":
        return <ManagePaymentTab />;
      case "setting":
        return <SettingTab />;
      default:
        return <PersonalInfoTab />;
    }
  };

  return (
    <Container as="section" className="py-12 bg-[#FAF7F5] min-h-screen overflow-x-hidden">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#800020] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#706565]">
          {t("subtitle")}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr] w-full max-w-full">
        {/* Sidebar / Left Menu */}
        <aside className="space-y-2 w-full overflow-hidden">
          {/* Desktop Navigation */}
          <nav className="hidden lg:block space-y-1.5 rounded-2xl border border-[#800020]/10 bg-white p-3 shadow-sm">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "cursor-pointer flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-[#800020] text-white shadow-sm"
                      : "text-[#706565] hover:bg-[#FAF7F5] hover:text-[#800020]"
                  )}
                >
                  <Icon size={18} className={cn("shrink-0", activeTab === tab.id ? "text-white" : "text-[#706565]/80")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Logout Button */}
            <div className="border-t border-[#E2D9D2]/40 mt-3 pt-2">
              <button
                onClick={() => alert("Đăng xuất thành công")}
                className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-300"
              >
                <LogOut size={18} className="shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </nav>

          {/* Mobile Swipeable Navigation */}
          <div className="flex lg:hidden overflow-x-auto pb-4 gap-2 scrollbar-none -mx-5 px-5 select-none">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border shrink-0",
                    isActive
                      ? "bg-[#800020] border-[#800020] text-white shadow-sm"
                      : "bg-white border-[#E2D9D2] text-[#706565] hover:border-[#800020]/20"
                  )}
                >
                  <Icon size={13} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Area / Right Tab View */}
        <main className="min-w-0 transition-all duration-300">
          {renderTabContent()}
        </main>
      </div>
    </Container>
  );
}
