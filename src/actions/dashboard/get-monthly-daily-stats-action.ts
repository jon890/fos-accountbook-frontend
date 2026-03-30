"use server";

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
export async function getMonthlyDailyStatsAction(year: number, month: number) {
  await requireAuth();

  const familyUuid = await getSelectedFamilyUuid();
  if (!familyUuid) {
    return { success: false, error: "가족이 선택되지 않았습니다.", data: [] };
  }

  try {
    const data = await getMonthlyDailyStats(familyUuid, year, month);
    return { success: true, data };
  } catch {
    return { success: false, error: "데이터 조회 실패", data: [] };
  }
}
