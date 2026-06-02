# Phase 04 — signin 진입 시 세션 만료 sonner 토스트 고지

**Model**: sonnet
**Status**: pending

---

## 목표

세션 만료로 `/auth/signin?error=auth` 로 리다이렉트됐을 때, 사용자가 왜 로그아웃됐는지
즉시 알 수 있도록 sonner 토스트를 띄운다 ("토스트 후 이동" 결정).

근거: `docs/adr.md` ADR-F26, ADR-F08(sonner 토스트), ADR-F24(sonner 토큰 매핑).

**범위 외**:
- 401 변환/리다이렉트 → phase 1 (이미 처리).
- signin 의 기존 인라인 에러 배너(`bg-expense/10 ...`)는 모든 error 유형 공통이므로 **유지**. 토스트는 만료(auth) 케이스 보강용.

---

## 배경 (현재 코드)

`src/app/auth/signin/page.tsx` 는 Server Component.
- `searchParams` 에서 `error`, `message` 를 읽어 인라인 배너로 표시 중.
- `error === "auth"` → 만료 케이스. 기존 배너 문구: "인증이 만료되었습니다. 다시 로그인해주세요."

토스트는 클라이언트에서만 띄울 수 있으므로 작은 `"use client"` 컴포넌트가 필요하다.
sonner `Toaster` 는 이미 `src/app/providers.tsx` 에 마운트됨 (ADR-F24). `toast` 는 `import { toast } from "sonner"`.

## 작업 항목 (2)

### 1. 신규 클라이언트 컴포넌트 — 세션 만료 토스트 트리거

`src/app/auth/signin/_components/SessionExpiredToast.tsx` (또는 signin 디렉터리 규약에 맞는 위치) 신규 생성:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface SessionExpiredToastProps {
  error?: string;
}

/**
 * 세션 만료(error=auth)로 로그인 페이지에 도달했을 때 1회 토스트 고지.
 * 인라인 배너(상시)와 별개로 즉시 인지를 돕는다 (ADR-F26).
 */
export function SessionExpiredToast({ error }: SessionExpiredToastProps) {
  const shown = useRef(false);
  useEffect(() => {
    if (error === "auth" && !shown.current) {
      shown.current = true;
      toast.error("세션이 만료되어 다시 로그인이 필요해요");
    }
  }, [error]);
  return null;
}
```

`useRef` 가드는 StrictMode 의 double-invoke / 리렌더로 토스트가 중복되는 것을 막는다.

### 2. `src/app/auth/signin/page.tsx` — 컴포넌트 마운트

`error` 값을 `SessionExpiredToast` 에 전달한다. 기존 인라인 배너는 그대로 둔다.

```tsx
import { SessionExpiredToast } from "./_components/SessionExpiredToast";
// ...
return (
  <AuthCenterCard ...>
    <SessionExpiredToast error={error} />
    {(error || customMessage) && ( /* 기존 인라인 배너 그대로 */ )}
    <SignInForm callbackUrl={callbackUrl} />
    {/* ... */}
  </AuthCenterCard>
);
```

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/app/auth/signin/_components/SessionExpiredToast.tsx` | 신규 — 만료 토스트 트리거 |
| `src/app/auth/signin/page.tsx` | 수정 — 컴포넌트 마운트 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
pnpm lint
pnpm build 2>&1 | tail -15

# 신규 컴포넌트 존재 + "use client"
head -1 src/app/auth/signin/_components/SessionExpiredToast.tsx | grep -q "use client" && echo "use client OK"

# page 에서 마운트 확인
grep -n "SessionExpiredToast" src/app/auth/signin/page.tsx
```

기대: 토스트 컴포넌트 존재 + `"use client"` 첫 줄, page 에 import+마운트 2건, `pnpm lint`/`pnpm build` 성공.

수동 smoke (`pnpm dev`):
- `/auth/signin?error=auth` 진입 → sonner 토스트 "세션이 만료되어 다시 로그인이 필요해요" + 인라인 배너 동시 표시.
- `/auth/signin` (error 없음) 진입 → 토스트 미표시.

## 의도 메모 (왜)

- 인라인 배너를 토스트로 대체하지 않고 둘 다 둔 이유: 배너는 network/profile/OAuth 등 모든 error 유형 공통이라 제거 불가. 토스트는 만료 케이스의 즉시 인지를 보강 (한쪽은 상시 배너, 한쪽은 일시 토스트).
- 토스트 메시지를 평이한 한국어로 둔 이유: 한국어 표현 정책 (외래어/직역 회피).
