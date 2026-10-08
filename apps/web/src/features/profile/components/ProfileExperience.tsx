"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { User, ShoppingBag, MapPin, CreditCard, Shield, Settings, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import { PersonalInfoTab } from "./personal-info";
import { OrderHistoryTab } from "./order-history";
import { ManageAddressTab } from "./manage-address";
import { ManagePaymentTab } from "./manage-payment";
import { SecurityTab } from "./security";
import { SettingTab } from "./setting";
import { useProfile } from "../hooks/useProfile";
import { ConfirmDialog } from "@/components/shared";
import { useCustomerLogout } from "@/features/auth";

export function ProfileExperience() {
  const t = useTranslations("ProfilePage");
  const tCommon = useTranslations("Common");
  const { activeTab, setActiveTab } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { logout: handleLogout, isLoggingOut } = useCustomerLogout();

  const tabList = [
    { id: "personal" as const, label: t("tabs.personal"), icon: User },
    { id: "orders" as const, label: t("tabs.orders"), icon: ShoppingBag },
    { id: "address" as const, label: t("tabs.address"), icon: MapPin },
    { id: "payment" as const, label: t("tabs.payment"), icon: CreditCard },
    { id: "security" as const, label: t("tabs.security"), icon: Shield },
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
      case "security":
        return <SecurityTab />;
      case "setting":
        return <SettingTab />;
      default:
        return <PersonalInfoTab />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="hidden sm:mb-10 sm:block">
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
          <nav className="hidden lg:block space-y-1.5 p-3">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "cursor-pointer flex w-full items-center gap-3.5 rounded-xl py-3 text-sm font-semibold transition-all duration-300 border-l-4 pl-3",
                    activeTab === tab.id
                      ? "bg-[#800020]/5 text-[#800020] border-[#800020]"
                      : "text-[#706565] hover:bg-[#FAF7F5] hover:text-[#800020] border-transparent"
                  )}
                >
                  <Icon size={18} className={cn("shrink-0", activeTab === tab.id ? "text-[#800020]" : "text-[#706565]/80")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Logout Button */}
                          <div className="border-t border-[#E2D9D2]/40 mt-3 pt-2">
                <button
                  onClick={() => setOpenConfirm(true)}
                  className="cursor-pointer flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-300"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span>{tCommon("logout")}</span>
                </button>
              </div>

          </nav>
 
          {/* Mobile Floating Action Button (FAB) Menu */}
          <div className="lg:hidden fixed bottom-7 left-5 z-50">
            {/* Overlay Backdrop to click outside and close */}
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
            
            {/* Menu Options (Spreads upwards) */}
            <div 
              className={cn(
                "absolute bottom-12 left-0 z-50 flex flex-col gap-2.5 transition-all duration-300 origin-bottom-left",
                isMobileMenuOpen 
                  ? "opacity-100 scale-100 translate-y-0" 
                  : "opacity-0 scale-90 translate-y-4 pointer-events-none"
              )}
            >
              {tabList.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl shadow-md border text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 cursor-pointer w-fit min-w-[180px]",
                      isActive
                        ? "bg-[#800020] border-[#800020] text-white"
                        : "bg-[#FAF7F5] border-[#E2D9D2] text-[#706565] hover:border-[#800020]/30"
                    )}
                  >
                    <Icon size={16} className={cn("shrink-0", isActive ? "text-white" : "text-[#706565]/80")} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              
              {/* Logout Option in FAB */}
                              <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setOpenConfirm(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-rose-100 text-rose-600 shadow-md text-xs font-semibold whitespace-nowrap transition-all duration-300 active:scale-95 cursor-pointer w-fit min-w-[180px]"
                >
                  <LogOut size={16} className="shrink-0 text-rose-500" />
                  <span>{tCommon("logout")}</span>
                </button>

            </div>

            {/* Main Trigger FAB Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "relative z-50 flex size-8 items-center justify-center rounded-full bg-[#800020] text-white shadow-xl hover:bg-[#800020]/90 transition-all duration-300 active:scale-90 cursor-pointer border border-[#800020]/20",
                isMobileMenuOpen && "rotate-45"
              )}
              aria-label="Toggle profile menu"
            >
              {isMobileMenuOpen ? (
                <Plus className="size-5 shrink-0" />
              ) : (
                (() => {
                  const currentTab = tabList.find(t => t.id === activeTab);
                  const TabIcon = currentTab?.icon || User;
                  return <TabIcon className="size-[18px] shrink-0" />;
                })()
              )}
            </button>
          </div>
        </aside>

        {/* Content Area / Right Tab View */}
        <main className="min-w-0 transition-all duration-300">
          {renderTabContent()}
        </main>
      </div>
      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        confirmVariant="destructive"
        title={t("logoutDialog.title")}
        description={t("logoutDialog.message")}
        confirmText={t("logoutDialog.confirmBtn")}
        cancelText={t("logoutDialog.cancelBtn")}
        isLoading={isLoggingOut}
        customTitle={"text-lg sm:text-2xl"}
        onConfirm={handleLogout}
      />
    </div>
  );
}
