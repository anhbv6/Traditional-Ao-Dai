"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, AlertTriangle, UserCheck, RefreshCw, FileText } from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { ADMIN_ACTION_ACCESS, canAccess, useAdminSession } from "../../session";
import { AdminPageHeader, AdminSecondaryButton, AdminSegmentedControl } from "../../ui";
import {
  getApprovalRequestsAction,
  reviewApprovalRequestAction,
} from "../actions";
import { type ApprovalRequestItem } from "../types";
import { type ApprovalStatus } from "@repo/db";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";

export function AdminApprovalsList() {
  const { user } = useAdminSession({ force: true });
  // Chỉ Super Admin được duyệt/từ chối; STAFF chỉ xem yêu cầu của chính mình (server cũng lọc theo người gửi)
  const canReview = canAccess(user, ADMIN_ACTION_ACCESS.reviewApproval);
  const notify = useNotify();
  const tToast = useTranslations("AdminPage.toasts");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Dữ liệu server -> React Query (không tự fetch trong useEffect)
  const { data: requests = [], isFetching: isLoading, refetch } = useQuery({
    queryKey: ["admin", "approvals", statusFilter],
    queryFn: async () => {
      const filter = statusFilter === "ALL" ? undefined : (statusFilter as ApprovalStatus);
      const res = await getApprovalRequestsAction(filter);
      if (!res.success) {
        notify.error(res.error, "APPROVAL_LIST_FAILED");
        return [];
      }
      return (res.data ?? []) as ApprovalRequestItem[];
    },
  });
  const fetchRequests = () => void refetch();

  const handleApprove = async (id: string) => {
    if (!user) return;
    setIsProcessing(true);
    const res = await reviewApprovalRequestAction({
      requestId: id,
      status: "APPROVED",
      reviewedById: user.id,
    });

    if (res.success) {
      notify.success(tToast("approveSuccess"));
      fetchRequests();
    } else {
      notify.error(res.error, "APPROVAL_REVIEW_FAILED");
    }
    setIsProcessing(false);
  };

  const handleReject = async (id: string) => {
    if (!user || !rejectReason.trim()) {
      showToast.error(tToast("rejectReasonRequired"));
      return;
    }
    setIsProcessing(true);
    const res = await reviewApprovalRequestAction({
      requestId: id,
      status: "REJECTED",
      reviewedById: user.id,
      rejectReason: rejectReason.trim(),
    });

    if (res.success) {
      notify.success(tToast("rejectSuccess"));
      setRejectingId(null);
      setRejectReason("");
      fetchRequests();
    } else {
      notify.error(res.error, "APPROVAL_REVIEW_FAILED");
    }
    setIsProcessing(false);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CANCEL_ORDER":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Hủy đơn hàng</span>;
      case "SPECIAL_DISCOUNT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Giảm giá vượt trần</span>;
      case "PRICE_OVERRIDE":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Chỉnh sửa đơn giá</span>;
      case "REFUND":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Hoàn tiền khách</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">{action}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} />
            <span>Chờ duyệt</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            <span>Đã duyệt</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} />
            <span>Từ chối</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={UserCheck}
        eyebrow="Kiểm soát nội bộ"
        title={canReview ? "Hàng Đợi Phê Duyệt" : "Yêu Cầu Phê Duyệt Của Tôi"}
        description={
          canReview
            ? "Duyệt các thao tác nhạy cảm do nhân viên gửi lên (hủy đơn, giảm giá đặc biệt, hoàn tiền)."
            : "Theo dõi trạng thái các yêu cầu hủy đơn / hoàn tiền / giảm giá bạn đã gửi lên Super Admin."
        }
        actions={
          <>
            <AdminSegmentedControl
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "PENDING", label: "Chờ duyệt" },
                { value: "APPROVED", label: "Đã duyệt" },
                { value: "REJECTED", label: "Từ chối" },
              ]}
            />
            <AdminSecondaryButton onClick={fetchRequests} disabled={isLoading} title="Làm mới">
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Làm mới</span>
            </AdminSecondaryButton>
          </>
        }
      />

      {/* Requests List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E4E4E7] p-12 text-center text-sm text-[#71717A]">
          <RefreshCw size={24} className="animate-spin mx-auto text-zinc-400 mb-3" />
          <p>Đang tải dữ liệu hàng đợi phê duyệt...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E4E4E7] p-12 text-center text-[#71717A]">
          <FileText size={32} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-700">Không có yêu cầu phê duyệt nào</p>
          <p className="text-xs text-zinc-400 mt-1">Các thao tác do nhân viên gửi lên sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-2xs hover:shadow-2xs transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {getActionBadge(req.actionType)}
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-zinc-400">
                    {new Date(req.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="text-xs text-zinc-600">
                  Người yêu cầu: <strong className="text-[#09090B] font-semibold">{req.requestedBy?.name || req.requestedBy?.email}</strong>
                </div>
              </div>

              <div className="py-3 text-sm text-zinc-800">
                <p className="font-medium">{req.description}</p>
                {req.payload && (
                  <div className="mt-2 p-3 bg-zinc-50 rounded-xl text-xs font-mono text-zinc-600 border border-zinc-100 overflow-x-auto">
                    {JSON.stringify(req.payload, null, 2)}
                  </div>
                )}
              </div>

              {req.status === "REJECTED" && req.rejectReason && (
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start gap-2 mb-3">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span><strong>Lý do từ chối:</strong> {req.rejectReason}</span>
                </div>
              )}

              {/* Action Buttons for PENDING */}
              {canReview && req.status === "PENDING" && (
                <div className="pt-2 flex items-center justify-end gap-2">
                  {rejectingId === req.id ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Nhập lý do từ chối..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-xs border border-zinc-300 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:border-rose-500 outline-none"
                      />
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="px-3 py-1.5 border border-[#E4E4E7] text-zinc-600 hover:bg-zinc-100 rounded-lg text-xs cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setRejectingId(req.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-[#18181B] hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        Phê duyệt yêu cầu
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
