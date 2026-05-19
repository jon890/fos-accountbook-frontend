# Phase 02 — category/create session 비교 + invitation/delete entity ownership

**Model**: sonnet
**Status**: pending
**Goal**: `createCategoryAction` 에 session 비교 검증 추가 (Single-family 패턴 A, ADR-F25). `deleteInvitationAction` 에 entity ownership 검증 추가 (패턴 C). 두 곳 모두 클라이언트가 본인 외 가족 UUID 주입 시 차단.

## Context (자기완결)

### category/create

현재 `src/actions/category/create-category-action.ts:54`:
```ts
const selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());
```
→ `familyUuid` prop 이 truthy 면 session 무시. 클라이언트 주입 가능.

`updateExpenseAction` (L50-56) 의 session 비교 패턴 적용 필요.

### invitation/delete

현재 `src/actions/invitation/delete-invitation-action.ts:16-26`:
```ts
export async function deleteInvitationAction(invitationUuid: string) {
  await requireAuth();
  await deleteInvitation(invitationUuid);
  // ...
}
```
→ invitationUuid 의 family 소속 검증 없음. backend 가 막아도 frontend 이중 방어 부재.

해결: `getActiveInvitations` 또는 invitation entity 조회 → 본인 가족 invitation 인지 확인 후 삭제.

## 작업 항목

### 1. `createCategoryAction` session 비교 (패턴 A)

`src/actions/category/create-category-action.ts` L54 교체:

```ts
// 변경 전
const selectedFamilyUuid = familyUuid || (await getSelectedFamilyUuid());
if (!selectedFamilyUuid) {
  throw ActionError.familyNotSelected();
}

// 변경 후
const sessionFamilyUuid = await getSelectedFamilyUuid();
if (!sessionFamilyUuid) {
  throw ActionError.familyNotSelected();
}
if (familyUuid && familyUuid !== sessionFamilyUuid) {
  throw ActionError.invalidInput(
    "familyUuid",
    familyUuid,
    "권한이 없습니다"
  );
}
const selectedFamilyUuid = sessionFamilyUuid;
```

세션 가족 UUID 를 단일 진실 소스로. prop 은 옵션 (호환성 유지) 이지만 세션과 불일치 시 reject.

호출처 영향: 기존 호출처에서 `familyUuid` 가 항상 세션과 일치하면 동작 변경 없음. 불일치 케이스가 있다면 호출처에서 prop 제거 또는 일치하는 값 전달 (구현 시 grep 으로 호출처 확인 + 필요 시 정리).

### 2. `deleteInvitationAction` entity ownership (패턴 C)

`src/actions/invitation/delete-invitation-action.ts` 갱신:

```ts
"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import { requireAuth } from "@/lib/server/auth/auth-helpers";
import {
  deleteInvitation,
  getActiveInvitations,
} from "@/services/invitation/invitation-service";
import { revalidatePath } from "next/cache";

export async function deleteInvitationAction(
  invitationUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    // Entity ownership: 본인 가족의 active invitation 목록에 포함되는지 확인
    const active = await getActiveInvitations();
    if (!active.some((inv) => inv.uuid === invitationUuid)) {
      throw ActionError.entityNotFound("초대 링크", invitationUuid);
    }

    await deleteInvitation(invitationUuid);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "초대 링크 삭제에 실패했습니다");
  }
}
```

`getActiveInvitations` 는 백엔드가 세션 기준 본인 가족의 invitation 만 반환 (이미 신뢰 경계) → list 에 있다는 사실이 권한 증거. 다른 가족 invitation UUID 주입 시 `entityNotFound`.

`getActiveInvitations` 의 반환 타입에 `uuid` 필드가 없으면 `getInvitationsByFamily(familyUuid)` 같은 대안 helper 검토 — 구현 시 service signature 확인.

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan023-server-action-permission-audit

pnpm lint
pnpm tsc --noEmit
pnpm build

# category/create session 비교 패턴
grep -nE 'sessionFamilyUuid|familyUuid !== ' \
  src/actions/category/create-category-action.ts | wc -l   # >= 2

# category/create 의 prop fallback 제거
! grep -n 'familyUuid || (await getSelectedFamilyUuid' \
  src/actions/category/create-category-action.ts

# invitation/delete entity 검증
grep -nE 'getActiveInvitations|entityNotFound.*invitation|some.*invitationUuid' \
  src/actions/invitation/delete-invitation-action.ts | wc -l   # >= 1
```

수동 smoke:
- 카테고리 생성 (현재 가족) → 정상
- 카테고리 생성 (devtools 로 다른 가족 UUID prop 주입) → "권한이 없습니다" error toast
- 초대 링크 삭제 (본인 가족) → 정상
- 초대 링크 삭제 (다른 가족 invitation UUID 주입) → "초대 링크를 찾을 수 없습니다" error toast

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/actions/category/create-category-action.ts` | session 비교 추가 |
| `src/actions/invitation/delete-invitation-action.ts` | entity ownership 검증 추가 |

## Out of Scope

- 다른 Action audit (이미 표준 패턴 준수) — phase-03 grep 으로 확인만
- backend 측 권한 검증 강화 (별도 backend issue)

## Risks

| 리스크 | 완화 |
|---|---|
| `getActiveInvitations` 반환 타입에 `uuid` 필드 없음 | 구현 시 type 확인 후 필요 시 InvitationInfoData 구조 활용. 대안: `getInvitationInfo(token)` (token 기반) 은 부적합 (uuid 입력) |
| category/create 호출처가 다른 가족 UUID 를 의도적으로 전달하는 케이스 (admin 시나리오) | 현재 그런 호출처 없음 (`grep -rn 'createCategoryAction' src` 확인). 향후 admin 기능 추가 시 별도 권한 도입 |
| `getActiveInvitations()` 추가 페치로 invitation 삭제 latency ↑ | invitation 삭제는 빈번 작업 아님 (가끔). cost 무시 가능 |
