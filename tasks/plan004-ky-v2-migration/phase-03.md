# Phase 03 — `.json()` 빈 body 가드 + HTTPError.data 활용

**Model**: sonnet
**Status**: pending
**Goal**: ky 2.0 가 빈 body / 204 응답에서 throw 하는 변경 대응 + `HTTPError.data` 자동 파싱 활용으로 catch 블록 단순화.

## Context (자기완결)

- ky 2.0 변경 (1b8e1ff): `.json()` 이 빈 body 또는 204 응답에서 throw (기존: 빈 문자열 반환).
  - 영향: `client.ts:216` `response.json<T>()` — DELETE 응답이 보통 204 No Content. 우리 envelope 가 200/JSON 가정이므로 가드 필요.
- ky 2.0 변경 (1341f5c): `HTTPError.data` 신규 — 응답 body 자동 파싱. `await error.response.json().catch(() => null)` 패턴 폐기 가능.
  - 영향: `client.ts:144` `beforeError` 안의 raw 파싱 + `client.ts:219` catch 블록의 동일 패턴.

## 작업 항목

### 1. `serverApiClient` 의 `response.json<T>()` 빈 body 가드

`client.ts:213~216`:

```ts
// HTTP 메서드에 따른 호출
const response = await kyInstance[method](normalizedEndpoint, kyOptions);
return response.json<T>();
```

방어 패턴:

```ts
const response = await kyInstance[method](normalizedEndpoint, kyOptions);

// 204 No Content 또는 빈 body 응답 — DELETE 등에서 발생
if (response.status === 204 || response.headers.get("content-length") === "0") {
  return null as T;
}

return response.json<T>();
```

`null as T` 는 호출자 (`serverApiDelete` 등) 가 `data` 필드를 안 쓰는 케이스에 맞춤. envelope 응답 (`ApiResponse<T>`) 검사 (line 311 `if (!response.success)`) 는 호출자에서 분기 — 빈 body 시 success 검증 자체를 건너뛰는 분기 추가:

```ts
// serverApiDelete 등에서:
const response = await serverApiClient<ApiResponse<T> | null>(endpoint, { method: "DELETE" });
if (response === null) return null as T;   // 204 No Content
if (!response.success) throw new ServerApiError(...);
return response.data;
```

5개 helper (`serverApiGet`/`Post`/`Put`/`Patch`/`Delete`) 모두 동일 패턴 가드 추가.

### 2. `beforeError` 의 `HTTPError.data` 활용

`client.ts:139~169`:

기존:
```ts
const raw = await response.json().catch(() => null);
const errorData = raw !== null && typeof raw === "object" && !Array.isArray(raw)
  ? (raw as { message?: string; error?: string })
  : null;
```

신규 (ky 2.0 의 `error.data`):
```ts
const data = error.data;   // 자동 파싱됨
const errorData = data !== null && typeof data === "object" && !Array.isArray(data)
  ? (data as { message?: string; error?: string })
  : null;
```

장점: `await response.json()` resource leak 회피 + try/catch 불필요.

### 3. `serverApiClient` catch 블록의 `error.response.json()` → `error.data`

`client.ts:217~231`:

기존:
```ts
if (error instanceof HTTPError) {
  const errorData = (await error.response.json().catch(() => null)) as {
    message?: string;
    error?: string;
  } | null;
  ...
}
```

신규:
```ts
if (error instanceof HTTPError) {
  const errorData = (error.data ?? null) as {
    message?: string;
    error?: string;
  } | null;
  ...
}
```

`error.data` 는 `unknown` 타입이라 type narrowing 후 사용. shape 점검 (object && !Array) 추가하면 안전:

```ts
const data = error.data;
const errorData = data && typeof data === "object" && !Array.isArray(data)
  ? (data as { message?: string; error?: string })
  : null;
```

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

pnpm tsc --noEmit
pnpm lint
pnpm build
pnpm test --run

# 빈 body 가드 도입
grep -nE 'response\.status === 204|content-length' src/lib/server/api/client.ts | wc -l   # >= 1

# HTTPError.data 활용 (await error.response.json 패턴 0건)
! grep -nE 'await error\.response\.json' src/lib/server/api/client.ts
! grep -nE 'await response\.json\(\)\.catch' src/lib/server/api/client.ts
grep -nE 'error\.data' src/lib/server/api/client.ts | wc -l   # >= 2
```

수동 smoke:
- DELETE endpoint (예: 거래 삭제) → 204 응답 → throw 없음, UI 정상 갱신
- 의도적으로 404/500 endpoint → ServerApiError 메시지에 backend message 포함 (errorData?.message 경로)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/lib/server/api/client.ts` | 빈 body 가드 + `error.data` 활용 + catch 단순화 |

## Out of Scope

- `__mocks__/ky.ts` 의 `HTTPError.data` 추가 (phase 4)
- `NetworkError` 분기 처리 (본 plan 범위 외)
- 호출자측 (action/service) 의 null 응답 처리 정책 — `null as T` 캐스팅 유지, 사용처에서 분기 안 해도 동작 (data 안 쓰는 케이스)

## Risks

| 리스크 | 완화 |
|---|---|
| `error.data` 가 ky 2.0 에서 lazy 파싱이라 첫 접근 시 비동기 가능성 | release note (1341f5c) 가 "automatically consumed and parsed" 로 즉시 사용 명시. `await` 불필요 |
| 빈 body 가드가 200 + 빈 body (비정상 응답) 도 null 처리해버림 | `content-length === "0"` 가드 — 정상 envelope 응답은 항상 length > 0. 의도적 정책 |
| 호출자가 `null` 응답을 success 로 가정 안 하면 회귀 | helper 5개 모두 `null` 체크 → success false 분기 X. 변경 후 통합 테스트 (phase 5) |
