"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { serverApiClient } from "@/lib/server/api/client";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { revalidatePath } from "next/cache";

export async function deleteIncomeAction(
  familyUuid: string,
  incomeUuid: string
): Promise<ActionResult<void>> {
  try {
    // 인증 확인
    await requireAuth();

    // familyUuid 소유권 검증
    const sessionFamilyUuid = await getSelectedFamilyUuid();
    if (!sessionFamilyUuid) {
      throw ActionError.familyNotSelected();
    }
    if (familyUuid !== sessionFamilyUuid) {
      throw ActionError.unauthorized("권한이 없습니다.");
    }

    // incomeUuid 검증
    if (!incomeUuid) {
      throw ActionError.invalidInput("incomeUuid", incomeUuid, "필수 값입니다");
    }

    // 백엔드 API 호출
    await serverApiClient(`/families/${familyUuid}/incomes/${incomeUuid}`, {
      method: "DELETE",
    });

    // 페이지 재검증
    revalidatePath("/transactions");
    revalidatePath("/");
    revalidatePath("/analytics");

    return successResult(undefined);
  } catch (error) {
    console.error("Failed to delete income:", error);
    return handleActionError(error, "수입 삭제에 실패했습니다");
  }
}
