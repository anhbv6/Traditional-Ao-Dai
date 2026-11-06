"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminListPanel,
} from "@/features/admin/core/ui";
import {
  deleteAttributeAction,
  deleteAttributeGroupAction,
  reorderAttributesAction,
  updateAttributeAction,
} from "../actions/attributes.actions";
import { type AdminAttributeData, type AdminAttributeGroup, type AdminAttributeValue } from "../types/attributes.types";
import { isVariantGroup, localizedGroup } from "../utils/attributeMeta";
import { AttributeGroupIcon } from "./AttributeGroupIcon";
import { ColorPalette, SizeTape, TraitGrid, type ValueHandlers } from "./AttributeValueViews";

const AttributeValueDialog = dynamic(() => import("./AttributeValueDialog").then((m) => m.AttributeValueDialog));
const AttributeGroupDialog = dynamic(() => import("./AttributeGroupDialog").then((m) => m.AttributeGroupDialog));

type EditorState = { value: AdminAttributeValue | null };
/** Đang mở dialog nhóm: sửa `group`, hoặc thêm nhóm mới (`group` null) */
type GroupEditorState = { group: AdminAttributeGroup | null };

/**
 * Màn thuộc tính: thanh trái chọn nhóm (biến thể SKU: màu, size · đặc tính thiết kế: cổ, tay, họa tiết, tà, dịp và các
 * nhóm admin tự thêm — nút "Thêm nhóm thuộc tính" cuối thanh), bên phải hiển thị theo bản chất từng nhóm — bảng màu,
 * thước size, thẻ đặc tính. Menu ⋯ cạnh tên nhóm: sửa nhóm, xóa nhóm (chỉ nhóm tự thêm và đã trống).
 */
