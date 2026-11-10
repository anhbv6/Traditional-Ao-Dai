"use client";

import { useState } from "react";
import { Eye, Lock, LockOpen, MoreHorizontal, Phone, Receipt, Users } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminFilterSelect,
  AdminListPanel,
  AdminStatusText,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { useToggleCustomer } from "../../hooks/useToggleCustomer";
import { type AdminCustomerRow, type AdminCustomersData } from "../../types/customers.types";
import {
  CUSTOMER_SEGMENTS,
  CUSTOMER_SORTS,
  compareCustomers,
  customerSegments,
  type CustomerSegment,
  type CustomerSort,
} from "../../utils/customerSegments";
import { CustomerAvatar, LockCustomerDialog, VerifiedMark } from "../shared/CustomerParts";

type Kind = "ACCOUNT" | "GUEST";

/**
 * Màn khách hàng: tab khách có tài khoản / khách vãng lai (đơn không đăng nhập, gom theo SĐT), bảng chuẩn admin,
 * lọc theo nhóm khách tự suy (khách quen, mới, có số đo, còn phải thu, lâu chưa quay lại, đã khóa) và sắp xếp.
 * Hồ sơ đầy đủ của khách có tài khoản ở /admin/customers/[id].
 */
export function CustomersBoard({ data }: { data: AdminCustomersData }) {
  const t = useTranslations("AdminPage.customers");
  const tPage = useTranslations("AdminPage.pages.customers");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const [customers, setCustomers] = useState(data.customers);
  const [kind, setKind] = useState<Kind>("ACCOUNT");
  const [segment, setSegment] = useState<"ALL" | CustomerSegment>("ALL");
  const [sort, setSort] = useState<CustomerSort>("RECENT");
  const [search, setSearch] = useState("");
  const [locking, setLocking] = useState<AdminCustomerRow | null>(null);

  const toggle = useToggleCustomer((patch) => {
    setCustomers((prev) => prev.map((customer) => (customer.id === patch.id ? { ...customer, status: patch.status } : customer)));
    setLocking(null);
  });

  const keyword = search.trim().toLowerCase();
  const digits = keyword.replace(/\D/g, "");
  const ofKind = (value: Kind) => customers.filter((customer) => customer.kind === value);
  const rows = ofKind(kind)
    .filter(
      (customer) =>
        !keyword ||
        [customer.name, customer.email ?? ""].some((value) => value.toLowerCase().includes(keyword)) ||
        (digits.length >= 3 && (customer.phone ?? "").replace(/\D/g, "").includes(digits))
    )
    .filter((customer) => segment === "ALL" || customerSegments(customer, data.now).includes(segment))
    .sort(compareCustomers(sort));

  const vnd = (amount: number) => formatVnd(amount, locale);
  const relative = (iso: string) => format.relativeTime(new Date(iso), new Date(data.now));
  const detailHref = (customer: AdminCustomerRow) =>
    customer.kind === "ACCOUNT" ? `/admin/customers/${customer.id}` : customer.lastOrderId ? `/admin/orders/${customer.lastOrderId}` : null;

  const menuItems = (customer: AdminCustomerRow): AppMenuEntry[] => {
    const href = detailHref(customer);
    return [
      ...(href
        ? [{ key: "view", label: customer.kind === "ACCOUNT" ? t("menu.view") : t("menu.lastOrder"), icon: customer.kind === "ACCOUNT" ? Eye : Receipt, href }]
        : []),
      ...(customer.phone
        ? [{ key: "call", label: t("menu.call"), icon: Phone, onSelect: () => window.open(`tel:${customer.phone}`, "_self") }]
        : []),
      ...(customer.kind === "ACCOUNT" && data.canToggleActive
        ? [
            { type: "separator" as const, key: "sep" },
            {
              key: "lock",
              label: customer.status === "LOCKED" ? t("menu.unlock") : t("menu.lock"),
              icon: customer.status === "LOCKED" ? LockOpen : Lock,
              tone: customer.status === "LOCKED" ? ("default" as const) : ("danger" as const),
              onSelect: () => setLocking(customer),
            },
          ]
        : []),
    ];
  };

  const customerCell = (customer: AdminCustomerRow) => {
    const href = detailHref(customer);
    return (
      <div className="flex min-w-0 items-center gap-3">
        <CustomerAvatar name={customer.name} src={customer.avatarUrl} muted={customer.status === "LOCKED"} />
        <div className="min-w-0">
          {href && customer.kind === "ACCOUNT" ? (
            <Link href={href} className="block truncate font-medium text-[#09090B] hover:underline">
              {customer.name}
            </Link>
          ) : (
            <p className="truncate font-medium text-[#09090B]">{customer.name}</p>
          )}
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-[#71717A]">
            {customer.phone && (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-2xs">
                {customer.phone}
                <VerifiedMark verified={customer.phoneVerified} />
              </span>
            )}
            {customer.phone && customer.email && <span aria-hidden>·</span>}
            {customer.email && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <span className="truncate">{customer.email}</span>
                <VerifiedMark verified={customer.emailVerified} />
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  const ordersCell = (customer: AdminCustomerRow) => (
    <div className="whitespace-nowrap">
      <p className={cn("tabular-nums", customer.ordersCount === 0 ? "text-[#A1A1AA]" : "text-[#09090B]")}>
        {t("orders", { count: customer.ordersCount })}
      </p>
      <p className="mt-0.5 text-xs text-[#71717A]">{customer.lastOrderAt ? relative(customer.lastOrderAt) : t("noOrders")}</p>
    </div>
  );

  const spentCell = (customer: AdminCustomerRow) => (
    <div className="whitespace-nowrap text-right">
      <p className={cn("font-mono font-semibold tabular-nums", customer.spent === 0 ? "text-[#A1A1AA]" : "text-[#09090B]")}>{vnd(customer.spent)}</p>
      {customer.outstanding > 0 && <p className="mt-0.5 text-xs text-amber-700">{t("outstanding", { amount: vnd(customer.outstanding) })}</p>}
    </div>
  );

  const statusCell = (customer: AdminCustomerRow) => {
    const segments = customerSegments(customer, data.now).filter((value) => value !== "LOCKED" && value !== "OUTSTANDING");
    return (
      <div>
        {customer.kind === "GUEST" ? (
          <AdminStatusText tone="neutral">{t("status.GUEST")}</AdminStatusText>
        ) : (
          <AdminStatusText tone={customer.status === "LOCKED" ? "danger" : "success"}>{t(`status.${customer.status}`)}</AdminStatusText>
        )}
        {segments.length > 0 && (
          <p className="mt-1 pl-4 text-xs text-[#71717A]">{segments.map((value) => t(`segment.${value}`)).join(" · ")}</p>
        )}
      </div>
    );
  };

  const columns: AdminTableColumn<AdminCustomerRow>[] = [
    { key: "customer", header: t("column.customer"), cell: customerCell },
    { key: "orders", header: t("column.orders"), className: "hidden w-36 @3xl:table-cell", cell: ordersCell },
    { key: "spent", header: t("column.spent"), align: "right", className: "w-40", cell: spentCell },
    { key: "status", header: t("column.status"), className: "hidden w-52 @4xl:table-cell", cell: statusCell },
  ];

  const segmentOptions = CUSTOMER_SEGMENTS.filter((value) => kind === "ACCOUNT" || (value !== "MEASURED" && value !== "LOCKED" && value !== "NEW"));

  return (
    <>
      <AdminListPanel
        icon={Users}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        filters={
          <>
            <AdminFilterSelect
              label={t("filter.segment")}
              value={segment}
              onChange={setSegment}
              options={[
                { value: "ALL" as const, label: t("filter.all") },
                ...segmentOptions.map((value) => ({ value, label: t(`segment.${value}`) })),
              ]}
              className="w-full sm:w-60"
            />
            <AdminFilterSelect
              label={t("filter.sort")}
              value={sort}
              onChange={setSort}
              options={CUSTOMER_SORTS.map((value) => ({ value, label: t(`sort.${value}`) }))}
              className="w-full sm:w-60"
            />
          </>
        }
      />

      <div role="tablist" aria-label={t("tabsLabel")} className="flex gap-1 border-b border-[#E4E4E7]">
        {(["ACCOUNT", "GUEST"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => {
              setKind(value);
              setSegment("ALL");
            }}
            className={cn(
              "-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-body transition-colors sm:px-4",
              kind === value ? "border-[#18181B] font-semibold text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {t(`tab.${value}`)}
            <span className="font-mono text-xs tabular-nums text-[#71717A]">{ofKind(value).length}</span>
          </button>
        ))}
      </div>

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(customer) => customer.id}
        rowActions={(customer) => (
          <AppMenu
            tone="admin"
            width={232}
            align="end"
            sideOffset={4}
            items={menuItems(customer)}
            trigger={
              <button type="button" aria-label={t("menu.label", { name: customer.name })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("column.actions")}
        minWidth={520}
        empty={ofKind(kind).length === 0 ? t(`empty.${kind}`) : t("noResults")}
        mobileRow={(customer) => (
          <div className="space-y-2.5">
            {customerCell(customer)}
            <div className="flex items-start justify-between gap-3 pl-12">
              {ordersCell(customer)}
              {spentCell(customer)}
            </div>
          </div>
        )}
      />

      {locking && (
        <LockCustomerDialog
          name={locking.name}
          locking={locking.status !== "LOCKED"}
          pending={toggle.isPending}
          onOpenChange={(open) => !open && setLocking(null)}
          onSubmit={(reason) => toggle.mutate({ userId: locking.id, isActive: locking.status === "LOCKED", reason })}
        />
      )}
    </>
  );
}
