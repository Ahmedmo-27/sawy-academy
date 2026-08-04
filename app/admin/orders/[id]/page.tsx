import { OrderDetailPage } from "@/components/admin/OrderDetailPage";

interface AdminOrderDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailRoute({
  params,
}: AdminOrderDetailRouteProps) {
  const { id } = await params;
  return <OrderDetailPage id={id} />;
}
