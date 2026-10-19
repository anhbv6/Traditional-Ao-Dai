"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Camera, Mail, PencilLine, Phone, Save, UserRound, type LucideIcon } from "lucide-react";
import { uploadImageApi } from "@/features/upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showToast as toast } from "@/components/ui/toast";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppDialog } from "@/components/shared/AppDialog";
import { ChoiceGroup } from "@/components/shared/ChoiceGroup";
import { TextField } from "@/components/shared/TextField";
import { cn } from "@/lib/utils";
import { usePersonalInfo } from "../../hooks/useProfile";
import { useContactVerification } from "../../hooks/useContactVerification";
import { usePersonalInfoStore } from "../../store/personalInfoStore";
import { ProfileSection } from "../ProfileSection";
import { ContactVerificationDialog } from "./ContactVerificationDialog";

type Gender = "male" | "female" | "other";

/** "1990-05-20" → "20/05/1990" */
function isoToDisplay(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}

/** "20/05/1990" → "1990-05-20"; ngày không tồn tại / ở tương lai / trước 1900 → null */
function displayToIso(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const valid =
    date.getFullYear() === Number(yyyy) &&
    date.getMonth() === Number(mm) - 1 &&
    date.getDate() === Number(dd) &&
    Number(yyyy) >= 1900 &&
    date.getTime() <= Date.now();
  return valid ? `${yyyy}-${mm}-${dd}` : null;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return null;
  const [first, second] = name.trim().split(/\s+/);
  return `${first?.[0] ?? ""}${second?.[0] ?? ""}`.toUpperCase();
}

/**
 * Thông tin cá nhân:
 * - Khối "Thông tin cơ bản": xem dạng danh sách; bấm "Thay đổi thông tin" → form (ảnh đại diện, họ tên, ngày sinh, giới tính).
 *   Họ tên bắt buộc; ngày sinh tuỳ chọn nhưng nếu nhập phải là ngày hợp lệ trong quá khứ.
 * - Khối "Thông tin liên hệ": email / SĐT không sửa trực tiếp — thêm, đổi hay xác minh đều qua hộp thoại mã 6 số.
 */
