import { ServiceDetailPage } from "@/components/admin/ServiceDetailPage";

interface AdminServiceDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AdminServiceDetailRoute({
  params,
}: AdminServiceDetailRouteProps) {
  const { id } = await params;
  return <ServiceDetailPage id={id} />;
}
