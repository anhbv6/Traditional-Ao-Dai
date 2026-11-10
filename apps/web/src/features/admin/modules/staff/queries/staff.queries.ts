import { prisma } from "../../../core/server/db.server";
import { type StaffActivity, type StaffBoardData, type StaffDetailData, type StaffMemberItem, type StaffRow } from "../types/staff.types";

/** Các trường của một dòng nhân viên (dùng chung cho danh sách và kết quả tạo mới) */
export const STAFF_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  permissions: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

/**
 * Lấy danh sách nhân viên kèm quyền chi tiết (không gồm tài khoản đã xóa)
 */
export async function getStaffListQuery(): Promise<StaffMemberItem[]> {
  try {
    return await prisma.user.findMany({
      where: { role: "STAFF", status: { not: "DELETED" } },
      select: STAFF_MEMBER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Lỗi khi query danh sách nhân viên từ DB:", error);
    throw new Error("STAFF_LIST_FAILED");
  }
}

const DAY = 24 * 60 * 60 * 1000;

/** Số thao tác + lần hoạt động gần nhất (AuditLog do người đó làm + cập nhật công đoạn xưởng) từ một mốc */
async function activityStats(userIds: string[], since: Date) {
  if (userIds.length === 0) return new Map<string, { count: number; last: Date | null }>();
  const [audits, tailoring, lastAudits, lastTailoring] = await Promise.all([
    prisma.auditLog.groupBy({ by: ["actorId"], where: { actorId: { in: userIds }, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.tailoringLog.groupBy({ by: ["staffId"], where: { staffId: { in: userIds }, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.auditLog.groupBy({ by: ["actorId"], where: { actorId: { in: userIds } }, _max: { createdAt: true } }),
    prisma.tailoringLog.groupBy({ by: ["staffId"], where: { staffId: { in: userIds } }, _max: { createdAt: true } }),
  ]);
  const stats = new Map<string, { count: number; last: Date | null }>(userIds.map((id) => [id, { count: 0, last: null }]));
  const bump = (id: string | null, count: number, last: Date | null) => {
    const entry = id ? stats.get(id) : undefined;
    if (!entry) return;
    entry.count += count;
    if (last && (!entry.last || last > entry.last)) entry.last = last;
  };
  audits.forEach((row) => bump(row.actorId, row._count._all, null));
  tailoring.forEach((row) => bump(row.staffId, row._count._all, null));
  lastAudits.forEach((row) => bump(row.actorId, 0, row._max.createdAt));
  lastTailoring.forEach((row) => bump(row.staffId, 0, row._max.createdAt));
  return stats;
}

function toStaffRow(member: StaffMemberItem, stats: { count: number; last: Date | null } | undefined): StaffRow {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    status: member.status === "LOCKED" ? "LOCKED" : "ACTIVE",
    permissions: member.permissions,
    lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
    activity30d: stats?.count ?? 0,
    lastActivityAt: stats?.last?.toISOString() ?? null,
  };
}

/** Màn Nhân sự: danh sách nhân viên kèm số thao tác 30 ngày và lần hoạt động gần nhất */
export async function getStaffBoardQuery(currentUserId: string): Promise<StaffBoardData> {
  const members = await getStaffListQuery();
  const stats = await activityStats(
    members.map((member) => member.id),
    new Date(Date.now() - 30 * DAY)
  );
  return {
    staff: members.map((member) => toStaffRow(member, stats.get(member.id))),
    currentUserId,
    now: new Date().toISOString(),
  };
}

/** Hồ sơ một nhân viên: quyền, phiên đang mở, 30 hoạt động gần nhất */
export async function getStaffDetailQuery(userId: string): Promise<StaffDetailData | null> {
  const member = await prisma.user.findFirst({
    where: { id: userId, role: "STAFF", status: { not: "DELETED" } },
    select: STAFF_MEMBER_SELECT,
  });
  if (!member) return null;

  const now = new Date();
  const [stats, activeSessions, audits, tailoring] = await Promise.all([
    activityStats([userId], new Date(now.getTime() - 30 * DAY)),
    prisma.userSession.count({ where: { userId, kind: "ADMIN", revokedAt: null, expiresAt: { gt: now } } }),
    prisma.auditLog.findMany({
      where: { actorId: userId },
      select: { id: true, action: true, targetType: true, targetId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.tailoringLog.findMany({
      where: { staffId: userId },
      select: { id: true, status: true, createdAt: true, order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  // Thao tác trên đơn: đổi id đơn thành mã đơn để dễ nhận ra
  const orderIds = audits.filter((log) => log.targetType === "ORDER" && log.targetId).map((log) => log.targetId as string);
  const orders = orderIds.length
    ? await prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNumber: true } })
    : [];
  const orderNumber = new Map(orders.map((order) => [order.id, order.orderNumber]));

  const activities: StaffActivity[] = [
    ...audits.map((log) => ({
      id: `audit-${log.id}`,
      source: "AUDIT" as const,
      action: log.action,
      reference: log.targetType === "ORDER" && log.targetId ? (orderNumber.get(log.targetId) ?? null) : null,
      createdAt: log.createdAt.toISOString(),
    })),
    ...tailoring.map((log) => ({
      id: `tailoring-${log.id}`,
      source: "TAILORING" as const,
      action: log.status,
      reference: log.order.orderNumber,
      createdAt: log.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  return {
    ...toStaffRow(member, stats.get(userId)),
    activeSessions,
    activities,
    now: now.toISOString(),
  };
}
