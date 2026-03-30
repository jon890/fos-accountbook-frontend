/**
 * 초대 링크 삭제 (취소) Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { deleteInvitation } from "@/services/invitation/invitation-service";
import { revalidatePath } from "next/cache";

export async function deleteInvitationAction(
  invitationUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await deleteInvitation(invitationUuid);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "초대 링크 삭제에 실패했습니다");
  }
}
