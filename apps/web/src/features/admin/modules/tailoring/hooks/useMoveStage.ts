"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { updateTailoringStatusAction } from "../actions/tailoring.actions";
import { type MoveStageResult, type TailoringStage } from "../types/tailoring.types";

/**
 * Chuyển công đoạn một món may đo qua Server Action; xong thì báo, gọi `onMoved` để cập nhật tại chỗ rồi tải lại dữ liệu server.
 */
export function useMoveStage(onMoved: (result: MoveStageResult) => void) {
  const t = useTranslations("AdminPage.tailoring");
  const notify = useNotify();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: { itemId: string; stage: TailoringStage; note?: string }) => {
      const res = await updateTailoringStatusAction({ orderItemId: input.itemId, status: input.stage, note: input.note });
      return { input, res };
    },
    onSuccess: ({ input, res }) => {
      if (!res.success) {
        notify.error(res.error, "TAILORING_UPDATE_FAILED");
        return;
      }
      notify.success(t("moved", { stage: t(`stage.${input.stage}`) }));
      onMoved({
        itemId: input.itemId,
        stage: input.stage,
        note: input.note?.trim() || null,
        logId: res.data.logId,
        createdAt: res.data.createdAt,
        staffName: res.data.staffName,
      });
      router.refresh();
    },
    onError: () => notify.error("TAILORING_UPDATE_FAILED"),
  });
}
