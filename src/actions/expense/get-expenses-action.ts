/**
 * 지출 목록 조회 Server Action
 */

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
import { getExpenses } from "@/services/expense/expense-service";
import type { GetExpensesParams, GetExpensesResponse } from "@/types/expense";

export async function getExpensesAction(
  params: GetExpensesParams
): Promise<ActionResult<GetExpensesResponse>> {
  try {
    await requireAuth();

    const familyId = await getSelectedFamilyUuid();
    if (!familyId) {
      throw ActionError.familyNotSelected();
    }

    const { categoryId, startDate, endDate, page, limit } = params;
    return successResult(await getExpenses(familyId, { categoryId, startDate, endDate, page, limit }));
  } catch (error) {
    return handleActionError(error, "지출 조회에 실패했습니다");
  }
}
