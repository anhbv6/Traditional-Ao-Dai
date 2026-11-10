import { normalizeVietnamPhone, toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import {
  CUSTOMER_MEASUREMENT_KEYS,
  type AdminCustomerDetail,
  type AdminCustomerRow,
  type AdminCustomersData,
  type CustomerMeasurementProfile,
} from "../types/customers.types";
import { summarizeOrders } from "../utils/customerSegments";

/** Chặn số khách / đơn vãng lai tải về (lọc, tìm ở client) */
const MAX_ACCOUNTS = 1000;
const MAX_GUEST_ORDERS = 3000;

const orderMoneySelect = { id: true, orderStatus: true, totalAmount: true, paidAmount: true, createdAt: true } as const;

function toMoneyOrders(orders: { id: string; orderStatus: string; totalAmount: { toString(): string }; paidAmount: { toString(): string }; createdAt: Date }[]) {
  return orders.map((order) => ({
    id: order.id,
    orderStatus: order.orderStatus,
    totalAmount: toVnd(order.totalAmount),
    paidAmount: toVnd(order.paidAmount),
    createdAt: order.createdAt.toISOString(),
  }));
}

function lastOrderIdOf(orders: { id: string; createdAt: string }[]): string | null {
  return orders.reduce<{ id: string; createdAt: string } | null>((latest, order) => (!latest || order.createdAt > latest.createdAt ? order : latest), null)
    ?.id ?? null;
}

/**
 * Khách có tài khoản (vai trò CUSTOMER, chưa xóa) + khách vãng lai (đơn không gắn tài khoản, gom theo SĐT chuẩn hóa).
 * Số liệu tiền tính từ đơn: đã chi = tiền đã thu thật, còn phải thu = phần chưa thu của đơn chưa đóng.
 */
export async function getAdminCustomersQuery(canToggleActive: boolean): Promise<AdminCustomersData> {
  const [users, guestOrders] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER", status: { not: "DELETED" } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        orders: { select: orderMoneySelect },
        _count: { select: { measurements: true } },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_ACCOUNTS,
    }),
    prisma.order.findMany({
      where: { userId: null },
      select: { ...orderMoneySelect, customerName: true, customerPhone: true, customerEmail: true },
      orderBy: { createdAt: "desc" },
      take: MAX_GUEST_ORDERS,
    }),
  ]);

  const accounts: AdminCustomerRow[] = users.map((user) => {
    const orders = toMoneyOrders(user.orders);
    return {
      id: user.id,
      kind: "ACCOUNT",
      name: user.name ?? user.email ?? user.phone ?? "",
      email: user.email,
      phone: user.phone,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      avatarUrl: user.avatarUrl,
      status: user.status === "LOCKED" ? "LOCKED" : "ACTIVE",
      measurementCount: user._count.measurements,
      createdAt: user.createdAt.toISOString(),
      lastOrderId: lastOrderIdOf(orders),
      ...summarizeOrders(orders),
    };
  });

  // Vãng lai: cùng SĐT là cùng một khách; tên / email lấy theo đơn mới nhất (đơn đã xếp mới nhất trước)
  const groups = new Map<string, typeof guestOrders>();
  for (const order of guestOrders) {
    const key = normalizeVietnamPhone(order.customerPhone) ?? order.customerPhone.trim();
    groups.set(key, [...(groups.get(key) ?? []), order]);
  }
  const guests: AdminCustomerRow[] = [...groups.entries()].map(([phone, orders]) => {
    const money = toMoneyOrders(orders);
    const latest = orders[0];
    const first = orders[orders.length - 1];
    return {
      id: `guest:${phone}`,
      kind: "GUEST",
      name: latest.customerName,
      email: latest.customerEmail || null,
      phone,
      emailVerified: false,
      phoneVerified: false,
      avatarUrl: null,
      status: "ACTIVE",
      measurementCount: 0,
      createdAt: first.createdAt.toISOString(),
      lastOrderId: latest.id,
      ...summarizeOrders(money),
    };
  });

  return { customers: [...accounts, ...guests], canToggleActive, now: new Date().toISOString() };
}

/** Hồ sơ một khách có tài khoản: đơn, số đo, địa chỉ, thông tin tài khoản */
export async function getAdminCustomerDetailQuery(userId: string, canToggleActive: boolean): Promise<AdminCustomerDetail | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER", status: { not: "DELETED" } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      avatarUrl: true,
      status: true,
      gender: true,
      birthDate: true,
      lastLoginAt: true,
      lockedAt: true,
      lockedReason: true,
      createdAt: true,
      socialAccounts: { select: { provider: true } },
      orders: {
        select: {
          ...orderMoneySelect,
          orderNumber: true,
          isTailored: true,
          items: { select: { productName: true, quantity: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      measurements: { orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] },
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!user) return null;

  const orders = user.orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    totalAmount: toVnd(order.totalAmount),
    paidAmount: toVnd(order.paidAmount),
    isTailored: order.isTailored,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    firstItemName: order.items[0]?.productName ?? "",
    createdAt: order.createdAt.toISOString(),
  }));

  const measurements: CustomerMeasurementProfile[] = user.measurements.map((profile) => {
    const values: CustomerMeasurementProfile["values"] = {};
    for (const key of CUSTOMER_MEASUREMENT_KEYS) {
      const value = profile[key];
      if (value !== null) values[key] = value;
    }
    return {
      id: profile.id,
      profileName: profile.profileName,
      isDefault: profile.isDefault,
      values,
      note: profile.note,
      updatedAt: profile.updatedAt.toISOString(),
    };
  });

  return {
    id: user.id,
    kind: "ACCOUNT",
    name: user.name ?? user.email ?? user.phone ?? "",
    email: user.email,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    avatarUrl: user.avatarUrl,
    status: user.status === "LOCKED" ? "LOCKED" : "ACTIVE",
    measurementCount: measurements.length,
    createdAt: user.createdAt.toISOString(),
    lastOrderId: orders[0]?.id ?? null,
    ...summarizeOrders(orders),
    gender: user.gender,
    birthDate: user.birthDate?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    lockedAt: user.lockedAt?.toISOString() ?? null,
    lockedReason: user.lockedReason,
    hasGoogle: user.socialAccounts.some((account) => account.provider === "GOOGLE"),
    orders,
    measurements,
    addresses: user.addresses.map((address) => ({
      id: address.id,
      label: address.label,
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      line: [address.addressLine, address.wardName, address.districtName, address.provinceName].filter(Boolean).join(", "),
      isDefault: address.isDefault,
    })),
    canToggleActive,
    now: new Date().toISOString(),
  };
}