export function AttributesBoard({ initialData }: { initialData: AdminAttributeData }) {
  const t = useTranslations("AdminPage.attributes");
  const tPage = useTranslations("AdminPage.pages.attributes");
  const notify = useNotify();
  const locale = useLocale();
  const [groups, setGroups] = useState(initialData.groups);
  const [values, setValues] = useState(initialData.values);
  const [groupId, setGroupId] = useState(() => initialData.groups[0]?.id ?? "");
  const [groupEditor, setGroupEditor] = useState<GroupEditorState | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<AdminAttributeGroup | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<AdminAttributeValue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const keyword = search.trim().toLowerCase();
  // Nhóm đang chọn bị xóa → quay về nhóm đầu
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const groupValues = group ? values.filter((value) => value.groupId === group.id) : [];
  const visible = keyword
    ? groupValues.filter((value) =>
        `${value.name} ${value.nameEn ?? ""} ${value.code} ${value.hex ?? ""}`.toLowerCase().includes(keyword)
      )
    : groupValues;
  const countOf = (target: AdminAttributeGroup) => values.filter((value) => value.groupId === target.id).length;
  const sections = [
    { key: "variant", groups: groups.filter((item) => isVariantGroup(item.code)) },
    { key: "design", groups: groups.filter((item) => !isVariantGroup(item.code)) },
  ] as const;

  /** Lưu xong ở dialog / action — thay cả nhóm lẫn giá trị */
  const applyData = (data: AdminAttributeData) => {
    setGroups(data.groups);
    setValues(data.values);
  };

  const handlers: ValueHandlers = {
    onEdit: (value) => setEditor({ value }),
    onDelete: setDeleting,
    onToggle: async (value) => {
      const res = await updateAttributeAction({
        attributeId: value.id,
        groupId: value.groupId,
        code: value.code,
        name: value.name,
        nameEn: value.nameEn ?? "",
        description: value.description ?? "",
        descriptionEn: value.descriptionEn ?? "",
        hex: value.hex ?? "",
        family: value.family ?? "",
        isActive: !value.isActive,
      });
      if (!res.success) {
        notify.error(res.error, "ATTRIBUTE_UPDATE_FAILED");
        return;
      }
      applyData(res.data);
      notify.success(value.isActive ? t("hiddenSuccess") : t("shownSuccess"));
    },
    onMove: async (value, direction) => {
      const index = groupValues.findIndex((item) => item.id === value.id);
      const target = groupValues[index + direction];
      if (!target) return;
      const ordered = [...groupValues];
      ordered.splice(index, 1);
      ordered.splice(index + direction, 0, value);
      // Cập nhật lạc quan, lỗi thì trả lại như cũ
      const previous = values;
      setValues([...values.filter((item) => item.groupId !== value.groupId), ...ordered]);
      const res = await reorderAttributesAction({ groupId: value.groupId, orderedIds: ordered.map((item) => item.id) });
      if (!res.success) {
        setValues(previous);
        notify.error(res.error, "ATTRIBUTE_UPDATE_FAILED");
      }
    },
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteAttributeAction({ attributeId: deleting.id });
      if (!res.success) {
        notify.error(res.error, "ATTRIBUTE_DELETE_FAILED");
        return;
      }
      applyData(res.data);
      setDeleting(null);
      notify.success(t("deleteDialog.success"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setIsDeleting(true);
    try {
      const res = await deleteAttributeGroupAction({ groupId: deletingGroup.id });
      if (!res.success) {
        notify.error(res.error, "ATTRIBUTE_GROUP_DELETE_FAILED");
        return;
      }
      applyData(res.data);
      setGroupId(res.data.groups[0]?.id ?? "");
      setDeletingGroup(null);
      notify.success(t("groupDialog.deleted"));
    } finally {
      setIsDeleting(false);
    }
  };

  const groupMenu = (target: AdminAttributeGroup): AppMenuEntry[] => [
    { key: "edit", label: t("groupMenu.edit"), icon: Pencil, onSelect: () => setGroupEditor({ group: target }) },
    // Nhóm hệ thống (màu, size, đặc tính có sẵn) không xóa được; nhóm tự thêm phải trống mới xóa
    ...(target.isSystem
      ? []
      : [
          { type: "separator" as const, key: "sep" },
          {
            key: "delete",
            label: t("groupMenu.delete"),
            description: target.valueCount > 0 ? t("groupMenu.deleteBlocked") : undefined,
            icon: Trash2,
            tone: "danger" as const,
            disabled: target.valueCount > 0,
            onSelect: () => setDeletingGroup(target),
          },
        ]),
  ];

  const current = group ? localizedGroup(group, locale) : null;

  const viewProps = { values: visible, reorderDisabled: keyword.length > 0, ...handlers };

  return (
    <>
      <AdminListPanel
        icon={Tags}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={
          current
            ? { label: t("addValue", { group: current.name.toLowerCase() }), onClick: () => setEditor({ value: null }) }
            : undefined
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[232px_minmax(0,1fr)]">
        {/* Màn nhỏ: dải chip cuộn ngang; từ lg: thanh dọc dính khi cuộn */}
        <nav aria-label={t("groupsLabel")} className={cn(ADMIN_CARD_CLASS, "min-w-0 p-2 lg:sticky lg:top-6")}>
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sections.map((section, sectionIndex) => (
              <div key={section.key} className="flex shrink-0 gap-1 lg:flex-col">
                {sectionIndex > 0 && (
                  <span aria-hidden className="mx-1 my-2 hidden border-t border-dashed border-[#E4E4E7] lg:block" />
                )}
                <p className="hidden px-2.5 pb-1 pt-1.5 text-xs font-medium text-[#71717A] lg:block">
                  {t(`section.${section.key}`)}
                </p>
                {section.groups.map((item) => {
                  const active = item.id === group?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setGroupId(item.id)}
                      className={cn(
                        "flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                        active ? "bg-[#F4F4F5] font-medium text-[#09090B]" : "text-[#52525B] hover:bg-[#FAFAFA]"
                      )}
                    >
                      <AttributeGroupIcon
                        code={item.code}
                        size={15}
                        className={active ? "text-[#09090B]" : "text-[#A1A1AA]"}
                        aria-hidden
                      />
                      <span className="whitespace-nowrap lg:flex-1 lg:truncate lg:text-left">
                        {localizedGroup(item, locale).name}
                      </span>
                      <span className="font-mono text-2xs tabular-nums text-[#A1A1AA]">{countOf(item)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {/* Thêm thuộc tính cha mới — luôn là nhóm đặc tính thiết kế */}
            <button
              type="button"
              onClick={() => setGroupEditor({ group: null })}
              className="flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-[#D4D4D8] px-2.5 text-sm text-[#52525B] transition-colors hover:border-[#A1A1AA] hover:text-[#09090B] lg:mt-1"
            >
              <Plus size={15} aria-hidden />
              <span className="whitespace-nowrap">{t("addGroup")}</span>
            </button>
          </div>
        </nav>

        <section className="min-w-0 space-y-4">
          <header className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#E4E4E7] bg-white text-[#52525B]">
              <AttributeGroupIcon code={group?.code ?? ""} size={16} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#09090B]">{current?.name}</h2>
              {current?.description && <p className="text-xs text-[#71717A]">{current.description}</p>}
            </div>
            {group && (
              <AppMenu
                tone="admin"
                width={232}
                align="end"
                sideOffset={4}
                items={groupMenu(group)}
                trigger={
                  <button
                    type="button"
                    aria-label={t("groupMenu.label", { name: current?.name ?? "" })}
                    className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "ml-auto")}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                }
              />
            )}
          </header>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E4E4E7] bg-white py-14 text-center text-sm text-[#71717A]">
              {keyword ? t("noResults") : t("empty")}
            </p>
          ) : group?.code === "COLOR" ? (
            <ColorPalette {...viewProps} />
          ) : group?.code === "SIZE" ? (
            <SizeTape {...viewProps} />
          ) : (
            <TraitGrid {...viewProps} />
          )}
        </section>
      </div>

      {editor && group && (
        <AttributeValueDialog
          key={editor.value?.id ?? `new-${group.id}`}
          group={group}
          value={editor.value}
          onOpenChange={(open) => !open && setEditor(null)}
          onSaved={applyData}
        />
      )}

      {groupEditor && (
        <AttributeGroupDialog
          key={groupEditor.group?.id ?? "new-group"}
          group={groupEditor.group}
          onOpenChange={(open) => !open && setGroupEditor(null)}
          onSaved={(data, savedId) => {
            applyData(data);
            setGroupId(savedId);
          }}
        />
      )}

      {deletingGroup && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && setDeletingGroup(null)}
          icon={Trash2}
          tone="danger"
          size="sm"
          title={t("groupDialog.deleteTitle")}
          description={t("deleteDialog.description", { name: localizedGroup(deletingGroup, locale).name })}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteGroup}
                className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}
              >
                {isDeleting ? t("processing") : t("deleteDialog.confirm")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#52525B]">{t("groupDialog.deleteBody")}</p>
        </AdminDialog>
      )}

      {deleting && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          icon={Trash2}
          tone="danger"
          size="sm"
          title={t("deleteDialog.title")}
          description={t("deleteDialog.description", { name: deleting.name })}
          footer={
            <>
              <button type="button" onClick={() => setDeleting(null)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}
              >
                {isDeleting ? t("processing") : t("deleteDialog.confirm")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#52525B]">{t("deleteDialog.body")}</p>
        </AdminDialog>
      )}
    </>
  );
}
