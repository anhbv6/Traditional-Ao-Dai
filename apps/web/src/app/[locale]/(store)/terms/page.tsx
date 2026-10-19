import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { TermsContent } from "@/features/terms";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TermsPage.meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

/** Trang cấp 1 (từ footer / form đăng ký) — không cần breadcrumb. Không đặt overflow-hidden để mục lục sticky được */
export default function TermsPage() {
  return (
    <Container as="section" spacing="section" className="pt-(--page-y)">
      <TermsContent />
    </Container>
  );
}
