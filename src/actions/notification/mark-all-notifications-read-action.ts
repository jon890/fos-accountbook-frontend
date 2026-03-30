"use server";

import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { markAllNotificationsRead } from "@/services/notification/notification-service";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 가족의 모든 알림을 읽음 처리합니다.
 */
export async function markAllNotificationsReadAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid || familyUuid !== sessionFamilyUuid) {
      return {
        success: false,
        error: {
          code: ErrorCode.NOTIFICATION_MARK_ALL_READ_FAILED,
          message: "권한이 없습니다.",
        },
      };
    }

    await markAllNotificationsRead(familyUuid);
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: {
        code: ErrorCode.NOTIFICATION_MARK_ALL_READ_FAILED,
        message: "모든 알림 읽음 처리에 실패했습니다",
      },
    };
  }
}
