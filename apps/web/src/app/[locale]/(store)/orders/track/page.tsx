import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/shared/PageIntro";
import { MagicLinkTracking } from "@/features/orders";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Link chứa token đơn: không lập chỉ mục, không gửi URL (kèm token) qua Referer sang trang khác */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OrdersPage.track");
  return { title: t("title"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Magic link theo dõi đơn: `/orders/track?token=…` (token READ, gửi kèm email / SMS sau khi đặt) */
export default async function OrderTrackPage({ searchParams }: PageProps) {
  const t = await getTranslations("OrdersPage.track");
  const { token } = await searchParams;

  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.orders}>
      <Container as="section">
        <PageIntro eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} className="mb-10" />
        <MagicLinkTracking token={typeof token === "string" ? token : ""} />
      </Container>
    </ClientMessages>
  );
}
