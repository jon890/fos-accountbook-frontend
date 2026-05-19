/**
 * 가족 수정 Server Action
 */

"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getFamilies, updateFamily } from "@/services/family/family-service";
import type { Family, UpdateFamilyRequest } from "@/types/family";
import { revalidatePath } from "next/cache";

export async function updateFamilyAction(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<ActionResult<Family>> {
  try {
    await requireAuth();

    if (!familyUuid) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    // 권한 검증: 사용자가 해당 family 멤버인지 확인 (백엔드가 세션 토큰 기준으로 본인 가족만 반환)
    const families = await getFamilies();
    if (!families.some((f) => f.uuid === familyUuid)) {
      throw ActionError.entityNotFound("가족", familyUuid);
    }

    const family = await updateFamily(familyUuid, data);

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath(`/families/${familyUuid}`);

    return successResult(family);
  } catch (error) {
    return handleActionError(error, "가족 정보 수정에 실패했습니다");
  }
}
