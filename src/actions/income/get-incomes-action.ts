"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getIncomes } from "@/services/income/income-service";
import type { GetIncomesParams, GetIncomesResponse } from "@/types/income";

/**
 * 수입 목록 조회 Server Action
 */
export async function getIncomesAction(
  params: GetIncomesParams
): Promise<ActionResult<GetIncomesResponse>> {
  try {
    await requireAuth();
    return successResult(await getIncomes(params));
  } catch (error) {
    return handleActionError(error, "수입 목록 조회에 실패했습니다");
  }
}
