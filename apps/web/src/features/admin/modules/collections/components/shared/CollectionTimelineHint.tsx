"use client";

import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type AdminCollectionItem } from "../../types/collections.types";
import { daysUntil } from "../../utils/collectionLifecycle";

/** Một dòng mốc thời gian theo vòng đời; quá mốc thì tô amber để nhắc chuyển trạng thái */
export function CollectionTimelineHint({
  collection,
  className,
}: {
  collection: Pick<AdminCollectionItem, "status" | "launchAt" | "endAt" | "archivedAt" | "showInLookbook">;
  className?: string;
}) {
  const t = useTranslations("AdminPage.collections.timeline");
  const format = useFormatter();
  const date = (value: string) =>
    format.dateTime(new Date(value), { day: "2-digit", month: "2-digit", year: "numeric" });

  let text = t("draft");
  let warn = false;

  if (collection.status === "COMING_SOON" && collection.launchAt) {
    const days = daysUntil(collection.launchAt);
    warn = days <= 0;
    text = days > 0 ? t("launchIn", { count: days, date: date(collection.launchAt) }) : t("launchReached");
  } else if (collection.status === "ACTIVE") {
    if (collection.endAt) {
      const days = daysUntil(collection.endAt);
      warn = days < 0;
      text = days >= 0 ? t("endIn", { count: days, date: date(collection.endAt) }) : t("endPassed");
    } else {
      text = t("selling");
    }
  } else if (collection.status === "ARCHIVED") {
    text = collection.showInLookbook ? t("inLookbook") : t("hidden");
  }

  return <span className={cn("truncate", warn ? "text-amber-700" : "text-[#71717A]", className)}>{text}</span>;
}
