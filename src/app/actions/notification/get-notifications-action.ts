"use server";

import { serverApiGet } from "@/lib/server/api/client";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import type { NotificationListResponse } from "@/types/actions/notification";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 가족의 알림 목록을 조회합니다.
 */
export async function getNotificationsAction(
  familyUuid: string
): Promise<ActionResult<NotificationListResponse>> {
  try {
    // 인증 확인
    await requireAuth();

    // 백엔드 API 호출
    const data = await serverApiGet<NotificationListResponse>(
      `/families/${familyUuid}/notifications`
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[getNotificationsAction] Error:", error);
    return {
      success: false,
      error: {
        code: ErrorCode.NOTIFICATION_FETCH_FAILED,
        message: "알림 목록을 가져오는데 실패했습니다",
      },
    };
  }
}
