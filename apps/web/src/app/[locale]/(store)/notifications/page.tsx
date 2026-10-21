import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { NotificationsExperience } from "@/features/notifications";
import { ClientMessages, CLIENT_NAMESPACES } from "@/i18n/ClientMessages";

interface NotificationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NotificationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NotificationsPage.meta" });
  return { title: t("title"), description: t("description") };
}

/** Trang Thông báo của khách hàng — khung giống Yêu thích / Giỏ hàng; proxy đã chặn khi chưa đăng nhập (giống /profile) */
export default function NotificationsPage() {
  return (
    <ClientMessages namespaces={CLIENT_NAMESPACES.notifications}>
      <Container as="section" width="full">
        <NotificationsExperience />
      </Container>
    </ClientMessages>
  );
}
