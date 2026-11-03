import { Check, Hammer } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "./adminAuth.server";
import { ADMIN_MODULE_ACCESS, type AdminModule } from "../session/permissions";
import { ADMIN_CARD_CLASS, AdminPage, AdminPageHeader } from "../ui";

/**
 * Khung tạm cho màn đã có trong menu nhưng chưa làm chức năng: vẫn kiểm tra quyền như màn thật
 * và liệt kê phạm vi dự kiến (`AdminPage.pages.<module>.planned`) để thống nhất trước khi xây.
 */
export async function AdminPlaceholderPage({ module }: { module: AdminModule }) {
  await requireAdminPage(ADMIN_MODULE_ACCESS[module]);
  const t = await getTranslations(`AdminPage.pages.${module}`);
  const tPlaceholder = await getTranslations("AdminPage.placeholder");

  const planned: unknown = t.raw("planned");
  const items = Array.isArray(planned) ? planned.filter((item): item is string => typeof item === "string") : [];

  return (
    <AdminPage>
      <AdminPageHeader title={t("title")} description={t("description")} />

      <section className={cn(ADMIN_CARD_CLASS, "p-5 sm:p-6")}>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#F4F4F5] text-[#52525B]">
            <Hammer size={17} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#09090B]">{tPlaceholder("title")}</h2>
            <p className="mt-0.5 text-sm text-[#71717A]">{tPlaceholder("description")}</p>
          </div>
        </div>

        {items.length > 0 && (
          <>
            <h3 className="mt-5 border-t border-[#F4F4F5] pt-4 text-xs font-medium text-[#71717A]">
              {tPlaceholder("planned")}
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#3F3F46]">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#A1A1AA]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </AdminPage>
  );
}
