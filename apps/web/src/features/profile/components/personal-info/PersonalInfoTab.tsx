"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { User, Mail, Phone, Calendar as CalendarIcon, Camera, Smile } from "lucide-react";
import { usePersonalInfo } from "../../hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { uploadImageApi } from "@/features/upload/api/upload.api";
import { showToast as toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    isEditing,
    handleStartEdit,
    handleCancelEdit,
    handleSubmit,
    isLoading,
    user,
  } = usePersonalInfo();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleCancel = () => {
    handleCancelEdit();
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  const onSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalAvatarUrl = avatarUrl;

    if (selectedFile) {
      try {
        setIsUploadingAvatar(true);
        const response = await uploadImageApi(selectedFile, "avatars");
        if (response.data?.url) {
          finalAvatarUrl = response.data.url;
          setAvatarUrl(finalAvatarUrl);
        } else {
          toast.error(t("avatarUrlInvalid"));
          setIsUploadingAvatar(false);
          return;
        }
      } catch (error) {
        console.error("Lỗi tải ảnh đại diện:", error);
        toast.error(t("avatarUploadFailed"));
        setIsUploadingAvatar(false);
        return;
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    handleSubmit(e, finalAvatarUrl);
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setAvatarPreview(localUrl);
      setSelectedFile(file);
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

  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <div className="rounded-2xl border border-[#800020]/10 bg-white p-4 shadow-sm sm:p-8">
      <form onSubmit={onSaveSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 sm:gap-6 sm:pb-6 border-b border-[#800020]/10">
          <div className="relative group">
            <Avatar 
              size="xl" 
              onClick={() => {
                if (displayAvatar && !isUploadingAvatar) {
                  setIsModalOpen(true);
                }
              }}
              className={`size-20 sm:size-24 border-2 border-[#E2D9D2] transition-all duration-300 shadow-sm ${
                displayAvatar && !isUploadingAvatar
                  ? "hover:border-[#800020] cursor-pointer hover:shadow-md" 
                  : "cursor-default"
              }`}
            >
              <AvatarImage src={displayAvatar} alt={fullName} className="object-cover" />
              <AvatarFallback className="bg-[#FAF7F5] text-[#800020] font-bold text-xl sm:text-2xl uppercase">
                {fullName ? fullName.slice(0, 2) : "US"}
              </AvatarFallback>
            </Avatar>

            {/* Uploading Spinner */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center z-10">
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
            
            {/* Edit Button */}
            {isEditing && (
              <button
                type="button"
                onClick={triggerFileSelect}
                className="absolute bottom-0 right-0 p-2 sm:p-2.5 rounded-full bg-[#800020] text-white hover:bg-[#800020]/95 shadow-md border-2 border-white flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                aria-label={t("editAvatar")}
                title={t("editAvatar")}
              >
                <Camera size={12} className="text-white sm:hidden" />
                <Camera size={14} className="text-white hidden sm:block" />
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
            <h3 className="text-base sm:text-lg font-bold text-[#2A2525] font-[family-name:var(--font-playfair)]">
              {user?.name || "-"}
            </h3>
            {user?.email && <p className="text-[11px] sm:text-xs text-[#706565]">
              {user.email}
            </p>}
          </div>

          <div className="w-full sm:w-auto flex justify-center">
            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="w-full sm:w-auto inline-flex h-9 sm:h-10 items-center justify-center rounded-lg border border-[#800020] bg-white px-4 sm:px-5 text-[11px] sm:text-xs font-semibold uppercase tracking-[1px] text-[#800020] transition-all hover:bg-[#800020] hover:text-white cursor-pointer shadow-sm hover:shadow-md active:scale-95 duration-200"
              >
                {t("changeInfoBtn")}
              </button>
            )}
          </div>
        </div>

        {/* Modal Popup to view full-size avatar */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-[280px] sm:max-w-[360px] !p-0 overflow-hidden rounded-2xl shadow-2xl !border-none">
            {displayAvatar && (
              <img 
                src={displayAvatar} 
                alt={fullName} 
                className="w-full aspect-square object-cover block" 
              />
            )}
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("fullName")}
            </label>
            {!isEditing ? (
              <div className="flex items-center gap-2.5 sm:gap-3.5 w-full h-10 rounded-xl border border-[#800020]/5 bg-gradient-to-r from-[#FAF7F5]/40 to-white px-3 sm:px-4 text-xs sm:text-sm text-[#2A2525] font-semibold shadow-xs hover:border-[#800020]/10 transition-all duration-300">
                <User size={14} className="text-[#800020]/70 sm:hidden shrink-0" />
                <User size={16} className="text-[#800020]/70 hidden sm:block shrink-0" />
                <span>{fullName || "-"}</span>
              </div>
            ) : (
              <div className="relative">
                <User className="absolute left-3 sm:left-3.5 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-[#800020]/50 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl border border-[#E2D9D2] bg-white pl-10 pr-3 sm:pl-11 sm:pr-4 text-xs sm:text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("email")}
            </label>
            {!isEditing ? (
              <div className="flex items-center gap-2.5 sm:gap-3.5 w-full h-10 rounded-xl border border-[#800020]/5 bg-gradient-to-r from-[#FAF7F5]/40 to-white px-3 sm:px-4 text-xs sm:text-sm text-[#2A2525] font-semibold shadow-xs hover:border-[#800020]/10 transition-all duration-300">
                <Mail size={14} className="text-[#800020]/70 sm:hidden shrink-0" />
                <Mail size={16} className="text-[#800020]/70 hidden sm:block shrink-0" />
                <span>{email || "-"}</span>
              </div>
            ) : (
              <div className="relative">
                <Mail className="absolute left-3 sm:left-3.5 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-[#800020]/50 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#E2D9D2] bg-white pl-10 pr-3 sm:pl-11 sm:pr-4 text-xs sm:text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("phone")}
            </label>
            {!isEditing ? (
              <div className="flex items-center gap-2.5 sm:gap-3.5 w-full h-10 rounded-xl border border-[#800020]/5 bg-gradient-to-r from-[#FAF7F5]/40 to-white px-3 sm:px-4 text-xs sm:text-sm text-[#2A2525] font-semibold shadow-xs hover:border-[#800020]/10 transition-all duration-300">
                <Phone size={14} className="text-[#800020]/70 sm:hidden shrink-0" />
                <Phone size={16} className="text-[#800020]/70 hidden sm:block shrink-0" />
                <span>{phone || "-"}</span>
              </div>
            ) : (
              <div className="relative">
                <Phone className="absolute left-3 sm:left-3.5 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-[#800020]/50 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full h-10 rounded-xl border border-[#E2D9D2] bg-white pl-10 pr-3 sm:pl-11 sm:pr-4 text-xs sm:text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] hover:border-[#800020]/30 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* DOB */}
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
              {t("dob")}
            </label>
            {!isEditing ? (
              <div className="flex items-center gap-2.5 sm:gap-3.5 w-full h-10 rounded-xl border border-[#800020]/5 bg-gradient-to-r from-[#FAF7F5]/40 to-white px-3 sm:px-4 text-xs sm:text-sm text-[#2A2525] font-semibold shadow-xs hover:border-[#800020]/10 transition-all duration-300">
                <CalendarIcon size={14} className="text-[#800020]/70 sm:hidden shrink-0" />
                <CalendarIcon size={16} className="text-[#800020]/70 hidden sm:block shrink-0" />
                <span>{formatLocalDate(dob)}</span>
              </div>
            ) : (
              <div className="relative">
                <Popover>
                  <PopoverTrigger render={
                    <button
                      type="button"
                      className="w-full h-10 text-left rounded-xl border border-[#E2D9D2] bg-white pl-10 pr-3 sm:pl-11 sm:pr-4 text-xs sm:text-sm text-[#2A2525] outline-none transition-all duration-300 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] cursor-pointer hover:border-[#800020]/30 shadow-xs"
                    >
                      {formatLocalDate(dob)}
                    </button>
                  } />
                  <CalendarIcon className="absolute left-3 sm:left-3.5 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-[#800020]/50 pointer-events-none" />
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
            )}
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2 w-full sm:max-w-[calc(50%-12px)]">
          <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]">
            {t("gender")}
          </label>
          {!isEditing ? (
              <div className="flex items-center gap-2.5 sm:gap-3.5 w-full h-10 rounded-xl border border-[#800020]/5 bg-gradient-to-r from-[#FAF7F5]/40 to-white px-3 sm:px-4 text-xs sm:text-sm text-[#2A2525] font-semibold shadow-xs hover:border-[#800020]/10 transition-all duration-300 capitalize">
              <Smile size={14} className="text-[#800020]/70 sm:hidden shrink-0" />
              <Smile size={16} className="text-[#800020]/70 hidden sm:block shrink-0" />
              <span>
                {gender === "male"
                  ? t("genderMale")
                  : gender === "female"
                  ? t("genderFemale")
                  : t("genderOther")}
              </span>
            </div>
          ) : (
            <div className="relative w-full">
              <Select 
                value={gender} 
                onValueChange={(val) => setGender(val || "other")}
              >
                <SelectTrigger
                  className="!w-full !h-10 !rounded-xl flex items-center justify-between border border-[#E2D9D2] bg-white pl-10 pr-3 sm:pl-11 sm:pr-4 text-xs sm:text-sm text-[#2A2525] outline-none transition-all duration-300 focus-visible:border-[#800020] focus-visible:ring-1 focus-visible:ring-[#800020] hover:border-[#800020]/30 shadow-xs cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E2D9D2] text-[#2A2525] shadow-lg rounded-xl overflow-hidden font-medium">
                  <SelectGroup>
                    <SelectItem value="male" className="cursor-pointer font-medium hover:bg-[#800020]/5 focus:bg-[#800020]/5 focus:text-[#800020]">
                      {t("genderMale")}
                    </SelectItem>
                    <SelectItem value="female" className="cursor-pointer font-medium hover:bg-[#800020]/5 focus:bg-[#800020]/5 focus:text-[#800020]">
                      {t("genderFemale")}
                    </SelectItem>
                    <SelectItem value="other" className="cursor-pointer font-medium hover:bg-[#800020]/5 focus:bg-[#800020]/5 focus:text-[#800020]">
                      {t("genderOther")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Smile className="absolute left-3 sm:left-3.5 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-[#800020]/50 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Submit */}
        {isEditing && (
          <div className="pt-4 animate-fade-in flex flex-col justify-end sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isLoading || isUploadingAvatar || !fullName.trim() || !email.trim() || !phone.trim() || !dob.trim()}
              className="w-full sm:w-auto inline-flex h-9 sm:h-11 items-center justify-center rounded-lg bg-[#800020] px-6 sm:px-8 text-xs font-semibold uppercase tracking-[1.5px] text-white transition-all hover:bg-[#800020]/90 focus:outline-none focus:ring-2 focus:ring-[#800020] focus:ring-offset-2 cursor-pointer shadow-sm hover:shadow-md duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploadingAvatar ? "Đang lưu..." : t("saveBtn")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading || isUploadingAvatar}
              className="w-full sm:w-auto inline-flex h-9 sm:h-11 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white px-6 sm:px-8 text-xs font-semibold uppercase tracking-[1.5px] text-gray-700 transition-all hover:bg-gray-50 cursor-pointer shadow-sm hover:shadow-md duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("cancelBtn")}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
