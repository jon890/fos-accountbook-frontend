/**
 * 가족 정보 존재 여부 확인 Server Action
 * 여러 페이지에서 공통으로 사용되는 유틸리티 함수
 */

"use server";

import { checkUserFamily } from "@/services/family/family-service";

export async function checkUserFamilyAction(): Promise<{
  hasFamily: boolean;
  familyId?: string;
}> {
  return checkUserFamily();
}
