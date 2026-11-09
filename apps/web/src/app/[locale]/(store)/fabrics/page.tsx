import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LOCALES, type Locale } from "@repo/shared";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageIntro } from "@/components/shared/PageIntro";
import { FabricLibrary, fetchFabricLibrary } from "@/features/fabrics";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

interface FabricsPageProps {
  params: Promise<{ locale: string }>;
}

const toLocale = (value: string): Locale => (LOCALES as readonly string[]).includes(value) ? (value as Locale) : "vi";

/** Tiêu đề / mô tả riêng cho Thư mục vải (SEO + chia sẻ mạng xã hội) */
export async function generateMetadata({ params }: FabricsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FabricsPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: { title: t("title"), description: t("description") },
  };
}

/** Thư mục vải: lấy dữ liệu ở server (SEO), phần lọc + xem chi tiết chạy ở client */
export default async function FabricsPage({ params }: FabricsPageProps) {
  const { locale } = await params;
  const [t, materials] = await Promise.all([getTranslations("FabricsPage"), fetchFabricLibrary(toLocale(locale))]);

  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.fabrics}>
      <Container as="section">
        <PageIntro eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} className="mb-12 sm:mb-16" />
        {materials && materials.length > 0 ? (
          <FabricLibrary materials={materials} />
        ) : (
          <EmptyState
            icon={Layers}
            title={materials === null ? t("empty.unavailableTitle") : t("empty.title")}
            description={materials === null ? t("empty.unavailableDescription") : t("empty.description")}
            action={t("empty.action")}
            href="/contact"
          />
        )}
      </Container>
    </ClientMessages>
  );
}
