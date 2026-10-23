import { headers } from "next/headers";
import { type Prisma } from "@repo/db";
import { prisma } from "./db.server";

export type AuditTargetType = "USER" | "ORDER" | "APPROVAL";

export interface AuditEntry {
  /** Người thực hiện — luôn lấy từ `auth.user.id` của phiên, không nhận từ client */
  actorId: string;
  /** Mã thao tác UPPER_SNAKE_CASE, vd. STAFF_PERMISSIONS_UPDATED */
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  /** Giá trị trước/sau, lý do... — không ghi mật khẩu hay token */
  metadata?: Prisma.InputJsonValue;
}

/**
 * Ghi nhật ký thao tác quản trị. Lỗi ghi log KHÔNG làm hỏng thao tác chính (chỉ log ra server).
 * Gọi SAU khi thao tác nghiệp vụ đã thành công.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const requestHeaders = await headers();
    // Production đặt sau reverse proxy (AGENTS.md §6 quy tắc 11) nên phần tử đầu của X-Forwarded-For là IP thật
    const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Lỗi ghi AuditLog:", error);
  }
}
