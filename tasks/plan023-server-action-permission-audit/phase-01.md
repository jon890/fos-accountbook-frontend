# Phase 01 — assertFamilyAccess helper 신설 + family/update 적용

**Model**: sonnet
**Status**: pending
**Goal**: `src/lib/server/auth/auth-helpers.ts` 에 `assertFamilyAccess(familyUuid)` helper 신설. `updateFamilyAction` 에 적용 (Multi-family 패턴 B, ADR-F25). 클라이언트가 본인 속하지 않은 family UUID 주입 시 `entityNotFound` 로 차단.

## Context (자기완결)

- 현재 `src/actions/family/update-family-action.ts` (43 줄): `requireAuth()` 만 수행 → 권한 상승 위험 (PR #271 리뷰 지적)
- `src/lib/server/auth/auth-helpers.ts` (L1~75 추정): `requireAuth` / `requireAuthOrRedirect` / `getSelectedFamilyUuid` exports
- `src/services/family/family-service.ts:21-23` 의 `getFamilies()` 가 백엔드 세션 token 기준으로 본인 가족만 반환 (이미 신뢰 경계). list 안에 familyUuid 가 있으면 권한 증거
- `selectFamily` (L36-43) 의 검증 패턴이 모델 — `families.some(f => f.uuid === familyUuid)` + throw `ActionError.entityNotFound`

## 작업 항목

### 1. `src/lib/server/auth/auth-helpers.ts` 에 helper 추가

```ts
import { ActionError } from "@/lib/errors";
import { getFamilies } from "@/services/family/family-service";
import type { Family } from "@/types/family";

/**
 * Multi-family 패턴 권한 검증 (ADR-F25 패턴 B).
 * 사용자가 해당 family 의 member 인지 확인. 미소속 시 entityNotFound throw.
 *
 * Single-family Action 은 `getSelectedFamilyUuid()` 비교로 충분 — 본 helper 는
 * settings 처럼 본인 속한 여러 가족 중 하나를 다루는 Action 전용.
 */
export async function assertFamilyAccess(familyUuid: string): Promise<void> {
  const families: Family[] = await getFamilies();
  if (!families.some((f) => f.uuid === familyUuid)) {
    throw ActionError.entityNotFound("가족", familyUuid);
  }
}
```

import 위치는 기존 파일의 import 블록 끝. export 도 기존 패턴 따름.

### 2. `src/actions/family/update-family-action.ts` 갱신

```ts
import { requireAuth, assertFamilyAccess } from "@/lib/server/auth/auth-helpers";
// 기존 import 유지

export async function updateFamilyAction(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<ActionResult<Family>> {
  try {
    await requireAuth();

    if (!familyUuid) {
      throw ActionError.invalidInput("가족 UUID", familyUuid, "UUID는 필수입니다");
    }

    await assertFamilyAccess(familyUuid);   // ← 추가

    const family = await updateFamily(familyUuid, data);
    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath(`/families/${familyUuid}`);
    return successResult(family);
  } catch (error) {
    return handleActionError(error, "가족 정보 수정에 실패했습니다");
  }
}
```

기존 동작 보존 — `requireAuth` 유지, `familyUuid` null check 유지, revalidate 경로 동일. 검증 1줄만 추가.

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan023-server-action-permission-audit

pnpm lint
pnpm tsc --noEmit
pnpm build

# helper export 존재
grep -n 'export async function assertFamilyAccess' \
  src/lib/server/auth/auth-helpers.ts | wc -l   # == 1

# updateFamilyAction 적용
grep -n 'assertFamilyAccess' src/actions/family/update-family-action.ts | wc -l   # >= 1
```

수동 smoke:
- /settings 에서 본인 가족 예산 수정 → 정상 동작
- (어렵지만 가능하면) devtools 로 다른 가족 UUID 주입 호출 → entityNotFound error toast
- 단일 가족 사용자 → 영향 없음

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/lib/server/auth/auth-helpers.ts` | `assertFamilyAccess` 추가 |
| `src/actions/family/update-family-action.ts` | helper 호출 1줄 추가 |

## Out of Scope

- category/create / invitation/delete 갱신 — phase-02
- 다른 Action 의 audit — phase-03 (전체 grep 검증)
- backend 측 권한 검증 (이미 backend 가 책임 + 본 plan 은 frontend 이중 방어)

## Risks

| 리스크 | 완화 |
|---|---|
| `getFamilies()` 가 매 update 호출마다 추가 페치 → latency ↑ | 단발 페치 (캐시되지 않음). 단 settings 페이지에서 update 가 빈번 안 함. 필요 시 후속 plan 에서 `unstable_cache` 또는 session 기반 캐시 추가 |
| circular import — auth-helpers 가 services/family 를 import | family-service 는 lib/server/api 만 import → 순환 없음. tsc 검증 시 발견 가능 |
| plan021 phase-02 의 0번 작업과 중복 | plan023 이 먼저 머지되면 plan021 phase-02 0번은 자동 no-op (이미 적용됨). 반대도 동일 — 어느 한쪽 머지 후 다른 plan 의 build-with-teams 실행 시 0번/이번 phase 모두 동일 코드 변경이라 skip |
