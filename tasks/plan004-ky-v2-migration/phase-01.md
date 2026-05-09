# Phase 01 — package.json bump + Hook signature 마이그레이션

**Model**: sonnet
**Status**: pending
**Goal**: ky 의존성을 1.14.3 → 2.0.2 로 bump + 3개 hook (`beforeRequest`/`afterResponse`/`beforeError`) 시그니처를 ky 2.0 의 단일 state object 로 재작성.

## Context (자기완결)

- 사용처 단일 파일: `src/lib/server/api/client.ts` (316줄). hook 위치:
  - `beforeRequest` — line 73 — 인자 `(request)` → `({ request, options })`
  - `afterResponse` — line 97 — 인자 `(_request, _options, response)` → `({ request, options, response, retryCount })`
  - `beforeError` — line 139 — 인자 `(error)` → `(error, { request, options })` (모든 에러 받음, `error.response` undefined 가능)
- ky 2.0 release note: 모든 hook 이 단일 state object 받음. ADR-F05 갱신 (이 PR docs 변경) 참조.
- `prefixUrl` rename / `.json()` 빈 body / `HTTPError.data` 활용은 phase 2~3 에서 처리. phase 01 은 dep bump + hook 변환만.

## 작업 항목

### 1. package.json + lock bump

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration
pnpm add ky@^2.0.2
```

`package.json` 의 `"ky": "^1.14.3"` → `"^2.0.2"`. `pnpm-lock.yaml` 자동 갱신. 다른 dep 영향 0.

### 2. `beforeRequest` hook 변환

기존: `(request) => { ... request.headers.set(...) ... logRequest(request.method, request.url, ...) ... }`
신규: `({ request }) => { ... }` (destructuring). 본문 그대로 — `request` 객체 동일.

### 3. `afterResponse` hook 변환

기존: `async (_request, _options, response) => { ... }`
신규: `async ({ request, response, retryCount }) => { ... }` (destructuring).

내부에서 `_request` → `request` 로 변수명 통일. 사용 안 하는 `options` / `retryCount` 는 destructuring 에서 생략 가능.

### 4. `beforeError` hook 변환

기존: `async (error) => { ... if (response) { ... } ... return error; }`
신규: `async (error, { request, options }) => { ... }`.

ky 2.0 변경: 이제 모든 에러를 받음 (HTTPError 한정 아님). `error.response` 가 undefined 일 수 있으므로 기존 line 143 `if (response)` 가드 그대로 보존 — 추가 변경 0. `request`/`options` state 는 사용 안 하면 destructuring 생략.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

pnpm install   # lock 동기화
pnpm tsc --noEmit
pnpm lint

# package.json 의 ky 버전
grep '"ky"' package.json   # = "^2.0.2"

# hook signature — 단일 객체 인자 형태인지
grep -nE 'beforeRequest:\s*\[\s*\(\s*\{' src/lib/server/api/client.ts | wc -l   # >= 1
grep -nE 'afterResponse:\s*\[\s*async\s*\(\s*\{' src/lib/server/api/client.ts | wc -l   # >= 1
# beforeError 는 (error, { ... }) 형태 — 첫 인자가 error 그대로
grep -nE 'beforeError:\s*\[\s*async\s*\(\s*error,' src/lib/server/api/client.ts | wc -l   # >= 1

# 기존 위치 인자 패턴 0건
! grep -nE 'beforeRequest:\s*\[\s*\(\s*request\s*\)' src/lib/server/api/client.ts
! grep -nE 'afterResponse:\s*\[\s*async\s*\(\s*_request,\s*_options' src/lib/server/api/client.ts
```

수동 smoke (`pnpm dev`):
- 로그인 → 대시보드 → 데이터 fetch 정상 (요청/응답 로그 정상 출력)
- 404 endpoint 호출 시 에러 메시지 정상 (`beforeError` 동작)

## Critical Files

| 파일 | 상태 |
|---|---|
| `package.json` / `pnpm-lock.yaml` | bump (^1.14.3 → ^2.0.2) |
| `src/lib/server/api/client.ts` | 3개 hook 시그니처 재작성 |

## Out of Scope

- `prefixUrl` rename (phase 2)
- `.json()` 빈 body 가드 (phase 3)
- `HTTPError.data` 활용 (phase 3)
- `__mocks__/ky.ts` 업데이트 (phase 4)
- `NetworkError`, `totalTimeout` 등 신규 기능 도입 — 본 plan 범위 외, 후속 plan 검토

## Risks

| 리스크 | 완화 |
|---|---|
| pnpm install 시 다른 dep 가 ky 1.x peer 의존 가능성 | install 후 `pnpm list ky` 로 단일 버전 확인. peer 충돌 시 보고 |
| TypeScript 타입 에러 — `Options` / `KyOptions` 가 v2 에서 형 변경 | tsc --noEmit 으로 잡음. 잡히는 위치는 hook 외에는 거의 없을 것 (사용처 client.ts 단일) |
| Node 22 미만 환경에서 빌드 실패 | project memory + package.json `"node": "22.x"` 일치 — 영향 없음. 사용자 로컬 환경만 점검 |
