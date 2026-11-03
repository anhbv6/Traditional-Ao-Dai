import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Kho chia thành vải / SKU / lịch sử — URL cũ /admin/inventory đưa về màn SKU */
export default async function AdminInventoryIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/admin/inventory/skus`);
}
