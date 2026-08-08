import { VideoAccessFlagDetailPage } from "@/components/admin/VideoAccessFlagDetailPage";

interface AdminVideoAccessFlagDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AdminVideoAccessFlagDetailRoute({
  params,
}: AdminVideoAccessFlagDetailRouteProps) {
  const { id } = await params;
  return <VideoAccessFlagDetailPage id={id} />;
}
