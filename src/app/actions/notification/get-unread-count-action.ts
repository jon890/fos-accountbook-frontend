"use server";

import { serverApiGet } from "@/lib/server/api/client";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import type { ActionResult } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors/error-code";
import type { UnreadCountResponse } from "@/types/actions/notification";

/**
 * 가족의 읽지 않은 알림 수를 조회합니다.
 */
export async function getUnreadCountAction(
  familyUuid: string
): Promise<ActionResult<number>> {
  try {
    // 인증 확인
    await requireAuth();

    // familyUuid 소유권 검증
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

    // 백엔드 API 호출
    // 백엔드는 { unreadCount: number } 형태로 반환
    const data = await serverApiGet<UnreadCountResponse>(
      `/families/${familyUuid}/notifications/unread-count`
    );

    return {
      success: true,
      data: data.unreadCount ?? 0,
    };
  } catch (error) {
    console.error("[getUnreadCountAction] Error:", error);
    return {
      success: false,
      error: {
        code: ErrorCode.UNREAD_COUNT_FETCH_FAILED,
        message: "읽지 않은 알림 수를 가져오는데 실패했습니다",
      },
    };
  }
}
