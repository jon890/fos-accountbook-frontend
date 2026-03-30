/**
 * 활성 초대 링크 목록 조회 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { getActiveInvitations } from "@/services/invitation/invitation-service";
import type { InvitationInfo } from "@/types/invitation";

export async function getActiveInvitationsAction(): Promise<
  ActionResult<InvitationInfo[]>
> {
  try {
    await requireAuth();
    const invitations = await getActiveInvitations();
    return successResult(invitations);
  } catch (error) {
    return handleActionError(error, "초대 목록을 불러오는데 실패했습니다");
  }
}
