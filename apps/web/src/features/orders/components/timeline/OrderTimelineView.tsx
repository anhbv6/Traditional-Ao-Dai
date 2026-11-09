"use client";

import Image from "next/image";
import { CalendarClock, Camera, Lock, MapPin, PenLine, Ruler, Scissors } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode } from "react";
import { formatVnd, type Locale } from "@repo/shared";
import { ORDER_MEASUREMENT_KEYS, type OrderTimelineDto } from "@repo/shared/orders";
import { cn } from "@/lib/utils";
import { type OrderEditState } from "../../hooks/useOrderEdit";
import { OrderAmounts } from "./OrderAmounts";
import { OrderEditDialog } from "./OrderEditDialog";
import { PaymentQrCard } from "./PaymentQrCard";
import { TrackingStepper } from "./TrackingStepper";

/** Thẻ nội dung cùng kiểu storefront: viền mảnh, tiêu đề in hoa nhỏ */
export function TimelineCard({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-(--border) bg-(--bg-card) p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--primary-ink)">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] uppercase tracking-[1.5px] text-(--text-light) transition-colors hover:text-(--primary-ink) focus-visible:outline-2 focus-visible:outline-(--ring)"
    >
      <PenLine size={12} strokeWidth={1.6} aria-hidden="true" />
      {label}
    </button>
  );
}

interface OrderTimelineViewProps {
  order: OrderTimelineDto;
  /** Có khi mở từ magic link → cho sửa số đo / địa chỉ qua OTP. Không có (trang tài khoản) → chỉ xem */
  edit?: OrderEditState;
  /** Nút bổ sung ở cuối khối địa chỉ / số đo khi chỉ xem (VD "Sửa qua link xác minh" ở trang tài khoản) */
  readOnlyAction?: ReactNode;
}

/**
 * Timeline đầy đủ của một đơn (magic link + trang đơn hàng của khách đã đăng nhập):
 * stepper 5 bước → nhật ký xưởng (kèm ảnh) → lịch thử áo → sản phẩm & số đo → địa chỉ → tiền + QR còn phải chuyển.
 */
