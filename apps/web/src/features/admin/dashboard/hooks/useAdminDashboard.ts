"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/hooks/useNotify";
import {
  getDashboardKpisAction,
  getLowFabricsAction,
  getPipelineAction,
  getTodayAppointmentsAction,
  hideFabricProductAction,
  moveOrderStageAction,
} from "../actions/dashboard.actions";
import { type LowFabric, type PipelineCard, type PipelineStage } from "../types/dashboard.types";

// Số ngày còn lại / giờ hẹn đã qua tính lúc tải → làm mới định kỳ để luôn đúng trong ngày
const REFRESH_MS = 5 * 60 * 1000;

const KEYS = {
  kpis: ["admin", "dashboard", "kpis"],
  pipeline: ["admin", "dashboard", "pipeline"],
  appointments: ["admin", "dashboard", "appointments"],
  fabrics: ["admin", "dashboard", "fabrics"],
} as const;

export interface DashboardAccess {
  /** Kanban, đơn gấp, lịch hẹn, số áo trên bàn may */
  operations: boolean;
  /** Cảnh báo kho vải */
  inventory: boolean;
}

/** Kết quả Server Action → dữ liệu hoặc ném mã lỗi để React Query / useNotify xử lý */
function unwrap<T>(res: { success: true; data: T } | { success: false; error?: string }): T {
  if (!res.success) throw new Error(res.error || "DEFAULT_ERROR");
  return res.data;
}

export function useAdminDashboard(access: DashboardAccess) {
  const queryClient = useQueryClient();
  const notify = useNotify();

  const kpisQuery = useQuery({
    queryKey: KEYS.kpis,
    queryFn: async () => unwrap(await getDashboardKpisAction()),
  });

  const pipelineQuery = useQuery({
    queryKey: KEYS.pipeline,
    enabled: access.operations,
    refetchInterval: REFRESH_MS,
    queryFn: async () => unwrap(await getPipelineAction()),
  });

  const appointmentsQuery = useQuery({
    queryKey: KEYS.appointments,
    enabled: access.operations,
    refetchInterval: REFRESH_MS,
    queryFn: async () => unwrap(await getTodayAppointmentsAction()),
  });

  const fabricsQuery = useQuery({
    queryKey: KEYS.fabrics,
    enabled: access.inventory,
    queryFn: async () => unwrap(await getLowFabricsAction()),
  });

  // Chuyển cột Kanban: cập nhật ngay trên giao diện, lỗi thì trả lại vị trí cũ
  const moveStage = useMutation({
    mutationFn: async ({ orderId, stage }: { orderId: string; stage: PipelineStage }) => {
      const res = await moveOrderStageAction(orderId, stage);
      if (!res.success) throw new Error(res.error);
    },
    onMutate: async ({ orderId, stage }) => {
      await queryClient.cancelQueries({ queryKey: KEYS.pipeline });
      const previous = queryClient.getQueryData<PipelineCard[]>(KEYS.pipeline);
      queryClient.setQueryData<PipelineCard[]>(KEYS.pipeline, (cards) =>
        cards?.map((card) => (card.orderId === orderId ? { ...card, stage } : card))
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(KEYS.pipeline, context?.previous);
      notify.error(error, "ORDER_STATUS_UPDATE_FAILED");
    },
    onSettled: () => {
      // Công đoạn áo + số liệu thẻ đổi theo → tải lại từ server
      void queryClient.invalidateQueries({ queryKey: KEYS.pipeline });
      void queryClient.invalidateQueries({ queryKey: KEYS.kpis });
    },
  });

  const hideProduct = useMutation({
    mutationFn: async (productId: string) => {
      const res = await hideFabricProductAction(productId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, productId) => {
      queryClient.setQueryData<LowFabric[]>(KEYS.fabrics, (fabrics) =>
        fabrics?.map((f) => (f.product?.id === productId ? { ...f, product: { ...f.product, isActive: false } } : f))
      );
    },
    onError: (error) => notify.error(error, "PRODUCT_UPDATE_FAILED"),
  });

  return {
    kpis: kpisQuery.data,
    isLoadingKpis: kpisQuery.isPending,
    pipeline: pipelineQuery.data ?? [],
    isLoadingPipeline: pipelineQuery.isPending && access.operations,
    appointments: appointmentsQuery.data ?? [],
    isLoadingAppointments: appointmentsQuery.isPending && access.operations,
    fabrics: fabricsQuery.data ?? [],
    isLoadingFabrics: fabricsQuery.isPending && access.inventory,
    moveStage: (orderId: string, stage: PipelineStage) => moveStage.mutate({ orderId, stage }),
    hideProduct: (productId: string) => hideProduct.mutate(productId),
    hidingProductId: hideProduct.isPending ? hideProduct.variables : null,
  };
}
