# Phase 02 — Error state (App Router error.tsx)

**Model**: sonnet
**Status**: pending
**Goal**: handoff Screen 14 적용 — Next.js App Router 의 `error.tsx` 글로벌 + 라우트별 boundary 에서 동일 시각 패턴 (AlertCircle 88px round + 제목/부제 + DEV ONLY 디버그 박스 + "다시 시도" CTA + "홈으로" 보조 링크) 표시.

## Context (자기완결)

- handoff 참조: `mobile-landing-auth.jsx` line 598~666 (MobileErrorState)
- App Router 의 `error.tsx`:
  - **반드시 Client Component** (`"use client"` 필수)
  - props: `{ error: Error & { digest?: string }, reset: () => void }`
  - 라우트별 경계 — 위치한 segment 하위에서 발생한 에러를 잡음
- 현재 `src/app/(authenticated)/error.tsx` 또는 `src/app/error.tsx` 존재 여부 점검 (없으면 default Next.js error UI)

## 작업 항목

### 1. `ErrorBoundaryCard` 공용 컴포넌트

`src/components/error/ErrorBoundaryCard.tsx` 신규 (`"use client"`):

```ts
interface ErrorBoundaryCardProps {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;   // default "/"
}
```

구성:
- 외부 wrapper: `min-h-screen bg-bg flex items-center justify-center p-5`
- 카드: `max-w-[360px] w-full flex flex-col items-center text-center`
- 88px round: `bg-expense/10 text-expense` + AlertCircle 44px
- 제목: "문제가 발생했어요" (22px font-bold)
- 부제: "잠시 후 다시 시도해주세요" (13.5px text-fg-muted)
- DEV ONLY 박스 (`process.env.NODE_ENV !== "production"` 일 때만):
  - `bg-bg-elev border-border rounded-xl p-3.5`
  - "DEV ONLY" 라벨 (10.5px font-bold uppercase tracking-wider text-fg-subtle)
  - 본문: `font-mono text-[12px] text-expense break-all`
  - `error.message` + `\nstatus=... digest={error.digest}`
- CTA: "다시 시도" (`h-12 rounded-xl bg-brand-500 text-white`) → `onClick={reset}`
- 보조: "홈으로" → `<Link>` text-fg-muted 13px font-semibold

### 2. 글로벌 `error.tsx`

`src/app/error.tsx` 신규 (`"use client"`):

```tsx
"use client";
import { ErrorBoundaryCard } from "@/components/error/ErrorBoundaryCard";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryCard error={error} reset={reset} />;
}
```

### 3. `(authenticated)` 그룹 error boundary

`src/app/(authenticated)/error.tsx` 신규 (`"use client"`) — 인증 영역 전반의 에러 캐치. 동일 카드 사용 + `homeHref="/dashboard"` 로 보조 링크 변경.

### 4. `global-error.tsx` (root layout 에러용)

App Router 는 root layout 자체에서 에러 발생 시 `app/global-error.tsx` 필요 — `<html>` / `<body>` 자체 렌더 책임.

`src/app/global-error.tsx` 신규 (`"use client"`):

```tsx
"use client";
import { ErrorBoundaryCard } from "@/components/error/ErrorBoundaryCard";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundaryCard error={error} reset={reset} />
      </body>
    </html>
  );
}
```

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/012-empty-error-loading-states

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/error/ErrorBoundaryCard.tsx
test -f src/app/error.tsx
test -f src/app/global-error.tsx
test -f src/app/\(authenticated\)/error.tsx

# 모두 "use client" 첫 줄
head -1 src/app/error.tsx src/app/global-error.tsx src/app/\(authenticated\)/error.tsx | grep -c 'use client'   # == 3

# AlertCircle 사용
grep -nE 'AlertCircle' src/components/error/ErrorBoundaryCard.tsx | wc -l   # >= 1

# 하드코딩 색 0
! grep -nE 'bg-red-|text-red-|text-gray-' src/components/error/ErrorBoundaryCard.tsx

# production 번들에 DEV ONLY 텍스트 / error.message 잔재 0 (자동 검증)
NODE_ENV=production pnpm build
if grep -rq 'DEV ONLY' .next/static/ 2>/dev/null; then
  echo "❌ production 번들에 'DEV ONLY' 텍스트 노출 — process.env.NODE_ENV 분기 점검"
  exit 1
fi
```

수동 smoke:
- `(authenticated)/dashboard/page.tsx` 에 임시 `throw new Error("test")` 삽입 → AlertCircle 카드 표시 + DEV 박스에 메시지
- "다시 시도" 클릭 → reset() 으로 boundary 재시도
- production build (`pnpm build && pnpm start`) → DEV 박스 미표시 (위 자동 grep 가 1차 안전망, 수동 smoke 가 최종 확인)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/error/ErrorBoundaryCard.tsx` | 신규 (use client) |
| `src/app/error.tsx` | 신규 (use client) |
| `src/app/global-error.tsx` | 신규 (use client + html/body) |
| `src/app/(authenticated)/error.tsx` | 신규 (use client) |

## Out of Scope

- 에러 리포팅 (Sentry / 자체 telemetry) wiring — 별도 plan
- 404 not-found.tsx — 본 plan 은 5xx / unexpected 에러만. 404 는 후속
- 인라인 에러 (form validation / Server Action 결과) — toast 로 이미 처리, 본 plan 미수정

## Risks

| 리스크 | 완화 |
|---|---|
| `error.tsx` 가 server component 로 작성되면 Next.js 빌드 에러 | 모든 파일 첫 줄 `"use client"` 강제. verification 에서 grep |
| DEV 박스가 production 에 노출 | `process.env.NODE_ENV` 분기 + verification 의 production build 수동 smoke |
| `global-error.tsx` 가 `<html>` 미포함 시 hydration 사고 | handoff 예시 그대로 html/body wrap |
| reset() 호출 후에도 에러 재발 시 무한 루프 시각 | 본 plan 미해결 (Next.js 표준 동작). 사용자가 "홈으로" 보조 링크로 빠져나갈 수 있게 보장 |