export function OrderTimelineView({ order, edit, readOnlyAction }: OrderTimelineViewProps) {
  const t = useTranslations("OrdersPage");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const date = (iso: string) => format.dateTime(new Date(iso), { day: "2-digit", month: "2-digit", year: "numeric" });
  const dateTime = (iso: string) =>
    format.dateTime(new Date(iso), { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Đầu đơn */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--border) pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[2.5px] text-(--text-light)">{t("timeline.orderCode")}</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-wider text-(--primary-ink)">{order.orderCode}</p>
          <p className="mt-1 text-xs text-(--text-light)">
            {t("timeline.placedOn", { date: date(order.createdAt) })}
            {order.dueDate ? ` · ${t("timeline.dueDate", { date: date(order.dueDate) })}` : null}
          </p>
        </div>
        <span className="border border-(--primary-color)/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--primary-ink)">
          {t(`status.${order.orderStatus}`)}
        </span>
      </div>

      {order.isTailored ? (
        <TimelineCard title={t("timeline.progressTitle")} icon={<Scissors size={14} strokeWidth={1.6} aria-hidden="true" />}>
          <TrackingStepper progress={order.progress} stepDates={order.stepDates} />
        </TimelineCard>
      ) : null}

      {order.payment ? <PaymentQrCard payment={order.payment} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {order.isTailored ? (
            <TimelineCard title={t("timeline.workshopTitle")} icon={<Camera size={14} strokeWidth={1.6} aria-hidden="true" />}>
              {order.events.length === 0 ? (
                <p className="text-sm leading-6 text-(--text-light)">{t("timeline.workshopEmpty")}</p>
              ) : (
                <ol className="space-y-5 border-l border-(--border) pl-5">
                  {[...order.events].reverse().map((event) => (
                    <li key={event.id} className="relative">
                      <span aria-hidden="true" className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-(--primary-color)" />
                      <p className="text-sm font-semibold">
                        {t(`tailoringStatus.${event.status}`)}
                        {event.itemName ? <span className="font-normal text-(--text-light)"> · {event.itemName}</span> : null}
                      </p>
                      <p className="text-xs tabular-nums text-(--text-light)">{dateTime(event.createdAt)}</p>
                      {event.note ? <p className="mt-1 text-sm leading-6">{event.note}</p> : null}
                      {event.images.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {event.images.map((src) => (
                            <a key={src} href={src} target="_blank" rel="noreferrer" aria-label={t("timeline.viewPhoto")}>
                              <Image src={src} alt={t("timeline.photoAlt")} width={96} height={128} className="aspect-3/4 w-24 border border-(--border) object-cover" />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </TimelineCard>
          ) : null}

          <TimelineCard title={t("timeline.itemsTitle")} icon={<Ruler size={14} strokeWidth={1.6} aria-hidden="true" />}>
            <ul className="divide-y divide-(--border)">
              {order.items.map((item) => {
                const measured = ORDER_MEASUREMENT_KEYS.filter((key) => item.measurements[key] !== undefined);
                return (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex gap-4">
                      {item.image ? (
                        <Image src={item.image} alt={item.productName} width={64} height={85} className="aspect-3/4 w-16 shrink-0 object-cover" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-5">{item.productName}</p>
                        {item.variantName ? <p className="mt-0.5 text-xs leading-5 text-(--text-light)">{item.variantName}</p> : null}
                        <p className="mt-1 text-xs tabular-nums text-(--text-light)">
                          {t("timeline.lineQuantity", { count: item.quantity, price: formatVnd(item.unitPrice, locale) })}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatVnd(item.totalPrice, locale)}</p>
                    </div>

                    {item.isCustomFit ? (
                      <div className="mt-3 bg-(--bg-secondary)/60 p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-(--text-light)">{t("timeline.measurementsTitle")}</p>
                          {edit && item.canEditMeasurements ? (
                            <EditButton label={t("timeline.editMeasurements")} onClick={() => edit.open({ kind: "measurements", itemId: item.id })} />
                          ) : !item.canEditMeasurements ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-(--text-light)">
                              <Lock size={11} aria-hidden="true" /> {t("timeline.measurementsLocked")}
                            </span>
                          ) : null}
                        </div>
                        {measured.length > 0 ? (
                          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                            {measured.map((key) => (
                              <div key={key} className="flex justify-between gap-2">
                                <dt className="text-(--text-light)">{t(`measurement.${key}`)}</dt>
                                <dd className="tabular-nums">
                                  {item.measurements[key]} {key === "weight" ? "kg" : "cm"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p className="mt-2 text-xs leading-5 text-(--text-light)">{t("timeline.measureAtStudio")}</p>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </TimelineCard>
        </div>

        <div className="space-y-6">
          <TimelineCard
            title={t("timeline.addressTitle")}
            icon={<MapPin size={14} strokeWidth={1.6} aria-hidden="true" />}
            action={edit && order.canEditAddress ? <EditButton label={t("timeline.editAddress")} onClick={() => edit.open({ kind: "address" })} /> : null}
          >
            <p className="text-sm font-semibold">{order.customerName}</p>
            <p className="text-xs text-(--text-light)">{order.maskedPhone}</p>
            <p className="mt-1 text-sm leading-6">{order.shippingAddress}</p>
            {!order.canEditAddress ? <p className="mt-2 text-xs text-(--text-light)">{t("timeline.addressLocked")}</p> : null}
          </TimelineCard>

          {order.appointments.length > 0 ? (
            <TimelineCard title={t("timeline.appointmentsTitle")} icon={<CalendarClock size={14} strokeWidth={1.6} aria-hidden="true" />}>
              <ul className="space-y-3">
                {order.appointments.map((appointment) => (
                  <li key={appointment.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold">{t(`appointmentType.${appointment.type}`)}</p>
                      <p className="text-xs tabular-nums text-(--text-light)">{dateTime(appointment.scheduledAt)}</p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[1.5px] text-(--text-light)">{t(`appointmentStatus.${appointment.status}`)}</span>
                  </li>
                ))}
              </ul>
            </TimelineCard>
          ) : null}

          <TimelineCard title={t("timeline.amountsTitle")}>
            <OrderAmounts amounts={order.amounts} paymentMethod={order.paymentMethod} />
            <p className="mt-3 text-xs text-(--text-light)">
              {t("timeline.paymentLine", {
                method: t(`paymentMethod.${order.paymentMethod}`),
                status: t(`paymentStatus.${order.paymentStatus}`),
              })}
            </p>
          </TimelineCard>

          {!edit && readOnlyAction ? readOnlyAction : null}
        </div>
      </div>

      {edit ? <OrderEditDialog order={order} edit={edit} /> : null}
    </div>
  );
}
