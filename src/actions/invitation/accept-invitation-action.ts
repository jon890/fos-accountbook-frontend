/**
 * 초대 수락 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { acceptInvitation } from "@/services/invitation/invitation-service";
import { revalidatePath } from "next/cache";

export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await acceptInvitation(token);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "초대 수락에 실패했습니다");
  }
}
