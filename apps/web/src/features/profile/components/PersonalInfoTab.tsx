"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { User, Mail, Phone, Calendar as CalendarIcon, Sparkles, Camera } from "lucide-react";
import { usePersonalInfo } from "../hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function PersonalInfoTab() {
  const t = useTranslations("ProfilePage.personal");
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    gender,
    setGender,
    dob,
    setDob,
    avatarUrl,
    setAvatarUrl,
    showSuccess,
    handleSubmit,
    isLoading,
  } = usePersonalInfo();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialValuesRef = useRef({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    avatarUrl: "",
  });

  const handleStartEdit = () => {
    initialValuesRef.current = {
      fullName,
      email,
      phone,
      dob,
      gender,
      avatarUrl,
    };
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFullName(initialValuesRef.current.fullName);
    setEmail(initialValuesRef.current.email);
    setPhone(initialValuesRef.current.phone);
    setDob(initialValuesRef.current.dob);
    setGender(initialValuesRef.current.gender);
    setAvatarUrl(initialValuesRef.current.avatarUrl);
    setIsEditing(false);
  };

  const onSaveSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
    setIsEditing(false);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
    }
  };

  const handleDobSelect = (date: Date | undefined) => {
    if (date) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      setDob(`${yyyy}-${mm}-${dd}`);
    }
  };

  const getLocalDate = (dateStr: string) => {
    if (!dateStr) return undefined;
    return new Date(dateStr + "T00:00:00");
  };

  const formatLocalDate = (dateStr: string) => {
    const date = getLocalDate(dateStr);
    if (!date) return isEditing ? t("selectDate") : "-";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 shadow-sm sm:p-8">
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-[#706565]">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={onSaveSubmit} className="mt-8 space-y-6">
        {showSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200 animate-fade-in">
            <Sparkles size={18} className="text-green-600 shrink-0" />
            <p className="font-medium">{t("successMsg")}</p>
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#800020]/10">
          <div className="relative group">
            <Avatar 
              size="xl" 
              onClick={() => {
                if (avatarUrl) {
                  setIsModalOpen(true);
                }
              }}
              className={`size-24 border-2 border-[#E2D9D2] transition-all duration-300 shadow-sm ${
                avatarUrl 
                  ? "hover:border-[#800020] cursor-pointer hover:shadow-md" 
                  : "cursor-default"
              }`}
            >
              <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-[#FAF7F5] text-[#800020] font-bold text-2xl uppercase">
                {fullName ? fullName.slice(0, 2) : "US"}
              </AvatarFallback>
            </Avatar>
            
            {/* Edit Button */}
            {isEditing && (
              <button
                type="button"
                onClick={triggerFileSelect}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#800020] text-white hover:bg-[#800020]/95 shadow-md border-2 border-white flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                aria-label={t("editAvatar")}
                title={t("editAvatar")}
              >
                <Camera size={14} className="text-white" />
              </button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-lg font-bold text-[#2A2525] font-[family-name:var(--font-playfair)]">
              {fullName || "-"}
            </h3>
            <p className="text-xs text-[#706565]">
              {email || "-"}
            </p>
          </div>

          <div className="w-full sm:w-auto flex justify-center">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-lg border border-[#800020] bg-white px-5 text-xs font-semibold uppercase tracking-[1px] text-[#800020] transition-all hover:bg-[#800020] hover:text-white cursor-pointer shadow-sm hover:shadow-md active:scale-95 duration-200"
              >
                {t("changeInfoBtn")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-5 text-xs font-semibold uppercase tracking-[1px] text-gray-700 transition-all hover:bg-gray-50 cursor-pointer shadow-sm hover:shadow-md active:scale-95 duration-200"
              >
                {t("cancelBtn")}
              </button>
            )}
          </div>
        </div>

        {/* Modal Popup to view full-size avatar */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[280px] sm:max-w-[360px] !p-0 overflow-hidden rounded-2xl shadow-2xl !border-none">
            {avatarUrl && (
              <img 
                src={avatarUrl} 
                alt={fullName} 
                className="w-full aspect-square object-cover block" 
              />
            )}
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("fullName")}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
              <input
                type="text"
                value={isEditing ? fullName : (fullName || "-")}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={!isEditing}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-4 text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 disabled:bg-[#F3ECE7]/10 disabled:border-[#E2D9D2]/40 disabled:text-[#706565]/80 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
              <input
                type="email"
                value={isEditing ? email : (email || "-")}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-4 text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 disabled:bg-[#F3ECE7]/10 disabled:border-[#E2D9D2]/40 disabled:text-[#706565]/80 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("phone")}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60" />
              <input
                type="tel"
                value={isEditing ? phone : (phone || "-")}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={!isEditing}
                className="w-full rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-4 text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 disabled:bg-[#F3ECE7]/10 disabled:border-[#E2D9D2]/40 disabled:text-[#706565]/80 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* DOB */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("dob")}
            </label>
            <div className="relative">
              <Popover>
                <PopoverTrigger render={
                  <button
                    type="button"
                    disabled={!isEditing}
                    className="w-full text-left rounded-lg border border-[#E2D9D2] bg-white py-3 pl-11 pr-4 text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] cursor-pointer hover:border-[#800020]/30 disabled:bg-[#F3ECE7]/10 disabled:border-[#E2D9D2]/40 disabled:text-[#706565]/80 disabled:cursor-not-allowed"
                  >
                    {formatLocalDate(dob)}
                  </button>
                } />
                <CalendarIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#706565]/60 pointer-events-none" />
                <PopoverContent className="w-auto p-0 bg-white border border-[#E2D9D2] rounded-xl shadow-lg z-50">
                  <Calendar
                    mode="single"
                    selected={getLocalDate(dob)}
                    onSelect={handleDobSelect}
                    captionLayout="dropdown"
                    startMonth={new Date(1930, 0)}
                    endMonth={new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#706565]">
            {t("gender")}
          </span>
          <div className="flex flex-wrap gap-3">
            {["male", "female", "other"].map((value) => {
              const isSelected = gender === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!isEditing}
                  onClick={() => setGender(value)}
                  className={`flex-1 min-w-[90px] sm:flex-initial px-4 py-2.5 rounded-lg border text-xs font-semibold uppercase tracking-wider text-center transition-all duration-300 cursor-pointer
                    ${isSelected 
                      ? "border-[#800020] bg-[#800020]/5 text-[#800020] shadow-xs font-semibold" 
                      : "border-[#E2D9D2] bg-white text-[#706565] hover:border-[#800020]/30"} 
                    ${!isEditing ? "opacity-70 cursor-not-allowed bg-[#FAF8F6] border-[#E2D9D2]/40 text-[#706565]/80" : ""}`}
                >
                  {value === "male"
                    ? t("genderMale")
                    : value === "female"
                    ? t("genderFemale")
                    : t("genderOther")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        {isEditing && (
          <div className="pt-4 animate-fade-in flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-[#800020] px-8 text-xs font-semibold uppercase tracking-[1.5px] text-white transition-all hover:bg-[#800020]/90 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2 cursor-pointer shadow-sm hover:shadow-md duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang lưu..." : t("saveBtn")}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-8 text-xs font-semibold uppercase tracking-[1.5px] text-gray-700 transition-all hover:bg-gray-50 cursor-pointer shadow-sm hover:shadow-md duration-200"
            >
              {t("cancelBtn")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
