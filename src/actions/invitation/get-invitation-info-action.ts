/**
 * 초대 정보 조회 (토큰으로) Server Action
 */

"use server";

import {
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  getInvitationInfo,
  type InvitationInfoData,
} from "@/services/invitation/invitation-service";

export type { InvitationInfoData };

export async function getInvitationInfoAction(
  token: string
): Promise<ActionResult<InvitationInfoData>> {
  try {
    const info = await getInvitationInfo(token);
    return successResult(info);
  } catch (error) {
    return handleActionError(error, "초대 정보를 가져오는데 실패했습니다");
  }
}
