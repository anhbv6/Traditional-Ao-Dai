"use client";

import { useState, type ReactNode } from "react";
import { Lock, LockOpen, Phone, Scissors, Star } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
  AdminStatusText,
  type AdminStatusTone,
} from "@/features/admin/core/ui";
import { useToggleCustomer } from "../../hooks/useToggleCustomer";
import { CUSTOMER_MEASUREMENT_KEYS, type AdminCustomerDetail } from "../../types/customers.types";
import { customerSegments } from "../../utils/customerSegments";
import { CustomerAvatar, LockCustomerDialog, VerifiedMark } from "../shared/CustomerParts";

const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY = 24 * 60 * 60 * 1000;

const ORDER_TONE: Record<string, AdminStatusTone> = {
  PENDING: "warning",
  DELIVERED: "success",
  CANCELLED: "danger",
};

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#71717A]">{label}</span>
      <span className="min-w-0 text-right text-[#09090B]">{children}</span>
    </div>
  );
}

/** Số ngày tới sinh nhật kế tiếp (theo ngày / tháng) — tiệm áo dài hay gửi lời chúc / ưu đãi dịp này */
function daysToBirthday(birthDate: string, now: string): number {
  const birth = new Date(birthDate);
  const today = new Date(now);
  const next = new Date(Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (next.getTime() < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) next.setUTCFullYear(next.getUTCFullYear() + 1);
  return Math.round((next.getTime() - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / DAY);
}

/**
 * Hồ sơ khách: đơn hàng (mở thẳng đơn), hồ sơ số đo (để may đo lại không cần đo lại), địa chỉ;
 * cột phải tổng quan mua hàng, liên hệ (kèm sinh nhật sắp tới), tài khoản (khóa có lý do — chỉ Super Admin).
 */
export function CustomerDetail({ data }: { data: AdminCustomerDetail }) {
  const t = useTranslations("AdminPage.customers");
  const tOrders = useTranslations("AdminPage.orders");
  const tm = useTranslations("AdminPage.measurements");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const [customer, setCustomer] = useState(data);
  const [lockOpen, setLockOpen] = useState(false);
  const toggle = useToggleCustomer((patch) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
    setLockOpen(false);
  });

  const vnd = (amount: number) => formatVnd(amount, locale);
  const day = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "numeric", year: "numeric", timeZone: SHOP_TIME_ZONE });
  const relative = (iso: string) => format.relativeTime(new Date(iso), new Date(customer.now));
  const segments = customerSegments(customer, customer.now).filter((value) => value !== "LOCKED");
  const locked = customer.status === "LOCKED";
  const birthdayIn = customer.birthDate ? daysToBirthday(customer.birthDate, customer.now) : null;
  const average = customer.activeOrders > 0 ? Math.round(customer.spent / customer.activeOrders) : 0;

  return (
    <>
      <AdminDetailHeader
        backHref="/admin/customers"
        backLabel={t("detail.back")}
        title={customer.name}
        icon={<CustomerAvatar name={customer.name} src={customer.avatarUrl} muted={locked} />}
        badge={<AdminStatusText tone={locked ? "danger" : "success"}>{t(`status.${customer.status}`)}</AdminStatusText>}
        subtitle={[t("detail.since", { date: day(customer.createdAt) }), ...segments.map((value) => t(`segment.${value}`))].join(" · ")}
        actions={
          <>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                <Phone size={15} aria-hidden /> {t("menu.call")}
              </a>
            )}
            {customer.canToggleActive && (
              <button type="button" onClick={() => setLockOpen(true)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                {locked ? <LockOpen size={15} aria-hidden /> : <Lock size={15} aria-hidden />}
                {locked ? t("menu.unlock") : t("menu.lock")}
              </button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Card title={t("detail.orders", { count: customer.ordersCount })}>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-[#A1A1AA]">{t("noOrders")}</p>
            ) : (
              <ul className="divide-y divide-dashed divide-[#E4E4E7]">
                {customer.orders.map((order) => {
                  const remaining = Math.max(0, order.totalAmount - order.paidAmount);
                  const closed = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
                  return (
                    <li key={order.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm font-semibold text-[#09090B] hover:underline">
                            {order.orderNumber}
                          </Link>
                          {order.isTailored && <Scissors size={12} className="text-[#71717A]" aria-label={tOrders("tailored")} />}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#71717A]">
                          {day(order.createdAt)} · {order.firstItemName}
                          {order.itemCount > 1 && ` · ${tOrders("itemCount", { count: order.itemCount })}`}
                        </p>
                        <div className="mt-1 text-xs">
                          <AdminStatusText tone={ORDER_TONE[order.orderStatus] ?? "neutral"}>{tOrders(`status.${order.orderStatus}`)}</AdminStatusText>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn("font-mono text-sm font-semibold tabular-nums", closed ? "text-[#A1A1AA] line-through" : "text-[#09090B]")}>
                          {vnd(order.totalAmount)}
                        </p>
                        {!closed && remaining > 0 && <p className="mt-0.5 text-xs text-amber-700">{t("outstanding", { amount: vnd(remaining) })}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title={t("detail.measurements")}>
            {customer.measurements.length === 0 ? (
              <p className="text-sm text-[#A1A1AA]">{t("detail.noMeasurements")}</p>
            ) : (
              <div className="space-y-5">
                {customer.measurements.map((profile) => {
                  const keys = CUSTOMER_MEASUREMENT_KEYS.filter((key) => profile.values[key] !== undefined);
                  return (
                    <div key={profile.id}>
                      <p className="mb-2 flex flex-wrap items-center gap-x-2 text-body font-semibold text-[#09090B]">
                        {profile.profileName}
                        {profile.isDefault && (
                          <span className="inline-flex items-center gap-1 text-xs font-normal text-[#71717A]">
                            <Star size={11} aria-hidden /> {t("detail.defaultProfile")}
                          </span>
                        )}
                        <span className="text-xs font-normal text-[#A1A1AA]">{t("detail.updated", { time: relative(profile.updatedAt) })}</span>
                      </p>
                      {keys.length > 0 ? (
                        <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-[#E4E4E7] sm:grid-cols-3 lg:grid-cols-4">
                          {keys.map((key) => (
                            <div key={key} className="-mb-px -mr-px border-b border-r border-[#E4E4E7] px-3 py-2.5">
                              <dt className="text-xs text-[#71717A]">{tm(key)}</dt>
                              <dd className="mt-0.5 font-mono text-body font-semibold tabular-nums text-[#09090B]">
                                {format.number(profile.values[key] ?? 0, { maximumFractionDigits: 1 })}
                                <span className="ml-1 font-sans text-xs font-normal text-[#71717A]">{key === "weight" ? "kg" : "cm"}</span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-sm text-[#A1A1AA]">{t("detail.emptyProfile")}</p>
                      )}
                      {profile.note && <p className="mt-2 rounded-lg bg-[#FAFAFA] px-3 py-2 text-sm text-[#3F3F46]">{profile.note}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title={t("detail.addresses")}>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-[#A1A1AA]">{t("detail.noAddresses")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="rounded-xl border border-[#E4E4E7] p-3 text-sm">
                    <p className="flex items-center justify-between gap-2 font-medium text-[#09090B]">
                      {address.label ?? address.receiverName}
                      {address.isDefault && <span className="text-xs font-normal text-[#71717A]">{t("detail.defaultAddress")}</span>}
                    </p>
                    <p className="mt-1 text-[#3F3F46]">
                      {address.receiverName} · <span className="font-mono text-xs">{address.receiverPhone}</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">{address.line}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <Card title={t("detail.overview")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.spent")}>
                <span className="font-mono font-semibold tabular-nums">{vnd(customer.spent)}</span>
              </InfoRow>
              <InfoRow label={t("detail.activeOrders")}>{customer.activeOrders}</InfoRow>
              <InfoRow label={t("detail.average")}>{average > 0 ? vnd(average) : "—"}</InfoRow>
              <InfoRow label={t("detail.lastOrder")}>{customer.lastOrderAt ? relative(customer.lastOrderAt) : "—"}</InfoRow>
              {customer.outstanding > 0 && (
                <InfoRow label={t("detail.outstanding")}>
                  <span className="font-mono tabular-nums text-amber-700">{vnd(customer.outstanding)}</span>
                </InfoRow>
              )}
            </div>
          </Card>

          <Card title={t("detail.contact")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.phone")}>
                {customer.phone ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs">
                    {customer.phone} <VerifiedMark verified={customer.phoneVerified} />
                  </span>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow label={t("detail.email")}>
                {customer.email ? (
                  <span className="inline-flex items-center gap-1 break-all">
                    {customer.email} <VerifiedMark verified={customer.emailVerified} />
                  </span>
                ) : (
                  "—"
                )}
              </InfoRow>
              {customer.gender && <InfoRow label={t("detail.gender")}>{t(`gender.${customer.gender}`)}</InfoRow>}
              {customer.birthDate && (
                <InfoRow label={t("detail.birthday")}>
                  {format.dateTime(new Date(customer.birthDate), { day: "numeric", month: "numeric", timeZone: "UTC" })}
                  {birthdayIn !== null && birthdayIn <= 30 && (
                    <span className="block text-xs text-emerald-700">{birthdayIn === 0 ? t("detail.birthdayToday") : t("detail.birthdayIn", { days: birthdayIn })}</span>
                  )}
                </InfoRow>
              )}
            </div>
          </Card>

          <Card title={t("detail.account")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.login")}>{customer.hasGoogle ? t("detail.loginGoogle") : t("detail.loginPassword")}</InfoRow>
              <InfoRow label={t("detail.lastLogin")}>{customer.lastLoginAt ? relative(customer.lastLoginAt) : "—"}</InfoRow>
              {locked && customer.lockedAt && <InfoRow label={t("detail.lockedAt")}>{day(customer.lockedAt)}</InfoRow>}
            </div>
            {locked && customer.lockedReason && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{customer.lockedReason}</p>
            )}
          </Card>
        </aside>
      </div>

      {lockOpen && (
        <LockCustomerDialog
          name={customer.name}
          locking={!locked}
          pending={toggle.isPending}
          onOpenChange={setLockOpen}
          onSubmit={(reason) => toggle.mutate({ userId: customer.id, isActive: locked, reason })}
        />
      )}
    </>
  );
}
