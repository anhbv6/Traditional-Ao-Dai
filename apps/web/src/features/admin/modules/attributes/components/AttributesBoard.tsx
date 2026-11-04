"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tags, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminListPanel,
} from "@/features/admin/core/ui";
import { deleteAttributeAction, reorderAttributesAction, updateAttributeAction } from "../actions/attributes.actions";
import { type AdminAttributeValue } from "../types/attributes.types";
import { ATTRIBUTE_GROUP_ICONS, ATTRIBUTE_SECTIONS, type AttributeGroup } from "../utils/attributeMeta";
import { ColorPalette, SizeTape, TraitGrid, type ValueHandlers } from "./AttributeValueViews";

const AttributeValueDialog = dynamic(() => import("./AttributeValueDialog").then((m) => m.AttributeValueDialog));

type EditorState = { value: AdminAttributeValue | null };

/**
 * Màn thuộc tính: thanh trái chọn nhóm (biến thể SKU: màu, size · đặc tính thiết kế: cổ, tay, họa tiết, tà, dịp),
 * bên phải hiển thị theo bản chất từng nhóm — bảng màu, thước size, thẻ đặc tính
 */
export function AttributesBoard({ initialValues }: { initialValues: AdminAttributeValue[] }) {
  const t = useTranslations("AdminPage.attributes");
  const tPage = useTranslations("AdminPage.pages.attributes");
  const notify = useNotify();
  const [values, setValues] = useState(initialValues);
  const [group, setGroup] = useState<AttributeGroup>("COLOR");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<AdminAttributeValue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const keyword = search.trim().toLowerCase();
  const groupValues = values.filter((value) => value.group === group);
  const visible = keyword
    ? groupValues.filter((value) =>
        `${value.name} ${value.nameEn ?? ""} ${value.code} ${value.hex ?? ""}`.toLowerCase().includes(keyword)
      )
    : groupValues;
  const countOf = (target: AttributeGroup) => values.filter((value) => value.group === target).length;
  const GroupIcon = ATTRIBUTE_GROUP_ICONS[group];

  const handlers: ValueHandlers = {
    onEdit: (value) => setEditor({ value }),
    onDelete: setDeleting,
    onToggle: async (value) => {
      const res = await updateAttributeAction({
        attributeId: value.id,
        group: value.group,
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
      setValues(res.data.values);
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
      setValues([...values.filter((item) => item.group !== group), ...ordered]);
      const res = await reorderAttributesAction({ group, orderedIds: ordered.map((item) => item.id) });
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
      setValues(res.data.values);
      setDeleting(null);
      notify.success(t("deleteDialog.success"));
    } finally {
      setIsDeleting(false);
    }
  };

  const viewProps = { values: visible, reorderDisabled: keyword.length > 0, ...handlers };

  return (
    <>
      <AdminListPanel
        icon={Tags}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("addValue", { group: t(`group.${group}.label`).toLowerCase() }), onClick: () => setEditor({ value: null }) }}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[232px_minmax(0,1fr)]">
        {/* Màn nhỏ: dải chip cuộn ngang; từ lg: thanh dọc dính khi cuộn */}
        <nav aria-label={t("groupsLabel")} className={cn(ADMIN_CARD_CLASS, "min-w-0 p-2 lg:sticky lg:top-6")}>
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {ATTRIBUTE_SECTIONS.map((section, sectionIndex) => (
              <div key={section.key} className="flex shrink-0 gap-1 lg:flex-col">
                {sectionIndex > 0 && (
                  <span aria-hidden className="mx-1 my-2 hidden border-t border-dashed border-[#E4E4E7] lg:block" />
                )}
                <p className="hidden px-2.5 pb-1 pt-1.5 text-xs font-medium text-[#71717A] lg:block">
                  {t(`section.${section.key}`)}
                </p>
                {section.groups.map((item) => {
                  const Icon = ATTRIBUTE_GROUP_ICONS[item];
                  const active = item === group;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setGroup(item)}
                      className={cn(
                        "flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                        active ? "bg-[#F4F4F5] font-medium text-[#09090B]" : "text-[#52525B] hover:bg-[#FAFAFA]"
                      )}
                    >
                      <Icon size={15} className={active ? "text-[#09090B]" : "text-[#A1A1AA]"} aria-hidden />
                      <span className="whitespace-nowrap lg:flex-1 lg:text-left">{t(`group.${item}.label`)}</span>
                      <span className="font-mono text-2xs tabular-nums text-[#A1A1AA]">{countOf(item)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <section className="min-w-0 space-y-4">
          <header className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#E4E4E7] bg-white text-[#52525B]">
              <GroupIcon size={16} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#09090B]">{t(`group.${group}.label`)}</h2>
              <p className="text-xs text-[#71717A]">{t(`group.${group}.hint`)}</p>
            </div>
          </header>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E4E4E7] bg-white py-14 text-center text-sm text-[#71717A]">
              {keyword ? t("noResults") : t("empty")}
            </p>
          ) : group === "COLOR" ? (
            <ColorPalette {...viewProps} />
          ) : group === "SIZE" ? (
            <SizeTape {...viewProps} />
          ) : (
            <TraitGrid {...viewProps} />
          )}
        </section>
      </div>

      {editor && (
        <AttributeValueDialog
          key={editor.value?.id ?? `new-${group}`}
          group={group}
          value={editor.value}
          onOpenChange={(open) => !open && setEditor(null)}
          onSaved={setValues}
        />
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
