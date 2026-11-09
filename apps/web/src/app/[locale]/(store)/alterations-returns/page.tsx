import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { PageIntro } from "@/components/shared/PageIntro";
import { AfterSalesExperience } from "@/features/after-sales";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

interface AlterationsReturnsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AlterationsReturnsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AfterSalesPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: { title: t("title"), description: t("description") },
  };
}

/** Sửa đồ & Đổi trả — chính sách hậu mãi + gửi yêu cầu (công khai, xác minh bằng mã đơn + SĐT/email) */
export default async function AlterationsReturnsPage() {
  const t = await getTranslations("AfterSalesPage");
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.afterSales}>
      <Container as="section">
        <PageIntro eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} className="mb-12 sm:mb-16" />
        <AfterSalesExperience />
      </Container>
    </ClientMessages>
  );
}
