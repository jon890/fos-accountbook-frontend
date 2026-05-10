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

방어 패턴 — `serverApiClient<T>` 의 반환 타입을 `Promise<T | null>` 로 변경하고, 빈 body 응답은 status 코드 기반으로 판정 (Content-Length 헤더는 chunked 응답에서 부재할 수 있어 신뢰성 부족):

```ts
// serverApiClient<T>(...): Promise<T | null>
const response = await kyInstance[method](normalizedEndpoint, kyOptions);

// 204 No Content / 304 Not Modified — body 없음 보장된 status
if (response.status === 204 || response.status === 304) {
  return null;
}

return response.json<T>();
```

5개 helper (`serverApiGet`/`Post`/`Put`/`Patch`/`Delete`) 모두 반환 타입을 `Promise<T | null>` 로 변경 + null 분기 명시:

```ts
// serverApiDelete 등에서:
export async function serverApiDelete<T>(endpoint: string): Promise<T | null> {
  const response = await serverApiClient<ApiResponse<T>>(endpoint, { method: "DELETE" });
  if (response === null) return null;          // 204/304 — body 없음
  if (!response.success) throw new ServerApiError(response.message || response.error || "API 오류");
  return response.data;
}
```

호출자 (action/service) 도 `null` 가능성을 타입으로 인지 — phase 5 에서 `grep serverApiDelete` 후 호출자 null 분기 점검.

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

# 빈 body 가드 도입 (status 코드 기반 — Content-Length 헤더 의존 X)
grep -nE 'response\.status === 204|response\.status === 304' src/lib/server/api/client.ts | wc -l   # >= 1
! grep -nE 'content-length|Content-Length' src/lib/server/api/client.ts   # exit 1 — 헤더 체크 잔재 0건

# 5개 helper 가 Promise<T | null> 시그니처
grep -cE 'Promise<.*\| null>' src/lib/server/api/client.ts   # >= 5

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

## Risks

| 리스크 | 완화 |
|---|---|
| `error.data` 가 ky 2.0 에서 lazy 파싱이라 첫 접근 시 비동기 가능성 | release note (1341f5c) 가 "automatically consumed and parsed" 로 즉시 사용 명시. `await` 불필요 |
| 호출자가 `null` 응답에 분기 안 해서 런타임 에러 | helper 5개 반환 타입을 `Promise<T \| null>` 로 명시 → TypeScript 컴파일 단계에서 호출자 분기 강제. phase 5 의 `grep serverApiDelete` 점검으로 cross-check |
