/**
 * 초대 링크 생성 Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import { createInvitationLink } from "@/services/invitation/invitation-service";
import type { InvitationInfo } from "@/types/invitation";

export async function createInvitationLinkAction(): Promise<
  ActionResult<InvitationInfo>
> {
  try {
    await requireAuth();
    const invitation = await createInvitationLink();
    return successResult(invitation);
  } catch (error) {
    return handleActionError(error, "초대 링크 생성에 실패했습니다");
  }
}