export function PersonalInfoTab() {
  const t = useTranslations("ProfilePage.personal");
  const {
    fullName,
    setFullName,
    gender,
    setGender,
    dob,
    avatarUrl,
    setAvatarUrl,
    isEditing,
    handleStartEdit,
    handleCancelEdit,
    handleSubmit,
    isLoading,
    user,
  } = usePersonalInfo();
  const contactVerification = useContactVerification();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dobInput, setDobInput] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; dob?: string }>({});
  const [submitCount, setSubmitCount] = useState(0);

  const isSaving = isLoading || isUploadingAvatar;
  const displayAvatar = (avatarPreview || avatarUrl || "").trim();
  const displayName = user?.name || fullName;
  const genderLabel: Record<Gender, string> = {
    male: t("genderMale"),
    female: t("genderFemale"),
    other: t("genderOther"),
  };

  const startEdit = () => {
    handleStartEdit();
    // Store đã nạp lại dữ liệu người dùng đồng bộ → đọc ngay để điền ô ngày sinh
    setDobInput(isoToDisplay(usePersonalInfoStore.getState().dob));
    setErrors({});
  };

  const cancelEdit = () => {
    handleCancelEdit();
    setSelectedFile(null);
    setAvatarPreview(null);
    setErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setSelectedFile(file);
    e.target.value = "";
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setSubmitCount((count) => count + 1);

    const isoDob = dobInput ? displayToIso(dobInput) : "";
    const nextErrors = {
      fullName: fullName.trim() ? undefined : t("fullNameRequired"),
      dob: isoDob === null ? t("dobInvalid") : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.fullName || nextErrors.dob) return;

    let finalAvatarUrl = avatarUrl;
    if (selectedFile) {
      setIsUploadingAvatar(true);
      try {
        const response = await uploadImageApi(selectedFile, "avatars");
        if (!response.data?.url) {
          toast.error(t("avatarUrlInvalid"));
          return;
        }
        finalAvatarUrl = response.data.url;
        setAvatarUrl(finalAvatarUrl);
      } catch (error) {
        console.error("Lỗi tải ảnh đại diện:", error);
        toast.error(t("avatarUploadFailed"));
        return;
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    handleSubmit({ avatarUrl: finalAvatarUrl, dob: isoDob ?? "" });
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  const avatar = (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => displayAvatar && setIsPreviewOpen(true)}
        disabled={!displayAvatar}
        aria-label={t("previewAvatar")}
        className="block cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-default"
      >
        <Avatar size="xl" className="size-20 border border-[var(--border)] sm:size-24">
          {displayAvatar ? <AvatarImage src={displayAvatar} alt={displayName ?? ""} className="object-cover" /> : null}
          <AvatarFallback className="bg-[var(--bg-main)] text-xl font-semibold uppercase text-[var(--primary-ink)]">
            {getInitials(displayName) || <UserRound size={28} strokeWidth={1.4} aria-hidden="true" />}
          </AvatarFallback>
        </Avatar>
      </button>
      {isUploadingAvatar ? (
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
          <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      <ProfileSection
        title={t("basicTitle")}
        description={t("basicDesc")}
        action={
          !isEditing ? (
            <ActionButton variant="dialog" size="sm" icon={<PencilLine />} onClick={startEdit}>
              {t("changeInfoBtn")}
            </ActionButton>
          ) : undefined
        }
      >
        {!isEditing ? (
          /* ---------- Chế độ xem ---------- */
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {avatar}
            <dl className="grid flex-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <InfoItem label={t("fullName")} value={user?.name} emptyLabel={t("notProvided")} />
              <InfoItem label={t("dob")} value={isoToDisplay(dob)} emptyLabel={t("notProvided")} />
              <InfoItem label={t("gender")} value={genderLabel[(gender as Gender) ?? "other"] ?? genderLabel.other} emptyLabel={t("notProvided")} />
            </dl>
          </div>
        ) : (
          /* ---------- Chế độ sửa ---------- */
          <form onSubmit={onSave} noValidate className="space-y-6">
            <div className="flex items-center gap-5">
              {avatar}
              <div className="space-y-2">
                <ActionButton
                  variant="cancel"
                  size="sm"
                  icon={<Camera />}
                  disabled={isSaving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("changeAvatar")}
                </ActionButton>
                <p className="text-xs text-[var(--text-light)]">{t("avatarHint")}</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                appearance="outline"
                size="md"
                label={t("fullName")}
                required
                autoComplete="name"
                placeholder={t("fullNamePlaceholder")}
                value={fullName}
                onValueChange={(value) => {
                  setFullName(value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                error={errors.fullName}
                shakeKey={submitCount}
                disabled={isSaving}
              />
              <TextField
                appearance="outline"
                size="md"
                label={t("dob")}
                mask="date"
                autoComplete="bday"
                placeholder={t("dobPlaceholder")}
                value={dobInput}
                onValueChange={(value) => {
                  setDobInput(value);
                  if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                }}
                error={errors.dob}
                shakeKey={submitCount}
                disabled={isSaving}
              />
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{t("gender")}</p>
              <ChoiceGroup<Gender>
                label={t("gender")}
                variant="chip"
                value={(gender as Gender) || "other"}
                onChange={setGender}
                options={[
                  { value: "female", label: t("genderFemale") },
                  { value: "male", label: t("genderMale") },
                  { value: "other", label: t("genderOther") },
                ]}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
              <ActionButton variant="cancel" onClick={cancelEdit} disabled={isSaving}>
                {t("cancelBtn")}
              </ActionButton>
              <ActionButton type="submit" variant="confirm" icon={<Save />} loading={isSaving}>
                {isSaving ? t("saving") : t("saveBtn")}
              </ActionButton>
            </div>
          </form>
        )}
      </ProfileSection>

      <ProfileSection title={t("contactTitle")} description={t("contactDesc")} flush>
        <ul className="divide-y divide-[var(--border)]">
          <ContactRow
            label={t("email")}
            icon={Mail}
            value={user?.email ?? ""}
            isVerified={Boolean(user?.isEmailVerified)}
            onAction={() => contactVerification.open("email")}
          />
          <ContactRow
            label={t("phone")}
            icon={Phone}
            value={user?.phone ?? ""}
            isVerified={Boolean(user?.isPhoneVerified)}
            onAction={() => contactVerification.open("phone")}
          />
        </ul>
      </ProfileSection>

      <AppDialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen} title={t("previewAvatar")} size="sm" cancel={false}>
        {displayAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh blob xem trước / URL avatar tuỳ ý, không tối ưu được bằng next/image
          <img src={displayAvatar} alt={displayName ?? ""} className="block aspect-square w-full object-cover" />
        ) : null}
      </AppDialog>

      <ContactVerificationDialog {...contactVerification} />
    </>
  );
}

function InfoItem({ label, value, emptyLabel }: { label: string; value?: string | null; emptyLabel: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]">{label}</dt>
      <dd className={cn("mt-1.5 text-[15px]", value ? "text-[var(--text-main)]" : "italic text-[var(--text-light)]")}>
        {value || emptyLabel}
      </dd>
    </div>
  );
}

interface ContactRowProps {
  label: string;
  icon: LucideIcon;
  value: string;
  isVerified: boolean;
  onAction: () => void;
}

/** Một dòng liên hệ: icon · nhãn + giá trị · trạng thái xác minh · nút Thêm / Xác minh / Đổi */
function ContactRow({ label, icon: Icon, value, isVerified, onAction }: ContactRowProps) {
  const t = useTranslations("ProfilePage.personal");
  const actionLabel = !value ? t("addBtn") : isVerified ? t("changeBtn") : t("verifyBtn");

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
      <span className="relative grid size-10 shrink-0 place-items-center text-[var(--primary-ink)]">
        <span aria-hidden="true" className="absolute inset-1.5 rotate-45 border border-[var(--primary-color)]/35" />
        <Icon size={16} strokeWidth={1.5} className="relative" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]">{label}</p>
        <p className={cn("mt-1 truncate text-[15px]", value ? "text-[var(--text-main)]" : "italic text-[var(--text-light)]")}>
          {value || t("notProvided")}
        </p>
      </div>
      {value ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[1px]",
            isVerified ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400",
          )}
        >
          {isVerified ? <BadgeCheck className="size-3.5" aria-hidden="true" /> : null}
          {isVerified ? t("verified") : t("unverified")}
        </span>
      ) : null}
      <ActionButton variant={!value || !isVerified ? "confirm" : "dialog"} size="sm" onClick={onAction}>
        {actionLabel}
      </ActionButton>
    </li>
  );
}
