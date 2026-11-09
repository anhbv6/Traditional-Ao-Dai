import { CustomerOrderDetail } from "@/features/orders";

interface PageProps {
  params: Promise<{ orderCode: string }>;
}

/** Chi tiết + timeline một đơn của khách đã đăng nhập */
export default async function MyOrderDetailPage({ params }: PageProps) {
  const { orderCode } = await params;
  return <CustomerOrderDetail orderCode={decodeURIComponent(orderCode).toUpperCase()} />;
}
