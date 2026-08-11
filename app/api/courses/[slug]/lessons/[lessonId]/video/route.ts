import { proxyApiUpload } from "@/lib/server/proxyApiUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby max is 300s; Pro/Enterprise can raise this for large uploads.
export const maxDuration = 300;

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
