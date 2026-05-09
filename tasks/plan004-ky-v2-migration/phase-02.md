# Phase 02 — prefixUrl → prefix rename + leading slash 처리

**Model**: sonnet
**Status**: pending
**Goal**: ky 2.0 의 `prefixUrl` 폐지에 따라 `prefix` 옵션으로 rename. 현재 동작 (단순 string join) 유지.

## Context (자기완결)

- ky 2.0 변경: `prefixUrl` → `prefix` rename + leading slash 허용 (1f2ad7f).
- 우리 코드:
  - `client.ts:65` `prefixUrl: API_URL`
  - `client.ts:189~192` endpoint 의 leading slash 제거 (`endpoint.slice(1)`) — ky 1.x 의 prefixUrl 가 leading slash 입력을 거부했기 때문
- ky 2.0 의 `prefix` 는 leading slash 입력 허용 — 이론상 slice(1) 제거 가능하나, 회귀 위험 회피 위해 유지.
- 사용자 결정 (이 PR PR description): `prefix` rename 만 (baseUrl 전환 X).

## 작업 항목

### 1. `prefixUrl: API_URL` → `prefix: API_URL`

`client.ts:65` 한 줄 변경:

```ts
return ky.create({
  prefix: API_URL,        // ← prefixUrl 에서 변경
  retry: KY_RETRY_CONFIG,
  hooks: { ... },
});
```

### 2. leading slash 처리 정책 결정 (코드 변경 0)

`client.ts:189~192`:

```ts
// endpoint에서 선행 슬래시 제거 (ky prefixUrl과 함께 사용 시)
const normalizedEndpoint = endpoint.startsWith("/")
  ? endpoint.slice(1)
  : endpoint;
```

ky 2.0 의 `prefix` 는 leading slash 허용 → `slice(1)` 가 동작상 무해 (단순 join 시 / 가 두 번 안 들어가도록 보호하는 정도). 회귀 위험 회피 위해 **slice 로직 그대로 유지**, 주석만 업데이트:

```ts
// endpoint 의 선행 슬래시 정규화 (ky prefix 와 함께 사용 시 // 중복 방지)
```

### 3. action/service 계층 endpoint 호출 패턴 점검 (read-only)

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

# serverApiGet/Post/Put/Patch/Delete 호출 패턴 — leading slash 사용 빈도 점검
grep -rnE 'serverApi(Get|Post|Put|Patch|Delete)\("[^"]+"' src/services/ src/actions/ | head -20
```

대부분 `"/families/..."` 형태로 leading slash 사용 추정 — slice(1) 가 처리. 변경 없음.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

pnpm tsc --noEmit
pnpm lint
pnpm build

# prefix 옵션 사용 + prefixUrl 잔재 0건
grep -n 'prefix:\s*API_URL' src/lib/server/api/client.ts | wc -l   # = 1
! grep -rnE 'prefixUrl' src/                                       # exit 1

# slice(1) 정규화 로직 보존
grep -n 'slice(1)' src/lib/server/api/client.ts | wc -l            # >= 1
```

수동 smoke: `/dashboard` → API 호출 정상 (URL 이 `${API_URL}/families/...` 형태로 빌드되는지 DevTools Network 탭 확인).

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/lib/server/api/client.ts` | `prefixUrl` → `prefix` 한 줄 + 주석 업데이트 |

## Out of Scope

- `baseUrl` 옵션 전환 (사용자 기각)
- slice(1) 자체 제거 (회귀 위험 회피로 보존)
- action/service 계층 endpoint 문자열 변경 — 현재 leading slash 패턴 그대로

## Risks

| 리스크 | 완화 |
|---|---|
| `prefix` 옵션 명이 ky 2.0 release note 와 다른 가능성 | release note (v2.0.0 섹션) 1f2ad7f 가 명시. tsc 타입 체크가 잘못된 옵션명 잡음 |
| API_URL 끝에 trailing slash 가 있으면 `//` 중복 가능성 | `API_URL` (env `BACKEND_API_URL`) 의 형식 점검 — 일반적으로 `https://api.foo.com` 형태. trailing slash 있으면 별도 plan 으로 정규화 |
