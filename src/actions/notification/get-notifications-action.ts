"use server";

import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getNotifications } from "@/services/notification/notification-service";
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
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid || familyUuid !== sessionFamilyUuid) {
      return {
        success: false,
        error: {
          code: ErrorCode.NOTIFICATION_FETCH_FAILED,
          message: "권한이 없습니다.",
        },
      };
    }

    const data = await getNotifications(familyUuid);
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: {
        code: ErrorCode.NOTIFICATION_FETCH_FAILED,
        message: "알림 목록을 가져오는데 실패했습니다",
      },
    };
  }
}
