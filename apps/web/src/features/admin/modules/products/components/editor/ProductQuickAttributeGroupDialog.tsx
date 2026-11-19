"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminButton,
  AdminDialog,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminTextField,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { createAttributeAction, createAttributeGroupAction } from "@/features/admin/modules/attributes";
import { toSlug } from "../../utils/products.utils";
import { type AdminProductAttributeOption, type AdminProductDesignGroup } from "../../types/products.types";

const CREATE_NEW_GROUP_KEY = "__CREATE_NEW_GROUP__";

interface PendingAttribute {
  name: string;
  nameEn: string;
  code: string;
}

export interface ProductQuickAttributeGroupDialogProps {
  groups: AdminProductDesignGroup[];
  initialGroupCode?: string | null;
  onClose: () => void;
  onGroupCreated?: (newGroup: AdminProductDesignGroup) => void;
  onAttributesCreated?: (newAttributes: AdminProductAttributeOption[]) => void;
}

/**
 * Dialog thêm thuộc tính thiết kế mới:
 * - Tên nhóm thuộc tính: vừa chọn được từ các nhóm có sẵn (data cũ), vừa có tùy chọn tạo nhóm mới (option data mới).
 * - Mã định danh nhóm: tự động hiển thị mã nhóm cũ (readonly) hoặc tự sinh mã theo tên nhóm mới.
 * - Mô tả nhóm: hiển thị mô tả nhóm cũ hoặc cho phép nhập mô tả cho nhóm mới.
 * - Danh sách thuộc tính mới cần thêm vào nhóm (hỗ trợ nhập 1 hoặc nhiều thuộc tính qua chip tags).
 */
