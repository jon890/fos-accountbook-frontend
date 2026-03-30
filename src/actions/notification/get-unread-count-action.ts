"use server";

import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getUnreadCount } from "@/services/notification/notification-service";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 가족의 읽지 않은 알림 수를 조회합니다.
 */
export async function getUnreadCountAction(
  familyUuid: string
): Promise<ActionResult<number>> {
  try {
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid || familyUuid !== sessionFamilyUuid) {
      return {
        success: false,
        error: {
          code: ErrorCode.UNREAD_COUNT_FETCH_FAILED,
          message: "권한이 없습니다.",
        },
      };
    }

    const count = await getUnreadCount(familyUuid);
    return { success: true, data: count };
  } catch {
    return {
      success: false,
      error: {
        code: ErrorCode.UNREAD_COUNT_FETCH_FAILED,
        message: "읽지 않은 알림 수를 가져오는데 실패했습니다",
      },
    };
  }
}
