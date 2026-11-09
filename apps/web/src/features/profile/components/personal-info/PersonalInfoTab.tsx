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
import { MeasurementsSection } from "../measurements/MeasurementsSection";
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
 * Thông tin cá nhân — MỘT thẻ gộp hồ sơ + liên hệ, bên dưới là thẻ "Số đo của tôi":
 * - Chế độ xem: đầu thẻ ảnh · tên · nút "Thay đổi thông tin"; lưới 2 cột ngày sinh, giới tính, email, SĐT.
 * - Bấm "Thay đổi thông tin" → form (ảnh đại diện, họ tên, ngày sinh, giới tính).
 *   Họ tên bắt buộc; ngày sinh tuỳ chọn nhưng nếu nhập phải là ngày hợp lệ trong quá khứ.
 * - Email / SĐT không sửa trực tiếp — thêm, đổi hay xác minh đều qua hộp thoại mã 6 số.
 */
export function PersonalInfoTab() {
  const t = useTranslations("ProfilePage.personal");
  const tProfile = useTranslations("ProfilePage");
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
        <Avatar size="xl" className="size-16 border border-[var(--border)] sm:size-20">
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
      <ProfileSection title={t("profileTitle")} description={t("profileDesc")}>
        {!isEditing ? (
          /* ---------- Chế độ xem: đầu thẻ (ảnh · tên · nút sửa) → lưới 2 cột ngày sinh, giới tính, email, SĐT ---------- */
          <>
            <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] pb-5 sm:gap-5">
              {avatar}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate font-[family-name:var(--font-playfair)] text-xl font-semibold sm:text-2xl",
                    displayName ? "text-[var(--primary-ink)]" : "italic text-[var(--text-light)]",
                  )}
                >
                  {displayName || t("notProvided")}
                </p>
                <p className="mt-1 text-xs text-[var(--text-light)]">{tProfile("memberSince")}</p>
              </div>
              <ActionButton variant="dialog" size="sm" icon={<PencilLine />} onClick={startEdit}>
                {t("changeInfoBtn")}
              </ActionButton>
            </div>

            <dl className="grid gap-x-10 gap-y-5 pt-5 sm:grid-cols-2">
              <InfoItem label={t("dob")} value={isoToDisplay(dob)} emptyLabel={t("notProvided")} />
              <InfoItem label={t("gender")} value={genderLabel[(gender as Gender) ?? "other"] ?? genderLabel.other} emptyLabel={t("notProvided")} />
              <ContactItem
                label={t("email")}
                icon={Mail}
                value={user?.email ?? ""}
                isVerified={Boolean(user?.emailVerified)}
                onAction={() => contactVerification.open("email")}
              />
              <ContactItem
                label={t("phone")}
                icon={Phone}
                value={user?.phone ?? ""}
                isVerified={Boolean(user?.phoneVerified)}
                onAction={() => contactVerification.open("phone")}
              />
            </dl>
            <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-light)]">{t("contactDesc")}</p>
          </>
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

      <MeasurementsSection />

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

const LABEL_CLASS = "text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]";

function InfoItem({ label, value, emptyLabel }: { label: string; value?: string | null; emptyLabel: string }) {
  return (
    <div>
      <dt className={LABEL_CLASS}>{label}</dt>
      <dd className={cn("mt-1.5 text-[15px]", value ? "text-[var(--text-main)]" : "italic text-[var(--text-light)]")}>
        {value || emptyLabel}
      </dd>
    </div>
  );
}

interface ContactItemProps {
  label: string;
  icon: LucideIcon;
  value: string;
  isVerified: boolean;
  onAction: () => void;
}

/**
 * Ô liên hệ trong lưới thông tin: nhãn + trạng thái xác minh → giá trị + liên kết Thêm / Xác minh / Đổi.
 * Email / SĐT không sửa trực tiếp — mọi thay đổi qua hộp thoại mã 6 số.
 */
function ContactItem({ label, icon: Icon, value, isVerified, onAction }: ContactItemProps) {
  const t = useTranslations("ProfilePage.personal");
  const actionLabel = !value ? t("addBtn") : isVerified ? t("changeBtn") : t("verifyBtn");

  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2">
        <span className={LABEL_CLASS}>{label}</span>
        {value ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1px]",
              isVerified ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400",
            )}
          >
            {isVerified ? <BadgeCheck className="size-3" aria-hidden="true" /> : null}
            {isVerified ? t("verified") : t("unverified")}
          </span>
        ) : null}
      </dt>
      <dd className="mt-1.5 flex items-center gap-3">
        <Icon size={15} strokeWidth={1.5} className="shrink-0 text-[var(--primary-ink)]" aria-hidden="true" />
        <span className={cn("min-w-0 flex-1 truncate text-[15px]", value ? "text-[var(--text-main)]" : "italic text-[var(--text-light)]")}>
          {value || t("notProvided")}
        </span>
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 cursor-pointer text-xs font-semibold text-[var(--primary-ink)] underline-offset-4 hover:underline"
        >
          {actionLabel}
        </button>
      </dd>
    </div>
  );
}
