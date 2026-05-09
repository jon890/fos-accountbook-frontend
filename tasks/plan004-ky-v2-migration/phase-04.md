# Phase 04 — `__mocks__/ky.ts` 갱신

**Model**: sonnet
**Status**: pending
**Goal**: jest.mock 기반 테스트 (ADR-F09) 가 ky 2.0 의 `HTTPError.data` + 신 hook 시그니처를 정확히 반영하도록 mock 파일 갱신.

## Context (자기완결)

- `src/__mocks__/ky.ts` (84줄) — `HTTPError` mock class 정의 (line 67~78).
- ADR-F09 jest.mock 방식 — service 단위 테스트가 `jest.mock("ky", ...)` 으로 mock 사용. ky 2.0 변경에 mock 도 동조해야 테스트가 실 코드 동작과 일치.
- HTTPError 의 새 `data` 속성 (1341f5c) — 응답 body 자동 파싱. mock 도 이 속성 노출해야 service 코드의 `error.data` 접근이 정상 mocked.

## 작업 항목

### 1. `__mocks__/ky.ts` 의 HTTPError class 에 `data` 속성 추가

기존 (line 67~):
```ts
export class HTTPError extends Error {
  response: Response;
  request: Request;
  options: NormalizedOptions;
  // ...
  this.name = "HTTPError";
}
```

신규:
```ts
export class HTTPError extends Error {
  response: Response;
  request: Request;
  options: NormalizedOptions;
  data: unknown;        // ← ky 2.0 신규: 자동 파싱된 응답 body

  constructor(response: Response, request: Request, options: NormalizedOptions, data?: unknown) {
    super(...);
    // ...
    this.data = data ?? null;
    this.name = "HTTPError";
  }
}
```

테스트에서 사용 시:
```ts
const error = new HTTPError(mockResponse, mockRequest, mockOptions, { message: "Not Found" });
```

### 2. mock 사용처 (테스트 파일) 점검

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

# HTTPError 를 직접 throw 하는 테스트 위치
grep -rn 'new HTTPError\|throw new HTTPError' src/__tests__/ 2>/dev/null
```

각 위치에서 `new HTTPError(response, request, options)` 형태가 4번째 인자 `data` 없이 호출되어도 동작 (옵션 인자). 단 `error.data` 동작 검증 테스트가 필요하면 4번째 인자 명시.

### 3. ky default export mock 의 `prefix` 옵션 점검

mock 파일에 `prefixUrl` / `prefix` 옵션 처리 코드가 있다면 `prefix` 로 통일. 단 jest.mock 은 보통 `ky.create` 만 mock 하고 옵션은 무시 — 실측 후 변경.

### 4. 단위 테스트 통과 확인

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

pnpm test --run

# mock 의 HTTPError 가 data 속성 노출
grep -n 'data' src/__mocks__/ky.ts | wc -l   # >= 1 (data 속성 + 기타)
grep -n 'data:\s*unknown' src/__mocks__/ky.ts | wc -l   # = 1 (속성 선언)
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/__mocks__/ky.ts` | HTTPError class 에 `data` 속성 추가 |
| `src/__tests__/**/*.test.ts` | (해당 시) HTTPError throw 위치 확인 |

## Out of Scope

- 새 테스트 케이스 추가 (HTTPError.data 동작 검증) — 기존 테스트 통과만 목표
- ky 2.0 의 `NetworkError` mock 추가 (사용 시 별도 plan)

## Risks

| 리스크 | 완화 |
|---|---|
| 기존 테스트가 HTTPError 4-인자 시그니처에 의존하지 않으면 영향 0 | grep 으로 사용처 0~소수 추정. 영향 시 4번째 인자 추가만 |
| mock 의 옵션 처리 코드가 `prefixUrl` literal 의존 시 silent break | mock 파일 본문 검토 시 발견. 일반적으로 mock 은 옵션 무시 |
