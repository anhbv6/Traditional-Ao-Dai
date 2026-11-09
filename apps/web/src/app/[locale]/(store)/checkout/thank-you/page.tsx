import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { ThankYouView } from "@/features/orders";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** URL có token đơn: không lập chỉ mục, không lộ qua Referer */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OrdersPage.thankYou");
  return { title: t("eyebrow"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Trang cảm ơn sau khi đặt hàng — đọc lại đơn bằng token nên tải lại trang không mất */
export default async function ThankYouPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.orders}>
      <Container as="section">
        <ThankYouView token={typeof token === "string" ? token : ""} />
      </Container>
    </ClientMessages>
  );
}
