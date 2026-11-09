"use client";

import { useState } from "react";
import { MoreHorizontal, PencilLine, Plus, Ruler, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ORDER_MEASUREMENT_KEYS } from "@repo/shared/orders";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppDialog } from "@/components/shared/AppDialog";
import { AppMenu } from "@/components/shared/AppMenu";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import { MEASUREMENT_RANGES, MEASUREMENT_SUMMARY_KEYS } from "../../constants/measurements";
import { useMeasurementStore } from "../../store/measurementStore";
import { type MeasurementProfile } from "../../types/profile.types";
import { ProfileSection } from "../ProfileSection";
import { MeasurementDialog } from "./MeasurementDialog";

/**
 * "Số đo của tôi": lưu nhiều bộ số đo (của mình, người thân…) để chọn nhanh khi đặt may đo.
 * Mỗi bộ là một thẻ: tên + nhãn Mặc định, vài số chính, ghi chú; menu ⋯ Sửa / Đặt mặc định / Xóa.
 * Dữ liệu hiện là MOCK trong bộ nhớ (xem store/measurementStore.ts) — tải lại trang sẽ về dữ liệu mẫu.
 */
export function MeasurementsSection() {
  const t = useTranslations("ProfilePage.measurements");
  const notify = useNotify();
  const { profiles, add, update, remove, setDefault } = useMeasurementStore();

  const [editing, setEditing] = useState<MeasurementProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [deleting, setDeleting] = useState<MeasurementProfile | null>(null);

  const openDialog = (profile: MeasurementProfile | null) => {
    setEditing(profile);
    // Mỗi lần mở là một form mới (state khởi tạo từ bộ đang sửa)
    setDialogKey((key) => key + 1);
    setIsDialogOpen(true);
  };

  return (
    <ProfileSection
      title={t("title")}
      description={t("description")}
      action={
        <ActionButton variant="dialog" size="sm" icon={<Plus />} onClick={() => openDialog(null)}>
          {t("add")}
        </ActionButton>
      }
    >
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-[var(--border)] px-6 py-10 text-center">
          <Ruler size={22} strokeWidth={1.4} className="text-[var(--primary-ink)]" aria-hidden="true" />
          <p className="text-sm text-[var(--text-main)]">{t("emptyTitle")}</p>
          <p className="max-w-sm text-xs leading-5 text-[var(--text-light)]">{t("emptyDescription")}</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <MeasurementCard
              key={profile.id}
              profile={profile}
              onEdit={() => openDialog(profile)}
              onSetDefault={() => {
                setDefault(profile.id);
                notify.success(t("defaultUpdated"));
              }}
              onDelete={() => setDeleting(profile)}
            />
          ))}
        </ul>
      )}

      <MeasurementDialog
        key={dialogKey}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        profile={editing}
        isFirst={profiles.length === 0 || (profiles.length === 1 && editing?.id === profiles[0].id)}
        onSave={(input) => {
          if (editing) update(editing.id, input);
          else add(input);
          notify.success(editing ? t("updated") : t("added"));
        }}
      />

      <AppDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        tone="danger"
        icon={Trash2}
        title={t("deleteTitle")}
        description={t("deleteDescription", { name: deleting?.profileName ?? "" })}
        size="sm"
        confirm={{
          label: t("delete"),
          onClick: () => {
            if (deleting) remove(deleting.id);
            notify.success(t("deleted"));
          },
        }}
        cancel={{ label: t("cancel") }}
      />
    </ProfileSection>
  );
}

interface MeasurementCardProps {
  profile: MeasurementProfile;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}

function MeasurementCard({ profile, onEdit, onSetDefault, onDelete }: MeasurementCardProps) {
  const t = useTranslations("ProfilePage.measurements");
  const tLabel = useTranslations("OrdersPage.measurement");
  const filledCount = ORDER_MEASUREMENT_KEYS.filter((key) => profile.values[key] !== undefined).length;
  const summary = MEASUREMENT_SUMMARY_KEYS.filter((key) => profile.values[key] !== undefined);

  return (
    <li
      className={cn(
        "flex flex-col border bg-[var(--bg-main)] p-4 sm:p-5",
        profile.isDefault ? "border-[var(--primary-color)]/50" : "border-[var(--border)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="truncate font-[family-name:var(--font-playfair)] text-base font-semibold text-[var(--text-main)]">
              {profile.profileName}
            </span>
            {profile.isDefault ? (
              <span className="bg-[var(--primary-color)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[1.5px] text-white">
                {t("default")}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-light)]">
            {t("filledCount", { count: filledCount, total: ORDER_MEASUREMENT_KEYS.length })}
          </p>
        </div>
        <AppMenu
          trigger={
            <button
              type="button"
              aria-label={t("actions", { name: profile.profileName })}
              className="-mr-1.5 -mt-1 grid size-8 shrink-0 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
            >
              <MoreHorizontal size={18} strokeWidth={1.6} />
            </button>
          }
          items={[
            { key: "edit", label: t("edit"), icon: PencilLine, onSelect: onEdit },
            ...(profile.isDefault ? [] : [{ key: "default", label: t("setDefault"), icon: Star, onSelect: onSetDefault }]),
            { type: "separator" as const, key: "sep" },
            { key: "delete", label: t("delete"), icon: Trash2, tone: "danger" as const, onSelect: onDelete },
          ]}
        />
      </div>

      {summary.length > 0 ? (
        <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 border-t border-[var(--border)] pt-4">
          {summary.map((key) => (
            <div key={key} className="min-w-0">
              <dt className="truncate text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)]">{tLabel(key)}</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-main)]">
                {profile.values[key]}
                <span className="ml-0.5 text-[11px] font-normal text-[var(--text-light)]">{MEASUREMENT_RANGES[key].unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {profile.note ? <p className="mt-3 line-clamp-2 text-xs italic leading-5 text-[var(--text-light)]">“{profile.note}”</p> : null}
    </li>
  );
}
