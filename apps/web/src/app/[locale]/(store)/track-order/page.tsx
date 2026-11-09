import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/shared/PageIntro";
import { TrackOrderLookup } from "@/features/orders";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OrdersPage.lookup");
  return { title: t("title"), description: t("subtitle") };
}

/** Tra cứu đơn bằng mã đơn + SĐT/email — công khai, cho cả khách vãng lai */
export default async function TrackOrderPage() {
  const t = await getTranslations("OrdersPage.lookup");
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.orders}>
      <Container as="section">
        <PageIntro eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} className="mb-10" />
        <TrackOrderLookup />
      </Container>
    </ClientMessages>
  );
}