export function ProductQuickAttributeGroupDialog({
  groups,
  initialGroupCode,
  onClose,
  onGroupCreated,
  onAttributesCreated,
}: ProductQuickAttributeGroupDialogProps) {
  const t = useTranslations("AdminPage.products");
  const locale = useLocale();
  const notify = useNotify();

  // Khởi tạo nhóm được chọn: nếu có initialGroupCode hợp lệ thì chọn nhóm đó,
  // ngược lại nếu có danh sách nhóm thì chọn nhóm đầu tiên, nếu danh sách rỗng thì tạo nhóm mới.
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(() => {
    if (initialGroupCode && groups.some((g) => g.code === initialGroupCode)) {
      return initialGroupCode;
    }
    return groups.length > 0 ? groups[0]!.code : CREATE_NEW_GROUP_KEY;
  });

  const isCreatingNewGroup = selectedGroupKey === CREATE_NEW_GROUP_KEY;
  const currentSelectedGroup = groups.find((g) => g.code === selectedGroupKey);

  const [lang, setLang] = useState<AdminContentLang>(locale === "en" ? "en" : "vi");

  // Dữ liệu khi tạo nhóm mới
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupNameEn, setNewGroupNameEn] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupCodeTouched, setNewGroupCodeTouched] = useState(false);
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupDescriptionEn, setNewGroupDescriptionEn] = useState("");

  // Danh sách các thuộc tính mới cần thêm
  const [attrInput, setAttrInput] = useState("");
  const [pendingAttributes, setPendingAttributes] = useState<PendingAttribute[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  const autoNewGroupCode = toSlug(newGroupName).replace(/-/g, "_").toUpperCase();
  const effectiveNewGroupCode = newGroupCodeTouched
    ? newGroupCode.trim().toUpperCase()
    : autoNewGroupCode;

  const handleNewGroupNameChange = (val: string) => {
    setNewGroupName(val);
    if (!newGroupCodeTouched) {
      setNewGroupCode(toSlug(val).replace(/-/g, "_").toUpperCase());
    }
  };

  const handleAddAttr = () => {
    const trimmed = attrInput.trim();
    if (!trimmed) return;

    const code = toSlug(trimmed).replace(/-/g, "_").toUpperCase();
    if (pendingAttributes.some((a) => a.code === code)) {
      setAttrInput("");
      return;
    }

    setPendingAttributes((prev) => [
      ...prev,
      {
        name: trimmed,
        nameEn: lang === "en" ? trimmed : "",
        code,
      },
    ]);
    setAttrInput("");
  };

  const handleRemoveAttr = (index: number) => {
    setPendingAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Tự động gom thêm input đang gõ dở nếu người dùng chưa bấm Thêm
    const finalAttributes = [...pendingAttributes];
    const currentInput = attrInput.trim();
    if (currentInput) {
      const code = toSlug(currentInput).replace(/-/g, "_").toUpperCase();
      if (!finalAttributes.some((a) => a.code === code)) {
        finalAttributes.push({
          name: currentInput,
          nameEn: lang === "en" ? currentInput : "",
          code,
        });
      }
    }

    if (isCreatingNewGroup) {
      // 1. Lưu nhóm mới kèm các thuộc tính con
      const trimmedGroupName = newGroupName.trim();
      if (!trimmedGroupName) {
        notify.error(t("field.groupNameRequired"), "ATTRIBUTE_GROUP_NAME_REQUIRED");
        return;
      }
      if (!effectiveNewGroupCode) {
        notify.error(t("field.groupCodeRequired"), "ATTRIBUTE_GROUP_CODE_INVALID");
        return;
      }

      setIsSaving(true);
      try {
        const groupRes = await createAttributeGroupAction({
          code: effectiveNewGroupCode,
          name: trimmedGroupName,
          nameEn: newGroupNameEn.trim(),
          description: newGroupDescription.trim(),
          descriptionEn: newGroupDescriptionEn.trim(),
        });

        if (!groupRes.success) {
          notify.error(groupRes.error, "ATTRIBUTE_GROUP_CREATE_FAILED");
          return;
        }

        const newGroupId = groupRes.data.id;
        const newGroupObj: AdminProductDesignGroup = {
          id: newGroupId,
          code: effectiveNewGroupCode,
          name: trimmedGroupName,
          nameEn: newGroupNameEn.trim() || null,
          description: newGroupDescription.trim() || null,
          descriptionEn: newGroupDescriptionEn.trim() || null,
        };

        onGroupCreated?.(newGroupObj);

        // Tạo các thuộc tính con nếu có
        const createdAttributes: AdminProductAttributeOption[] = [];
        for (const attr of finalAttributes) {
          const attrRes = await createAttributeAction({
            groupId: newGroupId,
            code: attr.code,
            name: attr.name,
            nameEn: attr.nameEn,
            description: "",
            descriptionEn: "",
            hex: "",
            family: "",
            isActive: true,
          });

          if (attrRes.success) {
            const match = attrRes.data.values.find(
              (v) => v.groupId === newGroupId && v.code === attr.code
            );
            if (match) {
              createdAttributes.push({
                id: match.id,
                group: effectiveNewGroupCode,
                code: match.code,
                name: match.name,
                hex: null,
                isActive: true,
              });
            }
          }
        }

        if (createdAttributes.length > 0) {
          onAttributesCreated?.(createdAttributes);
        }

        notify.success(t("groupCreated", { name: trimmedGroupName }));
        onClose();
      } finally {
        setIsSaving(false);
      }
    } else {
      // 2. Thêm thuộc tính vào nhóm đã chọn
      if (!currentSelectedGroup) return;

      if (finalAttributes.length === 0) {
        notify.error(t("field.attributeNameRequired"), "ATTRIBUTE_NAME_REQUIRED");
        return;
      }

      setIsSaving(true);
      try {
        const createdAttributes: AdminProductAttributeOption[] = [];
        for (const attr of finalAttributes) {
          const attrRes = await createAttributeAction({
            groupId: currentSelectedGroup.id,
            code: attr.code,
            name: attr.name,
            nameEn: attr.nameEn,
            description: "",
            descriptionEn: "",
            hex: "",
            family: "",
            isActive: true,
          });

          if (attrRes.success) {
            const match = attrRes.data.values.find(
              (v) => v.groupId === currentSelectedGroup.id && v.code === attr.code
            );
            if (match) {
              createdAttributes.push({
                id: match.id,
                group: currentSelectedGroup.code,
                code: match.code,
                name: match.name,
                hex: null,
                isActive: true,
              });
            }
          }
        }

        if (createdAttributes.length > 0) {
          onAttributesCreated?.(createdAttributes);
        }

        notify.success(
          t("attributeCreated", { name: finalAttributes.map((a) => a.name).join(", ") })
        );
        onClose();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const hasPendingOrInput = pendingAttributes.length > 0 || attrInput.trim().length > 0;
  const isSubmitDisabled = isSaving || (isCreatingNewGroup ? !newGroupName.trim() : !hasPendingOrInput);

  // Danh sách lựa chọn nhóm: bao gồm tùy chọn tạo nhóm mới và các nhóm đã có
  const groupSelectOptions = [
    {
      value: CREATE_NEW_GROUP_KEY,
      label: t("quickAttribute.createGroupOption"),
    },
    ...groups.map((g) => ({
      value: g.code,
      label: locale === "en" && g.nameEn ? g.nameEn : g.name,
    })),
  ];

  return (
    <AdminDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("quickAttribute.dialogTitle")}
      description={t("quickAttribute.dialogDesc")}
      size="lg"
      disableDivider
      headerAside={
        isCreatingNewGroup ? (
          <AdminLangSwitch
            value={lang}
            onChange={setLang}
            label={t("editor.langLabel")}
            status={{ en: newGroupNameEn.trim() ? undefined : "missing" }}
          />
        ) : undefined
      }
      footer={
        <>
          <button type="button" onClick={onClose} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="quick-attribute-group-form"
            disabled={isSubmitDisabled}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSaving ? t("saving") : isCreatingNewGroup ? t("saveGroup") : t("saveAndSelect")}
          </button>
        </>
      }
    >
      <form id="quick-attribute-group-form" onSubmit={handleSave} className="space-y-4">
        {/* 1. KHỐI THÔNG TIN NHÓM THUỘC TÍNH */}
        <div className="space-y-3 rounded-xl border border-[#E4E4E7] p-3.5">
          {/* Hàng chọn Tên nhóm thuộc tính: có data cũ và option data mới */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="block text-xs font-semibold text-[#09090B]">
                {t("field.groupName")} <span className="text-rose-500">*</span>
              </span>
              {groups.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedGroupKey((prev) =>
                      prev === CREATE_NEW_GROUP_KEY ? groups[0]!.code : CREATE_NEW_GROUP_KEY
                    )
                  }
                  className="text-2xs font-medium text-[#71717A] hover:text-[#09090B] hover:underline cursor-pointer transition-colors"
                >
                  {isCreatingNewGroup ? t("quickAttribute.chooseExisting") : t("quickAttribute.createNew")}
                </button>
              )}
            </div>

            {/* Ô Select chọn nhóm: Liệt kê các nhóm đã có kèm tùy chọn tạo mới */}
            <AdminFilterSelect
              value={selectedGroupKey}
              options={groupSelectOptions}
              onChange={setSelectedGroupKey}
              className="h-10 w-full bg-white"
            />
          </div>

          {/* Nếu chọn tạo nhóm mới: hiện ô nhập tên nhóm mới */}
          {isCreatingNewGroup && (
            <div className="pt-1">
              {lang === "vi" ? (
                <AdminTextField
                  autoFocus
                  required
                  label={`${t("quickAttribute.newGroupName")} (VI)`}
                  value={newGroupName}
                  onValueChange={handleNewGroupNameChange}
                  placeholder={t("field.groupNamePlaceholder")}
                />
              ) : (
                <AdminTextField
                  autoFocus
                  label={`${t("quickAttribute.newGroupName")} (EN)`}
                  value={newGroupNameEn}
                  onValueChange={setNewGroupNameEn}
                  placeholder="VD: Neckline style, Sleeve length..."
                />
              )}
            </div>
          )}

          {/* Hàng 2 cột: Mã định danh nhóm & Mô tả nhóm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {isCreatingNewGroup ? (
              <AdminTextField
                required
                label={t("field.groupCode")}
                value={newGroupCodeTouched ? newGroupCode : autoNewGroupCode}
                onValueChange={(val) => {
                  setNewGroupCodeTouched(true);
                  setNewGroupCode(val.toUpperCase().replace(/\s+/g, "_"));
                }}
                placeholder={t("field.groupCodePlaceholder")}
                inputClassName="font-mono uppercase"
              />
            ) : (
              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#3F3F46]">
                  {t("field.groupCode")}
                </span>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={currentSelectedGroup?.code ?? ""}
                  className="h-9.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F4F4F5] px-3 font-mono text-xs text-[#71717A] cursor-not-allowed outline-none"
                />
              </div>
            )}

            {isCreatingNewGroup ? (
              <AdminTextField
                label={t("field.groupDescription")}
                value={lang === "vi" ? newGroupDescription : newGroupDescriptionEn}
                onValueChange={(val) =>
                  lang === "vi" ? setNewGroupDescription(val) : setNewGroupDescriptionEn(val)
                }
                placeholder={
                  lang === "vi"
                    ? t("field.groupDescriptionPlaceholder")
                    : t("quickAttribute.newGroupDescPlaceholder")
                }
              />
            ) : (
              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-[#3F3F46]">
                  {t("field.groupDescription")}
                </span>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    locale === "en" && currentSelectedGroup?.descriptionEn
                      ? currentSelectedGroup.descriptionEn
                      : currentSelectedGroup?.description || t("quickAttribute.existingGroupDescPlaceholder")
                  }
                  className="h-9.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F4F4F5] px-3 text-xs text-[#71717A] cursor-not-allowed outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. KHỐI THUỘC TÍNH MỚI CẦN THÊM VÀO NHÓM */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#09090B]">
                {t("quickAttribute.newAttributesTitle")}
              </span>
              {isCreatingNewGroup && (
                <span className="text-2xs font-normal text-[#71717A]">{t("quickAttribute.optional")}</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#71717A]">
              {t("quickAttribute.newAttributesHint")}
            </p>
          </div>

          {/* Ô nhập nhanh thuộc tính */}
          <div className="flex gap-2">
            <input
              type="text"
              value={attrInput}
              onChange={(e) => setAttrInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleAddAttr();
                }
              }}
              placeholder={t("field.attributeNamePlaceholder")}
              className="h-9.5 min-w-0 flex-1 rounded-xl border border-[#E4E4E7] bg-white px-3 text-xs text-[#09090B] placeholder:text-[#A1A1AA] outline-none transition-colors hover:border-[#D4D4D8] focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10"
            />
            <AdminButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleAddAttr}
              icon={<Plus size={14} className="shrink-0" />}
              className="shrink-0 whitespace-nowrap"
            >
              {t("quickAttribute.addBtn")}
            </AdminButton>
          </div>

          {/* Danh sách các thuộc tính đã thêm dạng tag chip */}
          {pendingAttributes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {pendingAttributes.map((item, index) => (
                <span
                  key={item.code}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E4E7] bg-[#FAFAFA] pl-3 pr-1.5 py-1 text-xs font-medium text-[#09090B] shadow-2xs"
                >
                  <span>{item.name}</span>
                  <span className="font-mono text-3xs text-[#71717A]">({item.code})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttr(index)}
                    className="grid size-4 cursor-pointer place-items-center rounded-full text-[#A1A1AA] hover:bg-[#E4E4E7] hover:text-[#09090B] transition-colors"
                    title={t("quickAttribute.removeBtn")}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>
    </AdminDialog>
  );
}
