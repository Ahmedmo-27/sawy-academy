import { proxyApiUpload } from "@/lib/server/proxyApiUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 1800;

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; lessonId: string }> }
) {
  const { slug, lessonId } = await context.params;
  return proxyApiUpload(
    request,
    `/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/video`
  );
}
