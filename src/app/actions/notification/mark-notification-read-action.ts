"use server";

import { serverApiPatch } from "@/lib/server/api/client";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";
import type { Notification } from "@/types/actions/notification";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";

/**
 * 알림을 읽음 처리합니다.
 */
export async function markNotificationReadAction(
  familyUuid: string,
  notificationUuid: string
): Promise<ActionResult<Notification>> {
  try {
    // 인증 확인
    await requireAuth();

    // familyUuid 소유권 검증
    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid || familyUuid !== sessionFamilyUuid) {
      return {
        success: false,
        error: {
          code: ErrorCode.NOTIFICATION_READ_FAILED,
          message: "권한이 없습니다.",
        },
      };
    }

    // 백엔드 API 호출
    // TODO: 백엔드 이슈 #74 반영 후 /families/${familyUuid}/notifications/${notificationUuid}/read 로 변경
    const data = await serverApiPatch<Notification>(
      `/notifications/${notificationUuid}/read`
    );

    // 알림 목록 재검증
    revalidatePath("/");

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[markNotificationReadAction] Error:", error);
    return {
      success: false,
      error: {
        code: ErrorCode.NOTIFICATION_READ_FAILED,
        message: "알림 읽음 처리에 실패했습니다",
      },
    };
  }
}
