# Phase 01 — 401 응답을 인증 만료(A002)로 분류 + 인증 에러는 기본값으로 숨기지 않기

**Model**: sonnet
**Status**: pending

---

## 목표

백엔드 401 응답이 "인증 만료" 경로로 흐르도록 끊긴 변환 고리를 잇는다.
현재는 401 → `ServerApiError(status:401)` 까지만 가고, 그 뒤 변환기가 status 를 무시해
모두 `internalError`(C 계열)로 뭉개져 `onAuthError`(A001/A002) 분기가 도달 불가다.
그 결과 `getActionDataOrDefault` 를 쓰는 dashboard/budget 은 만료 응답을 빈 데이터(0)로 숨겨
무효 토큰인 채 페이지가 잔존한다.

근거: `docs/adr.md` ADR-F26.

**범위 외**:
- jwt callback 의 refresh 실패 처리 → phase 2.
- 로그아웃 버튼 → phase 3.
- signin 토스트 → phase 4.

---

## 배경 (현재 코드 위치)

- `src/lib/server/api/types.ts` — `ServerApiError extends Error` 는 `status?: number` 필드 보유.
- `src/lib/server/api/client.ts:224` — HTTP 에러 시 `new ServerApiError(msg, error.response.status, errorData)` 로 status 채움 (401 포함).
- `src/lib/errors/action-error.ts:224` — `handleActionError(error, defaultMessage)`: try-catch 에서 던져진 에러를 `ActionResult` 로 변환하는 **변환기**. 현재 `ServerApiError` 의 status 를 검사하지 않음.
- `src/lib/server/action-result-handler.ts` — `handleActionError(result, options)`(redirect 처리기, 동명이인 주의) + `getActionDataOrDefault(result, defaultValue)`.
- `src/lib/errors/error-code.ts` — `A001`=UNAUTHORIZED("로그인이 필요합니다"), `A002`=SESSION_EXPIRED("세션이 만료되었습니다").
- `src/lib/errors/action-error.ts` static 헬퍼: `unauthorized()`(A001) 존재. `sessionExpired()` **없음** → 추가 필요.

## 작업 항목 (4)

### 1. `src/lib/errors/action-error.ts` — `ActionError.sessionExpired()` 헬퍼 추가

`unauthorized()`(111행 근처) 바로 아래에 추가. 코드값은 `"A002"` 문자열 리터럴 사용.

```ts
static sessionExpired(message?: string): ActionError {
  return new ActionError("A002", message || "세션이 만료되었습니다");
}
```

import 변경 불필요.
이 파일의 `ErrorCode` 는 `import { ERROR_MESSAGES, type ErrorCode }` 로 **타입 전용 import** 다.
값으로 쓰면 tsc TS2693 컴파일 에러가 난다 — 기존 헬퍼(`unauthorized()`→`"A001"`, `familyNotSelected()`→`"F002"`)와 동일하게 문자열 리터럴을 쓴다.

### 2. `src/lib/errors/action-error.ts` — `handleActionError` 변환기에 401 분기 추가

`handleActionError(error, defaultMessage)`(224행) 의 `error instanceof Error` 분기보다 **먼저**, `ServerApiError` 의 401 을 인증 만료로 변환한다.

```ts
import { ServerApiError } from "@/lib/server/api/types";
// ...
export function handleActionError(error: unknown, defaultMessage: string): ActionResult<never> {
  if (error instanceof ActionError) {
    return error.toFailureResult();
  }

  // 백엔드 401 = 인증 만료 (ADR-F26)
  if (error instanceof ServerApiError && error.status === 401) {
    return ActionError.sessionExpired().toFailureResult();
  }

  if (error instanceof Error) {
    // ... 기존 네트워크/internalError 로직 그대로 ...
  }
  // ...
}
```

주의: `ServerApiError` import 가 순환 의존을 만들지 않는지 확인. `lib/errors` → `lib/server/api/types` 방향. `types.ts` 가 `lib/errors` 를 import 하지 않으므로 단방향 — 안전. 만약 순환이 발생하면 `error.name === "ServerApiError" && (error as { status?: number }).status === 401` 로 덕타이핑 대체.

### 3. `src/lib/server/action-result-handler.ts` — `getActionDataOrDefault` 가 인증 에러는 숨기지 않기

`getActionDataOrDefault(result, defaultValue)` 에서 실패 코드가 인증 계열(A001/A002)이면 기본값 대신 `handleActionError`(같은 파일의 redirect 처리기)로 redirect.

```ts
export function getActionDataOrDefault<T>(result: ActionResult<T>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }

  // 인증 에러는 빈 데이터로 숨기지 않고 로그인으로 (ADR-F26)
  if (result.error.code === "A001" || result.error.code === "A002") {
    handleActionError(result); // redirect, never 반환
  }

  console.error("Action failed, using default value:", {
    code: result.error.code,
    message: result.error.message,
  });
  return defaultValue;
}
```

`handleActionError`(redirect 버전)의 기본 동작은 A001/A002 → `/auth/signin?error=auth&message=...` redirect (이미 구현됨). 추가 옵션 불필요.

### 4. 테스트 — `src/__tests__/` 에 변환/가드 단위 테스트 (ADR-F09 jest.mock 방식)

- `handleActionError`(action-error.ts 변환기): `new ServerApiError("...", 401)` 입력 → 반환 `ActionResult` 의 `error.code === "A002"` 검증.
- 401 이 아닌 ServerApiError(예: 500) → 여전히 `internalError`(C 계열) 로 변환되는지(회귀 방지).
- `getActionDataOrDefault`: A002 결과 입력 시 `redirect` 가 호출되는지 (`next/navigation` 의 `redirect` 를 jest.mock 으로 스파이). 성공 결과 / 비인증 실패 결과는 기존대로 data/기본값 반환.

기존 테스트 위치/패턴 참조: `src/__tests__/` 하위. `next/navigation` mock 은 다른 액션 테스트에서 쓰는 방식 그대로.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/lib/errors/action-error.ts` | 수정 — `sessionExpired()` 헬퍼 + 401 변환 분기 |
| `src/lib/server/action-result-handler.ts` | 수정 — `getActionDataOrDefault` 인증 가드 |
| `src/__tests__/...` | 신규 — 변환/가드 단위 테스트 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
pnpm lint
pnpm test --silent 2>&1 | tail -20

# sessionExpired 헬퍼 존재
grep -n "static sessionExpired" src/lib/errors/action-error.ts

# 401 변환 분기 존재
grep -nE "status === 401" src/lib/errors/action-error.ts

# getActionDataOrDefault 인증 가드 존재
grep -nE 'A001"? *\|\| *result.error.code === "A002"|code === "A002"' src/lib/server/action-result-handler.ts
```

기대: 모든 grep 1건 이상 매치, `pnpm lint` exit 0, 신규 테스트 통과.

## 의도 메모 (왜)

- 변환을 HTTP 클라이언트(client.ts)가 아니라 에러 레이어(action-error.ts)에 둔 이유: client.ts 는 Service 에서 호출되는데 `redirect()` 는 RSC/Action context 구분이 필요해 레이어 경계를 깬다. 변환은 에러 레이어, redirect 는 action-result-handler 가 책임 (ADR-F26 대안 기각 참조).
- 401 을 A002(SESSION_EXPIRED)로 보낸 이유: A001(UNAUTHORIZED)은 "처음부터 미인증", A002 는 "세션 만료"로 의미가 더 정확. `onAuthError` 분기는 둘 다 잡으므로 동작 동일하나 메시지/의미가 맞다.
