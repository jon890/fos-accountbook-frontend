# Phase 02 — invite Server Action 입력 Zod 검증 보강

**Model**: sonnet
**Status**: pending
**Goal**: `getInvitationInfoAction` / `acceptInvitationAction` 의 `token` 입력을 Zod 로 런타임 검증 (ADR-F06 준수). 악의적 토큰 형식이 service / API 호출에 그대로 흘러가지 않도록 차단.

## Context (자기완결)

- 현재 두 액션 모두 `token: string` 만 받고 별도 Zod 검증 없음. service 까지 그대로 전달.
- ADR-F06: Server Action 입력은 **Zod 런타임 검증 필수**. 현재 plan015 가 시각 변경만 다뤘던 phase-01 로 인해 보안 갭 노출됨 (PR #245 claude bot 리뷰 지적).
- 초대 토큰은 백엔드에서 UUID v4 형식으로 발급 (`backend` 의 invitation 도메인). 형식 어긋나면 service 호출 자체가 무의미.
- **권한 모델 명확화**: invite token 자체가 "이 가족에 join 할 권한 증명". `acceptInvitationAction` 은 `requireAuth()` 로 사용자 신원만 확인하면 충분 — 토큰이 유효한 한 누가 수락해도 join 흐름은 동일. `getSelectedFamilyUuid()` 와 비교하는 것은 invite 시맨틱에 맞지 않음 (수락자는 아직 그 가족 멤버가 아니므로). 즉 본 phase 는 **Zod 형식 검증** + **service 측 토큰 상태 검증 (만료/사용됨/취소)** 만 강화.

## 작업 항목

### 1. 공용 Zod 스키마 정의

`src/actions/invitation/_schemas.ts` 신규 (또는 각 액션 파일 상단에 inline):

```ts
import { z } from "zod";

export const InvitationTokenSchema = z.object({
  token: z.string().uuid(),
});
```

UUID v4 가 표준 — `z.string().uuid()` 가 v1~v5 모두 통과. backend 가 v4 만 발급해도 검증 범위는 RFC 4122 전체로 충분.

### 2. `getInvitationInfoAction` Zod 적용

```ts
// src/actions/invitation/get-invitation-info-action.ts
export async function getInvitationInfoAction(
  token: string
): Promise<ActionResult<InvitationInfoData>> {
  try {
    const { token: validToken } = InvitationTokenSchema.parse({ token });
    const info = await getInvitationInfo(validToken);
    return successResult(info);
  } catch (error) {
    return handleActionError(error, "초대 정보를 가져오는데 실패했습니다");
  }
}
```

`ZodError` 가 발생하면 `handleActionError` 가 catch — 사용자에게는 일반 에러 메시지만 노출 (토큰 형식 디테일은 서버 로그만).

### 3. `acceptInvitationAction` Zod 적용

```ts
// src/actions/invitation/accept-invitation-action.ts
export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { token: validToken } = InvitationTokenSchema.parse({ token });
    await acceptInvitation(validToken);
    revalidatePath("/");
    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "초대 수락에 실패했습니다");
  }
}
```

`requireAuth()` 가 Zod 보다 먼저 — 비인증 요청은 form 진입 자체가 차단. Zod 는 토큰 형식만 본다.

### 4. 단위 테스트 추가

`src/__tests__/actions/invitation/get-invitation-info-action.test.ts` (또는 기존 테스트 파일 보강):
- 잘못된 UUID 형식 (`"not-a-uuid"`, `""`, `"<script>"`) → 에러 ActionResult 반환 + service 호출 0 회 (jest.mock)
- 정상 UUID → service 호출 + successResult

`src/__tests__/actions/invitation/accept-invitation-action.test.ts` 도 동일 패턴.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan015
# branch: feat/plan015-...

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build

# Zod 검증 적용 확인
grep -nE 'InvitationTokenSchema|z\.string\(\)\.uuid' \
  src/actions/invitation/get-invitation-info-action.ts \
  src/actions/invitation/accept-invitation-action.ts | wc -l   # >= 2

# 두 action 에서 .parse 호출 확인
grep -nE 'InvitationTokenSchema\.parse|Schema\.parse\(' \
  src/actions/invitation/get-invitation-info-action.ts \
  src/actions/invitation/accept-invitation-action.ts | wc -l   # >= 2

# 테스트 파일 존재
test -f src/__tests__/actions/invitation/get-invitation-info-action.test.ts || test -f src/__tests__/actions/invitation/accept-invitation-action.test.ts
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/actions/invitation/_schemas.ts` (또는 inline) | 신규 — InvitationTokenSchema |
| `src/actions/invitation/get-invitation-info-action.ts` | Zod parse 추가 |
| `src/actions/invitation/accept-invitation-action.ts` | Zod parse 추가 |
| `src/__tests__/actions/invitation/*.test.ts` | 잘못된 토큰 검증 케이스 추가 |

## Out of Scope

- 토큰 상태 (만료/사용됨/취소) 별 에러 종류를 URL 에 구분 노출하지 않음 — 이미 `/?error=invalid_invitation` 단일 표시로 docs/flow.md 에 명시 (PR #245 리뷰 권고 사항 반영, 토큰 상태 열거 방지)
- 권한 모델 변경 (토큰 ↔ 이메일 binding 추가) — invite 시맨틱은 "토큰 = join 권한 증명" 유지. 별도 plan 검토
- service layer 의 검증 — 백엔드 API 가 최종 검증. action 은 형식만 차단

## Risks

| 리스크 | 완화 |
|---|---|
| 백엔드가 UUID v4 외 형식 (예: hex string) 으로 발급 변경 시 Zod 가 거부 | `z.string().uuid()` 가 RFC 4122 v1~v5 전체 허용. backend 변경 시 schema 도 동시 갱신. ADR 또는 plan note |
| ZodError 가 사용자에게 디테일 노출 | `handleActionError` 가 일반 메시지만 반환하는 패턴 — 기존 액션과 동일. 서버 로그에 ZodError 기록 |
| 기존 테스트 mock 이 Zod parse 통과 못함 | 기존 테스트의 토큰 fixture 를 valid UUID 로 교체. 별도 invalid case 추가 |
