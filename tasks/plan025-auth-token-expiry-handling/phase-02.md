# Phase 02 — jwt callback refresh 실패 시 token.error 가드 (무한 재시도 방지)

**Model**: sonnet
**Status**: pending

---

## 목표

refresh 토큰까지 만료되어 갱신이 실패했을 때, jwt callback 이 매 호출마다 무의미한 refresh 를
반복하지 않도록 `token.error` 로 1회 표시하고 이후 재시도를 건너뛴다.
실제 로그인 리다이렉트는 phase 1 의 401 경로가 담당한다 (jwt callback 에서 즉시 세션을 죽이지 않음).

근거: `docs/adr.md` ADR-F26 ("refresh 실패는 jwt callback 에서 token.error 표시만, 무효화는 401 시점").

**범위 외**:
- 401 → 로그인 리다이렉트 → phase 1 (이미 처리).
- 클라이언트 측 useSession 감지/강제 로그아웃 → 이번 plan 범위 외 (서버 401 경로로 충분).

---

## 배경 (현재 코드)

`src/lib/server/auth/config.ts` jwt callback (66~89행):

```ts
if (token.backendTokenExpiredAt && token.backendRefreshToken && token.backendAccessToken) {
  const expiredAt = new Date(token.backendTokenExpiredAt);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000;
  if (now.getTime() >= expiredAt.getTime() - bufferTime) {
    const refreshedResponse = await refreshBackendToken({ refreshToken: token.backendRefreshToken });
    if (refreshedResponse.success) {
      token.backendAccessToken = refreshedResponse.data.accessToken;
      // ...
    }
    // 실패 시: 아무것도 안 함 → 다음 호출에서 또 refresh 시도 (무한 반복)
  }
}
```

`refreshBackendToken`(`src/lib/server/auth/backend-auth.ts`)은 try-catch 로 항상 `{success:true|false}` 반환 (throw 하지 않음).

## 작업 항목 (3)

### 1. `src/types/next-auth.d.ts` — JWT 에 `error` 필드 추가

`declare module "next-auth/jwt"` 의 `interface JWT` 에 추가:

```ts
/** refresh 실패 표시 — 설정되면 jwt callback 이 추가 refresh 재시도를 건너뜀 */
error?: "RefreshAccessTokenError";
```

### 2. `src/lib/server/auth/config.ts` — refresh 실패 가드

jwt callback 의 refresh 블록을 다음과 같이 보강:

- 블록 진입 전에 `token.error === "RefreshAccessTokenError"` 면 refresh 를 시도하지 않고 그대로 `return token` (이미 실패한 토큰 — 401 경로가 처리).
- refresh 성공 시 기존 필드 갱신 + `token.error = undefined` (혹시 이전 실패 플래그가 남아 있으면 해제).
- refresh 실패 시 `token.error = "RefreshAccessTokenError"` 설정 (만료 토큰은 그대로 둠).

```ts
// 이미 refresh 실패한 토큰이면 재시도하지 않음 (401 경로가 처리)
if (token.error === "RefreshAccessTokenError") {
  return token;
}

if (token.backendTokenExpiredAt && token.backendRefreshToken && token.backendAccessToken) {
  const expiredAt = new Date(token.backendTokenExpiredAt);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000;
  if (now.getTime() >= expiredAt.getTime() - bufferTime) {
    const refreshedResponse = await refreshBackendToken({ refreshToken: token.backendRefreshToken });
    if (refreshedResponse.success) {
      token.backendAccessToken = refreshedResponse.data.accessToken;
      token.backendRefreshToken = refreshedResponse.data.refreshToken;
      token.backendTokenExpiredAt = refreshedResponse.data.expiredAt;
      token.backendTokenIssuedAt = refreshedResponse.data.issuedAt;
      token.error = undefined;
    } else {
      console.warn("[auth.js callback (JWT)] backend token refresh 실패 — 다음 API 호출 401 시 로그인으로 처리");
      token.error = "RefreshAccessTokenError";
    }
  }
}
return token;
```

기존 `초기 로그인`/`trigger === "update"` 분기는 건드리지 않는다. 위 가드는 그 두 분기 **뒤**(기존 refresh 블록 자리)에 둔다. 초기 로그인 분기에서 새 토큰을 발급하므로 그 경로에서는 `token.error` 가 자연히 없음.

### 3. 테스트 — `src/__tests__/` jwt callback refresh 실패 가드 (ADR-F09)

`refreshBackendToken` 을 jest.mock 으로 모킹:
- 만료 임박 토큰 + refresh 실패(`{success:false}`) → 반환 token 의 `error === "RefreshAccessTokenError"`.
- `token.error` 가 이미 설정된 입력 → `refreshBackendToken` 이 호출되지 않음 (재시도 스킵 검증, mock 호출 횟수 0).
- refresh 성공 → 토큰 갱신 + `error` 가 undefined.

기존 auth 관련 테스트 패턴 참조: `src/__tests__/` 하위에서 `@/lib/server/auth` 또는 `backend-auth` 를 mock 하는 방식.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/types/next-auth.d.ts` | 수정 — JWT.error 필드 |
| `src/lib/server/auth/config.ts` | 수정 — refresh 실패 가드 |
| `src/__tests__/...` | 신규 — jwt callback 가드 테스트 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
pnpm lint
pnpm test --silent 2>&1 | tail -20

# JWT.error 타입 추가
grep -n "RefreshAccessTokenError" src/types/next-auth.d.ts

# 재시도 스킵 가드 존재
grep -nE 'token.error === "RefreshAccessTokenError"' src/lib/server/auth/config.ts

# 실패 시 플래그 설정 존재
grep -nE 'token.error = "RefreshAccessTokenError"' src/lib/server/auth/config.ts
```

기대: 모든 grep 1건 이상, `pnpm lint` exit 0, 신규 테스트 통과.

## 의도 메모 (왜)

- `token.error` 의 소비처는 jwt callback 자기 자신(재시도 가드)이라 dead field 가 아니다.
- jwt callback 에서 즉시 세션을 죽이지 않은 이유: NextAuth v5 의 세션 즉시 무효화는 동작 검증 부담이 크고, 페이지 진입 자체를 막아 phase 4 의 토스트 고지 흐름과 어긋난다. 401 시점 처리가 기존 `action-result-handler` 흐름과 일관 (ADR-F26 대안 기각).
