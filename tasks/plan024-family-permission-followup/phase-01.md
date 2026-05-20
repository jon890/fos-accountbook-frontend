# Phase 01 — dead code 제거 + selectFamilyAction 통합 + 권한 검증 표준화

**Model**: sonnet
**Status**: pending
**Goal**: plan023 audit 에서 발견된 누락 Action 3 건 보강. dead code (getFamilyByIdAction, selectFamilyAction) 제거 + setDefaultFamilyAction 표준화 (ADR-F25 패턴 B).

## Context (자기완결)

plan023 (PR #276 머지) 으로 `assertFamilyAccess(familyUuid)` helper 가 `src/lib/server/auth/auth-helpers.ts` 에 도입됨. 이번 phase 는 helper 를 누락 Action 에 적용 + 중복 코드 정리.

### 현재 상태

| Action | 상태 | 본 phase 처리 |
|---|---|---|
| `get-family-by-id-action.ts` (33 줄) | production 호출처 0 건 (dead) | 삭제 + `getFamilyById` service 함수 삭제 (호출처 동일) |
| `select-family-action.ts` (42 줄) | 호출처 1 건 (`FamilySelectorDropdown`). service 가 inline 검증 후 `setDefaultFamily` 호출 | 삭제 + `selectFamily` service 삭제. 호출처 마이그레이션 |
| `set-default-family-action.ts` (40 줄) | 호출처 3 건. `requireAuth` 만 + 입력 검증/revalidate 부재 | 표준화 (assertFamilyAccess + 입력 검증 + revalidatePath) |

selectFamily service 의 inline 검증 (`families.some(...)`) 은 ADR-F25 의 "권한 검증은 action 레이어" 원칙에 어긋남 (service 우회 호출자가 검증 우회 가능). action 으로 이동.

## 작업 항목

### 1. dead code 제거 — `getFamilyByIdAction` + `getFamilyById` service

- `src/actions/family/get-family-by-id-action.ts` 파일 삭제 (`git rm`)
- `src/services/family/family-service.ts` 의 `getFamilyById` 함수 export 제거 (호출처 0)

확인: `grep -rn 'getFamilyByIdAction\|getFamilyById' src/ --include='*.ts' --include='*.tsx'` → 결과 0 건이어야 함.

### 2. `selectFamilyAction` + `selectFamily` service 제거

- `src/actions/family/select-family-action.ts` 파일 삭제 (`git rm`)
- `src/services/family/family-service.ts` 의 `selectFamily` 함수 제거 (inline 검증 포함된 wrapper). `setDefaultFamily` 만 남김.

### 3. 호출처 마이그레이션 — `FamilySelectorDropdown.tsx`

`src/components/families/FamilySelectorDropdown.tsx`:

```ts
// 변경 전
import { selectFamilyAction } from "@/actions/family/select-family-action";
// ...
const result = await selectFamilyAction(firstFamilyUuid);
// ...
const result = await selectFamilyAction(familyUuid);

// 변경 후
import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
// ...
const result = await setDefaultFamilyAction(firstFamilyUuid);
// ...
const result = await setDefaultFamilyAction(familyUuid);
```

L5, L52, L74 (선언 시점에 정확한 라인은 grep 으로 확인). 시그니처 동일 (`familyUuid: string` → `Promise<ActionResult<void>>`).

### 4. `setDefaultFamilyAction` 표준화

`src/actions/user/set-default-family-action.ts`:

```ts
"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  assertFamilyAccess,
  requireAuth,
} from "@/lib/server/auth/auth-helpers";
import { setDefaultFamily } from "@/services/user/user-service";
import { revalidatePath } from "next/cache";

/**
 * 기본 가족 설정 Server Action
 * UserProfile 의 defaultFamilyUuid 를 업데이트 (ADR-F25 패턴 B — Multi-family)
 *
 * ⚠️ 주의: 이 액션 호출 후 클라이언트에서 세션 갱신이 필요합니다.
 * useSessionRefresh 훅의 refreshSession() 을 호출하세요.
 */
export async function setDefaultFamilyAction(
  familyUuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    if (!familyUuid || familyUuid.trim().length === 0) {
      throw ActionError.invalidInput(
        "가족 UUID",
        familyUuid,
        "UUID는 필수입니다"
      );
    }

    await assertFamilyAccess(familyUuid);

    await setDefaultFamily(familyUuid);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "기본 가족 설정에 실패했습니다");
  }
}
```

기존 JSDoc 예시 (useSessionRefresh 사용법) 는 길이 줄이고 ⚠️ 주의 한 줄만 유지.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan024-family-permission-followup

pnpm lint
pnpm tsc --noEmit
pnpm build

# dead code 제거 확인
! test -f src/actions/family/get-family-by-id-action.ts
! test -f src/actions/family/select-family-action.ts
! grep -n 'export async function getFamilyById\b' src/services/family/family-service.ts
! grep -n 'export async function selectFamily\b' src/services/family/family-service.ts

# 호출처 마이그레이션
! grep -rn 'selectFamilyAction' src/ --include='*.tsx' --include='*.ts'
! grep -rn 'getFamilyByIdAction' src/ --include='*.tsx' --include='*.ts'

# setDefaultFamilyAction 표준화
grep -nE 'assertFamilyAccess|revalidatePath' src/actions/user/set-default-family-action.ts | wc -l   # >= 2
```

수동 smoke (구현자 책임):
- `/settings` 에서 가족 변경 → 정상 (revalidate 동작)
- 헤더 FamilySelectorDropdown 에서 가족 선택 → 정상
- 로그인 후 가족 미선택 상태 (FamilySelectorPage) → 가족 선택 → 정상

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/actions/family/get-family-by-id-action.ts` | 삭제 |
| `src/actions/family/select-family-action.ts` | 삭제 |
| `src/services/family/family-service.ts` | `getFamilyById` + `selectFamily` export 제거 |
| `src/components/families/FamilySelectorDropdown.tsx` | `selectFamilyAction` → `setDefaultFamilyAction` 마이그레이션 (2 개 호출 + 1 개 import) |
| `src/actions/user/set-default-family-action.ts` | 입력 검증 + assertFamilyAccess + revalidatePath 추가 |

## Out of Scope

- 다른 가족 식별자 다루는 Action audit — phase-02 grep 으로 검증만
- backend 측 권한 검증 강화 — 별도 backend issue

## Risks

| 리스크 | 완화 |
|---|---|
| `selectFamily` service 외부에서 다른 호출자 존재 (silent breakage) | 위 verification 의 `! grep selectFamilyAction src/` 으로 검출. service 함수 `selectFamily` 의 ref 도 grep 으로 확인 |
| FamilySelectorDropdown 의 `setDefaultFamilyAction` 호출 후 세션 갱신 필요 | 기존 selectFamilyAction 도 동일 (`useSessionRefresh` 호출처에서 처리 중). 호출처 코드 변경 시 세션 갱신 로직 보존 확인 |
| `assertFamilyAccess` 추가 페치 (`getFamilies()`) — setDefaultFamilyAction 호출 latency ↑ | 기존 selectFamilyAction 도 동일 페치 수행 (service inline 검증 시). 순증가 아님 — service 검증을 action 으로 이동만 |
