import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  VideoAccessFlag,
  VideoAccessFlagDetail,
  VideoAccessFlagStatus,
} from "@/lib/api/types";

export interface VideoAccessFlagListResponse {
  flags: VideoAccessFlag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function listVideoAccessFlags(
  query: {
    status?: VideoAccessFlagStatus;
    userId?: string;
    lessonId?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  return apiGet<VideoAccessFlagListResponse>(
    "/api/admin/video-access-flags",
    query
  );
}

export function getVideoAccessFlag(flagId: string, logLimit = 50) {
  return apiGet<VideoAccessFlagDetail>(
    `/api/admin/video-access-flags/${encodeURIComponent(flagId)}`,
    { logLimit }
  );
}

export function updateVideoAccessFlag(
  flagId: string,
  update: { status?: VideoAccessFlagStatus; notes?: string }
) {
  return apiPatch<VideoAccessFlag>(
    `/api/admin/video-access-flags/${encodeURIComponent(flagId)}`,
    update
  );
}

export function revokeUserSessionsAdmin(userId: string) {
  return apiPost<{ revokedCount: number }>(
    `/api/admin/users/${encodeURIComponent(userId)}/revoke-sessions`
  );
}
