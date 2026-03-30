"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import {
  getMonthlyDailyStats,
  type DailyTransactionSummary,
} from "@/services/dashboard/dashboard-service";

export type { DailyTransactionSummary };

/**
 * 월별 일일 수입/지출 합계 조회
 * (API가 없으므로 목록 조회 후 집계)
 */
export async function getMonthlyDailyStatsAction(
  year: number,
  month: number
): Promise<ActionResult<DailyTransactionSummary[]>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const data = await getMonthlyDailyStats(familyUuid, year, month);
    return successResult(data);
  } catch (error) {
    return handleActionError(error, "월별 일일 통계 조회에 실패했습니다");
  }
}
